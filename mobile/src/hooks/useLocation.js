import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { setLocation, setLocationStatus } from '../redux/slices/locationSlice';
import { sosApi } from '../api/sosApi';

/**
 * Background GPS location tracker
 * - Safe permissions check
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
        const perm = await Location.requestForegroundPermissionsAsync().catch(() => null);
        if (!perm || perm.status !== 'granted') {
          if (mounted) dispatch(setLocationStatus('DENIED'));
          return;
        }

        // Get initial position with Balanced accuracy (faster, less power, doesn't lock up indoors)
        const initial = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);

        if (mounted && initial?.coords) {
          dispatch(setLocation({
            latitude: initial.coords.latitude,
            longitude: initial.coords.longitude,
            accuracy: Math.round(initial.coords.accuracy || 10),
          }));
          dispatch(setLocationStatus('LIVE'));
        }

        // Watch position
        const sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 15000 },
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

  // Send location updates to server during active SOS
  const { latitude, longitude, accuracy } = useSelector((state) => state.location);
  useEffect(() => {
    if (!activeSession || !latitude || !longitude) return;

    const interval = setInterval(async () => {
      try {
        await sosApi.updateSosLocation({
          sosSessionId: activeSession.id,
          latitude,
          longitude,
          accuracy: accuracy || 10,
        });
      } catch (e) {}
    }, 15000);
    return () => clearInterval(interval);
  }, [activeSession, latitude, longitude, accuracy]);
}
