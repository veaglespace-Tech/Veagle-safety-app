import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { setLocation, setLocationStatus } from '../redux/slices/locationSlice';
import { sosApi } from '../api/sosApi';

// Key stored in AsyncStorage so we only show the disclosure dialog once ever
const BG_LOCATION_PROMPTED_KEY = 'bg_location_disclosed_v1';

/**
 * Background GPS location tracker
 * - Safe permissions check (background dialog shown only ONCE, then never again)
 * - Updates Redux store with current coords
 * - Sends updates to backend during active SOS session
 */
export function useLocation() {
  const dispatch = useDispatch();
  const { activeSession } = useSelector((state) => state.sos);
  const locationSubscription = useRef(null);

  useEffect(() => {
    let mounted = true;

    const startTracking = async () => {
      try {
        // ── Step 1: Foreground permission ────────────────────────────────────
        const perm = await Location.requestForegroundPermissionsAsync().catch(() => null);
        if (!perm || perm.status !== 'granted') {
          if (mounted) dispatch(setLocationStatus('DENIED'));
          return;
        }

        // ── Step 2: Background permission — show disclosure ONLY ONCE ────────
        const bgStatus = await Location.getBackgroundPermissionsAsync().catch(() => ({ status: 'undetermined' }));

        if (bgStatus.status !== 'granted') {
          // Check if we already showed the disclosure dialog in a past session
          const alreadyPrompted = await AsyncStorage.getItem(BG_LOCATION_PROMPTED_KEY).catch(() => null);

          if (alreadyPrompted === 'true') {
            // User has seen the dialog before — silently request without showing Alert again
            await Location.requestBackgroundPermissionsAsync().catch(() => null);
          } else {
            // First-ever time: show Google Play required prominent disclosure
            await new Promise((resolve) => {
              Alert.alert(
                'Background Location Access',
                'SakhiSuraksha collects location data to enable continuous real-time SOS tracking and to broadcast your live position to your emergency contacts even when the app is closed or not in use. This continuous tracking is critical for your safety during an active SOS.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                      // Mark as shown so we don't nag them again
                      AsyncStorage.setItem(BG_LOCATION_PROMPTED_KEY, 'true').catch(() => {});
                      resolve(false);
                    },
                  },
                  {
                    text: 'I Understand',
                    onPress: async () => {
                      // Mark as shown before requesting so it's persisted even on crash
                      await AsyncStorage.setItem(BG_LOCATION_PROMPTED_KEY, 'true').catch(() => {});
                      await Location.requestBackgroundPermissionsAsync().catch(() => null);
                      resolve(true);
                    },
                  },
                ],
              );
            });
          }
        }

        // ── Step 3: Get initial position ─────────────────────────────────────
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);

        if (mounted && initial?.coords) {
          dispatch(setLocation({
            latitude:  initial.coords.latitude,
            longitude: initial.coords.longitude,
            accuracy:  Math.round(initial.coords.accuracy || 10),
          }));
          dispatch(setLocationStatus('LIVE'));
        }

        // ── Step 4: Continuous watch ─────────────────────────────────────────
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 15000 },
          (loc) => {
            if (mounted && loc?.coords) {
              dispatch(setLocation({
                latitude:  loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy:  Math.round(loc.coords.accuracy || 10),
              }));
            }
          },
        ).catch(() => null);

        if (mounted && sub) {
          locationSubscription.current = sub;
        } else if (sub) {
          sub.remove();
        }
      } catch (e) {
        if (mounted) dispatch(setLocationStatus('OFFLINE'));
      }
    };

    startTracking();
    return () => {
      mounted = false;
      if (locationSubscription.current && typeof locationSubscription.current.remove === 'function') {
        locationSubscription.current.remove();
      }
    };
  }, [dispatch]);

  // High-precision live GPS tracking and sync to backend during active SOS
  const { latitude, longitude, accuracy } = useSelector((state) => state.location);
  const lastSyncTimeRef = useRef(0);
  const lastSyncCoordsRef = useRef({ lat: null, lng: null });

  // 1. High-frequency watcher active ONLY during emergency SOS session
  useEffect(() => {
    if (!activeSession) return;

    let mounted = true;
    let highPrecisionSub = null;

    const startEmergencyTracking = async () => {
      try {
        highPrecisionSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1, // update on 1 meter movement
            timeInterval: 2000,   // update every 2 seconds
          },
          (loc) => {
            if (mounted && loc?.coords) {
              dispatch(setLocation({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                accuracy: Math.round(loc.coords.accuracy || 10),
              }));
            }
          }
        ).catch(() => null);
      } catch (e) {
        console.warn('[useLocation] High precision watcher error:', e?.message);
      }
    };

    startEmergencyTracking();

    return () => {
      mounted = false;
      if (highPrecisionSub && typeof highPrecisionSub.remove === 'function') {
        highPrecisionSub.remove();
      }
    };
  }, [activeSession?.id, dispatch]);

  // 2. 3-second continuous heartbeat sync to backend (matching web client useBrowserLocation)
  useEffect(() => {
    if (!activeSession) return;

    let isSyncing = false;

    const sendUpdate = async () => {
      if (isSyncing) return;
      isSyncing = true;
      try {
        let curLat = latitude;
        let curLng = longitude;
        let curAcc = accuracy;

        // If coordinates not ready in Redux, query current position immediately
        if (!curLat || !curLng) {
          const fresh = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          }).catch(() => null);

          if (fresh?.coords) {
            curLat = fresh.coords.latitude;
            curLng = fresh.coords.longitude;
            curAcc = Math.round(fresh.coords.accuracy || 10);
            dispatch(setLocation({
              latitude: curLat,
              longitude: curLng,
              accuracy: curAcc,
            }));
          }
        }

        if (curLat && curLng) {
          await sosApi.updateSosLocation({
            sosSessionId: activeSession.id,
            latitude: curLat,
            longitude: curLng,
            accuracy: curAcc || 10,
          });
          lastSyncTimeRef.current = Date.now();
          lastSyncCoordsRef.current = { lat: curLat, lng: curLng };
          console.log(`[useLocation] Live SOS GPS broadcasted: ${curLat}, ${curLng} (±${curAcc || 10}m)`);
        }
      } catch (e) {
        console.warn('[useLocation] GPS broadcast error:', e?.response?.data || e?.message);
      } finally {
        isSyncing = false;
      }
    };

    // Immediate sync on SOS activation
    sendUpdate();

    // 3-second interval continuous sync to backend
    const interval = setInterval(sendUpdate, 3000);
    return () => clearInterval(interval);
  }, [activeSession?.id, latitude, longitude, accuracy, dispatch]);
}

