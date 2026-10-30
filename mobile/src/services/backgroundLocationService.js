import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/apiClient';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND-EMERGENCY-LOCATION-TASK';
export const ACTIVE_SOS_ID_KEY = '@sakhi_active_sos_id';

// 1. Define headless background location task that executes even when app is killed / swiped away
try {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('[BackgroundLocationTask] Execution error:', error.message);
      return;
    }
    if (!data) return;

    const { locations } = data;
    if (!locations || locations.length === 0) return;

    const latest = locations[locations.length - 1];
    const { coords } = latest;
    if (!coords) return;

    const lat = coords.latitude;
    const lng = coords.longitude;
    const acc = Math.round(coords.accuracy || 10);

    try {
      const activeSosId = await AsyncStorage.getItem(ACTIVE_SOS_ID_KEY);
      if (!activeSosId) {
        // No active SOS session recorded — stop background tracking to conserve battery
        const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
        if (isRunning) {
          await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
        }
        return;
      }

      await apiClient.post('/sos/location', {
        sosSessionId: parseInt(activeSosId, 10),
        latitude: lat,
        longitude: lng,
        accuracy: acc,
      });
      console.log(`📡 [BackgroundLocationTask] Headless SOS GPS broadcasted: ${lat}, ${lng} (±${acc}m)`);
    } catch (err) {
      console.warn('[BackgroundLocationTask] Broadcast notice:', err?.response?.data || err?.message);
    }
  });
  console.log('✅ [BackgroundLocationService] Headless background location task defined');
} catch (e) {
  console.warn('[BackgroundLocationService] DefineTask error:', e?.message);
}

/**
 * Start high-precision background location tracking with persistent Android Foreground Service
 * Keeps running continuously even when phone is locked, minimized, or the app is completely killed/swiped away.
 * @param {number|string} sosSessionId - The active SOS session ID
 */
export async function startBackgroundLocationTracking(sosSessionId) {
  if (Platform.OS === 'web') return false;

  try {
    if (sosSessionId) {
      await AsyncStorage.setItem(ACTIVE_SOS_ID_KEY, String(sosSessionId));
    }

    // 1. Verify foreground permission
    const fg = await Location.getForegroundPermissionsAsync().catch(() => null);
    if (fg?.status !== 'granted') {
      const reqFg = await Location.requestForegroundPermissionsAsync().catch(() => null);
      if (reqFg?.status !== 'granted') {
        console.warn('[BackgroundLocation] Foreground permission not granted');
        return false;
      }
    }

    // 2. Request background permission if not granted yet
    const bg = await Location.getBackgroundPermissionsAsync().catch(() => null);
    if (bg?.status !== 'granted') {
      await Location.requestBackgroundPermissionsAsync().catch(() => null);
    }

    // 3. Start high-frequency location updates bound to Android Foreground Service
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (!hasStarted) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,      // Continuous updates every 3 seconds
        distanceInterval: 1,     // Or every 1 meter movement
        deferredUpdatesInterval: 3000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: '🚨 Emergency SOS Live Tracking Active',
          notificationBody: 'SakhiSuraksha is continuously sharing your live location with your emergency contacts.',
          notificationColor: '#FF2A6D',
          killServiceOnDestroy: false, // CRITICAL: Keeps service running even when user swipes away/kills app!
        },
      });
      console.log('✅ [BackgroundLocation] Persistent foreground service started for SOS session:', sosSessionId);
    }
    return true;
  } catch (err) {
    console.warn('[BackgroundLocation] Start error:', err?.message);
    return false;
  }
}

/**
 * Stop background location tracking and cleanly dismiss the persistent foreground notification
 */
export async function stopBackgroundLocationTracking() {
  if (Platform.OS === 'web') return;

  try {
    await AsyncStorage.removeItem(ACTIVE_SOS_ID_KEY);
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
      console.log('🛑 [BackgroundLocation] Background tracking & foreground service stopped');
    }
  } catch (err) {
    console.warn('[BackgroundLocation] Stop error:', err?.message);
  }
}

