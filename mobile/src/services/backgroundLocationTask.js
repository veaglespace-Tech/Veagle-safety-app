import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sosApi } from '../api/sosApi';
import { API_URL, TOKEN_KEY } from '../utils/constants';

export const BACKGROUND_SOS_LOCATION_TASK = 'BACKGROUND_SOS_LOCATION_TASK';

// Define the background task outside of React components for Android/iOS native runtime
if (Platform.OS !== 'web') {
  try {
    TaskManager.defineTask(BACKGROUND_SOS_LOCATION_TASK, async ({ data, error }) => {
      if (error) {
        console.warn('[BackgroundLocationTask] Task error:', error.message);
        return;
      }

      if (data && data.locations && data.locations.length > 0) {
        const latestLoc = data.locations[data.locations.length - 1];
        const { latitude, longitude, accuracy } = latestLoc.coords;

        try {
          const storedSosId = await AsyncStorage.getItem('@active_sos_session_id');
          if (storedSosId) {
            const token = await AsyncStorage.getItem(TOKEN_KEY);
            const headers = {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };

            // Use native fetch to bypass any axios interceptor/react state issues in background headless thread
            await fetch(`${API_URL}/sos/location`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                sosSessionId: parseInt(storedSosId, 10),
                latitude,
                longitude,
                accuracy: Math.round(accuracy || 10),
              }),
            });

            console.log(`[BackgroundLocationTask] Broadcasted GPS from background: ${latitude}, ${longitude}`);
          }
        } catch (err) {
          console.warn('[BackgroundLocationTask] Failed to broadcast background location:', err?.message);
        }
      }
    });
  } catch (e) {
    // Non-fatal if TaskManager is initializing
  }
}

/**
 * Start background location tracking ONLY during active SOS
 */
export async function startBackgroundSosTracking(sosSessionId) {
  if (Platform.OS === 'web') return;
  try {
    if (!sosSessionId) return;

    // Store active SOS session ID in AsyncStorage for the background task to read
    await AsyncStorage.setItem('@active_sos_session_id', String(sosSessionId));

    // Request permissions if not already granted
    const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      const { status: reqFg } = await Location.requestForegroundPermissionsAsync();
      if (reqFg !== 'granted') return;
    }

    const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      await Location.requestBackgroundPermissionsAsync().catch(() => {});
    }

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SOS_LOCATION_TASK);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(BACKGROUND_SOS_LOCATION_TASK, {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 3000, // Every 3 seconds
        distanceInterval: 1, // Update on 1 meter movement or stationary timer
        deferredUpdatesInterval: 3000,
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: '🚨 SAKHI SOS IS ACTIVE',
          notificationBody: 'Broadcasting your live location to Guardians & Emergency Services.',
          notificationColor: '#FF2A6D',
        },
      });
      console.log('[BackgroundLocationTask] Background tracking started successfully with Foreground Service');
    }
  } catch (err) {
    console.warn('[BackgroundLocationTask] Error starting background tracking:', err?.message);
  }
}

/**
 * Stop background location tracking when SOS is resolved
 */
export async function stopBackgroundSosTracking() {
  if (Platform.OS === 'web') return;
  try {
    await AsyncStorage.removeItem('@active_sos_session_id');

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SOS_LOCATION_TASK);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_SOS_LOCATION_TASK);
      console.log('[BackgroundLocationTask] Background tracking stopped');
    }
  } catch (err) {
    console.warn('[BackgroundLocationTask] Error stopping background tracking:', err?.message);
  }
}
