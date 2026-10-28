import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiClient } from '../api/apiClient';
import { playEmergencySiren } from '../utils/soundPlayer';

// Configure top-level notification presentation behaviour
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isSos = notification?.request?.content?.data?.type === 'SOS_TRIGGERED' ||
      notification?.request?.content?.title?.includes('SOS');

    if (isSos) {
      playEmergencySiren(false).catch(() => {});
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
 * Bypasses DND, sets MAX importance, and triggers high-decibel alarm
 */
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('emergency_sos_siren_channel', {
        name: 'Emergency SOS Siren Alert',
        description: 'Critical life-safety alarms that sound immediately even when phone is locked or on silent.',
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
      console.log('✅ [NotificationService] Emergency SOS Siren Channel configured');
    } catch (e) {
      console.warn('[NotificationService] Channel setup notice:', e?.message);
    }
  }
}

/**
 * Request notification permissions and register push device token with server
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

    let pushToken = null;
    try {
      const expoToken = await Notifications.getExpoPushTokenAsync({
        projectId: '1fbff418-6a14-4ad6-870c-9ba1fb381634',
      });
      pushToken = expoToken?.data;
    } catch (e) {
      try {
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        pushToken = deviceToken?.data;
      } catch (err2) {
        console.warn('[NotificationService] Token fetch error:', err2?.message);
      }
    }

    if (pushToken && authToken) {
      await apiClient.post('/push/register-device', {
        token: pushToken,
        platform: Platform.OS,
      });
      console.log('✅ [NotificationService] Push token registered on server for background sirens:', pushToken.substring(0, 30));
    }

    return pushToken;
  } catch (error) {
    console.warn('[NotificationService] Device registration notice:', error?.message);
    return null;
  }
}

/**
 * Remove device push token upon logout
 */
export async function unregisterPushDeviceToken() {
  try {
    let pushToken = null;
    try {
      const expoToken = await Notifications.getExpoPushTokenAsync({
        projectId: '1fbff418-6a14-4ad6-870c-9ba1fb381634',
      });
      pushToken = expoToken?.data;
    } catch (e) {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      pushToken = deviceToken?.data;
    }

    if (pushToken) {
      await apiClient.post('/push/remove-device', { token: pushToken });
    }
  } catch (e) {}
}

