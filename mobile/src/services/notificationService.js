import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { apiClient } from '../api/apiClient';
import { playEmergencySiren } from '../utils/soundPlayer';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-EMERGENCY-SOS-TASK';
const EAS_PROJECT_ID = '05652986-18cc-4084-889d-7b4b19bbbc36';

// 1. Define headless background task that executes even when app is killed/swiped away
try {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
    if (error) {
      console.warn('[BackgroundTask] Execution error:', error.message);
      return;
    }
    const notification = data?.notification;
    const isSos = notification?.data?.type === 'SOS_TRIGGERED' ||
      notification?.title?.includes('SOS') ||
      data?.type === 'SOS_TRIGGERED';

    if (isSos) {
      console.log('🚨 [BackgroundTask] Emergency SOS received in background! Playing siren for 60s...');
      try {
        await playEmergencySiren(true, 60);
      } catch (err) {}
    }
  });

  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});
} catch (e) {
  console.warn('[BackgroundTask] DefineTask notice:', e?.message);
}

// 2. Configure top-level notification presentation behaviour for foreground / unlocked state
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isSos = notification?.request?.content?.data?.type === 'SOS_TRIGGERED' ||
      notification?.request?.content?.title?.includes('SOS');

    if (isSos) {
      playEmergencySiren(true, 60).catch(() => {});
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    };
  },
});

/**
 * Configure Android Emergency Siren Notification Channel
 * Bypasses DND, sets MAX importance, and triggers high-decibel alarm for 60 seconds
 */
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    try {
      // Recreate channel if already cached so Android OS binds the fresh 60s alarm_siren.wav
      try {
        await Notifications.deleteNotificationChannelAsync('emergency_sos_siren_channel');
      } catch (delErr) {}

      await Notifications.setNotificationChannelAsync('emergency_sos_siren_channel', {
        name: 'Emergency SOS Siren Alert',
        description: 'Critical life-safety alarms that sound immediately for 60 seconds even when phone is locked or on silent.',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 200, 500, 200, 500],
        sound: 'alarm_siren.wav',
        enableLights: true,
        lightColor: '#FF2A6D',
        enableVibrate: true,
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.ALARM,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      });
      console.log('✅ [NotificationService] Emergency SOS Siren Channel configured (60s alarm)');

      // Ensure background notification task is active
      try {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      } catch (taskErr) {}
    } catch (e) {
      console.warn('[NotificationService] Channel setup notice:', e?.message);
    }
  }
}

/**
 * Request notification permissions and register push device tokens with server
 * Registers BOTH Native FCM token (for Firebase Admin) AND Expo push token (for Expo Push Service)
 * @param {string} authToken - Logged-in user auth JWT token
 */
export async function registerPushDeviceToken(authToken) {
  try {
    await setupNotificationChannels();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Push notification permission not granted');
      return null;
    }

    const tokensToRegister = [];

    // 1. Fetch Native FCM Device Token (Matches google-services.json & server Firebase Admin SDK)
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      if (deviceToken?.data && typeof deviceToken.data === 'string' && deviceToken.data.length > 10) {
        tokensToRegister.push(deviceToken.data);
      }
    } catch (fcmErr) {
      console.warn('[NotificationService] Native FCM device token error:', fcmErr?.message);
    }

    // 2. Fetch Expo Push Token (Matches Expo push service)
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || EAS_PROJECT_ID;
      const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
      if (expoToken?.data && typeof expoToken.data === 'string' && !tokensToRegister.includes(expoToken.data)) {
        tokensToRegister.push(expoToken.data);
      }
    } catch (expoErr) {
      console.warn('[NotificationService] Expo push token error:', expoErr?.message);
    }

    // Register each acquired token with the backend server
    for (const t of tokensToRegister) {
      try {
        await apiClient.post('/push/register-device', {
          token: t,
          platform: Platform.OS,
        });
        console.log('✅ [NotificationService] Push token registered on server:', t.substring(0, 25) + '...');
      } catch (postErr) {
        console.warn('[NotificationService] Push token upload error:', postErr?.message);
      }
    }

    return tokensToRegister[0] || null;
  } catch (error) {
    console.warn('[NotificationService] Device registration notice:', error?.message);
    return null;
  }
}

/**
 * Remove device push tokens upon logout
 */
export async function unregisterPushDeviceToken() {
  try {
    const tokensToRemove = [];

    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      if (deviceToken?.data) tokensToRemove.push(deviceToken.data);
    } catch (e) {}

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || EAS_PROJECT_ID;
      const expoToken = await Notifications.getExpoPushTokenAsync({ projectId });
      if (expoToken?.data && !tokensToRemove.includes(expoToken.data)) {
        tokensToRemove.push(expoToken.data);
      }
    } catch (e) {}

    for (const t of tokensToRemove) {
      try {
        await apiClient.post('/push/remove-device', { token: t });
      } catch (err) {}
    }
  } catch (e) {}
}
