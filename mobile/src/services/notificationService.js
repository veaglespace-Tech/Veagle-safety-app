import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import Constants from 'expo-constants';
import { apiClient } from '../api/apiClient';
import { playEmergencySiren } from '../utils/soundPlayer';
import { navigate } from '../navigation/navigationRef';

// Helper to safely obtain RN Firebase Messaging instance on native platforms (iOS / Android)
function getNativeMessaging() {
  if (Platform.OS === 'web') return null;
  try {
    const rnfMessaging = require('@react-native-firebase/messaging');
    if (typeof rnfMessaging.getMessaging === 'function') {
      return rnfMessaging.getMessaging();
    }
    if (typeof rnfMessaging.default === 'function') {
      return rnfMessaging.default();
    }
    if (typeof rnfMessaging === 'function') {
      return rnfMessaging();
    }
  } catch (e) {
    console.warn('[NotificationService] Native messaging load notice:', e?.message);
  }
  return null;
}

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-EMERGENCY-SOS-TASK';
const EAS_PROJECT_ID = '7ab3fa26-39e9-4fc7-82af-b3857b4157f6';

// ---------------------------------------------------------------------------
// 0. Deduplication & Victim Safety Filter
// ---------------------------------------------------------------------------
const processedNotificationIds = new Set();
function isDuplicateNotification(notificationId) {
  if (!notificationId) return false;
  if (processedNotificationIds.has(notificationId)) return true;
  processedNotificationIds.add(notificationId);
  // Keep set bounded to last 100 IDs
  if (processedNotificationIds.size > 100) {
    const firstItem = processedNotificationIds.values().next().value;
    processedNotificationIds.delete(firstItem);
  }
  return false;
}

/**
 * Checks whether this notification is an emergency SOS alert that SHOULD ring the siren.
 * CRITICAL SAFETY RULE: Never ring the siren on the victim's own device!
 */
export function shouldPlaySirenForNotification(remoteMessageOrData) {
  if (!remoteMessageOrData) return false;
  const data = remoteMessageOrData?.data || remoteMessageOrData || {};
  const isSos =
    data.type === 'SOS_TRIGGERED' ||
    data.type === 'CRITICAL_SOS' ||
    data.type === 'SOS_EMERGENCY' ||
    data.type === 'EMERGENCY' ||
    remoteMessageOrData?.notification?.title?.includes('SOS') ||
    data.title?.includes('SOS');

  if (!isSos) return false;

  try {
    // Lazily resolve store to avoid circular dependency during bootstrap
    const { store } = require('../redux/store');
    const state = store?.getState?.();
    const sosState = state?.sos;
    const user = state?.auth?.user;

    const currentUserId = user?.id || user?._id || user?.userId;
    const currentUserEmail = (user?.email || '').trim().toLowerCase();
    const currentUserPhone = (user?.phone || '').replace(/\D/g, '');

    // 1. If this device triggered SOS or is in active SOS -> NEVER ring siren on this device
    const isRecentlyTriggered = sosState?.lastTriggeredAt && (Date.now() - sosState.lastTriggeredAt < 120000);
    if (sosState?.isTriggering || isRecentlyTriggered || sosState?.activeSession) {
      console.log('🔇 [NotificationService] Suppressing siren: device actively triggered / in active SOS');
      return false;
    }

    // 2. If the user logged into this device is a regular USER -> NEVER ring siren for guardian notifications
    if (String(user?.role || '').toUpperCase() === 'USER') {
      console.log('🔇 [NotificationService] Suppressing siren: regular user role does not receive guardian siren');
      return false;
    }

    // 3. Multi-backend victim ID matching
    const incomingVictimId =
      data.victimId ||
      data.victim_id ||
      data.userId ||
      data.user_id ||
      data.senderId ||
      data.sender_id ||
      data.user?.id ||
      data.user?._id ||
      data.session?.userId ||
      data.session?.victimId ||
      data.id;

    if (currentUserId && incomingVictimId && String(currentUserId) === String(incomingVictimId)) {
      console.log('🔇 [NotificationService] Suppressing siren: current logged-in user matches victim ID');
      return false;
    }

    // 4. Multi-backend email matching
    const incomingEmail = (
      data.victimEmail ||
      data.userEmail ||
      data.email ||
      data.user?.email ||
      ''
    ).trim().toLowerCase();

    if (currentUserEmail && incomingEmail && currentUserEmail === incomingEmail) {
      console.log('🔇 [NotificationService] Suppressing siren: current user email matches victim');
      return false;
    }

    // 5. Multi-backend phone matching
    const incomingPhone = (
      data.victimPhone ||
      data.userPhone ||
      data.phone ||
      data.user?.phone ||
      ''
    ).replace(/\D/g, '');

    if (currentUserPhone && incomingPhone && currentUserPhone.slice(-10) === incomingPhone.slice(-10)) {
      console.log('🔇 [NotificationService] Suppressing siren: current user phone matches victim');
      return false;
    }
  } catch (e) {
    console.warn('[NotificationService] Victim check notice:', e?.message);
  }

  return true;
}

// ---------------------------------------------------------------------------
// 1. Headless Background Handler for Native Firebase Cloud Messaging
// MUST be registered early before React App initialization
// ---------------------------------------------------------------------------
export function setupFirebaseBackgroundMessageHandler() {
  if (Platform.OS === 'web') return;

  try {
    const messaging = getNativeMessaging();
    if (!messaging || typeof messaging.setBackgroundMessageHandler !== 'function') {
      return;
    }

    messaging.setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('🚨 [FCM Native Background] Message received in background/killed state:', remoteMessage?.messageId);

      const msgId = remoteMessage?.messageId || remoteMessage?.data?.sosId;
      if (isDuplicateNotification(msgId)) {
        return;
      }

      if (shouldPlaySirenForNotification(remoteMessage)) {
        console.log('🚨 [FCM Native Background] Emergency SOS payload confirmed! Triggering siren for guardian/admin...');
        try {
          await playEmergencySiren(true, 28);
        } catch (err) {
          console.warn('[FCM Background] Siren error:', err?.message);
        }
      }
    });
  } catch (e) {
    console.warn('[FCM Background] setBackgroundMessageHandler notice:', e?.message);
  }
}

// ---------------------------------------------------------------------------
// 2. Legacy Expo TaskManager Background Task (Fallback for Expo Push Service)
// ---------------------------------------------------------------------------
if (Platform.OS !== 'web') {
  try {
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error, executionInfo }) => {
      if (error) {
        console.warn('[BackgroundTask] Execution error:', error.message);
        return;
      }
      const notification = data?.notification;
      const payloadData = notification?.data || data;

      if (shouldPlaySirenForNotification(payloadData)) {
        console.log('🚨 [BackgroundTask] Emergency SOS received via Expo TaskManager! Playing siren for 28s...');
        try {
          await playEmergencySiren(true, 28);
        } catch (err) {}
      }
    });

    Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});
  } catch (e) {
    console.warn('[BackgroundTask] DefineTask notice:', e?.message);
  }
}

// ---------------------------------------------------------------------------
// 3. Configure top-level Expo notification presentation behaviour for foreground
// ---------------------------------------------------------------------------
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      // Audio siren is managed exclusively by messaging.onMessage to avoid dual-playback
      return {
        shouldShowAlert: true,
        shouldPlaySound: false, // Prevent OS notification chime from overlapping with emergency siren WAV
        shouldSetBadge: true,
        shouldShowBanner: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      };
    },
  });
}

// ---------------------------------------------------------------------------
// 4. Configure Android Emergency Siren Notification Channel
// ---------------------------------------------------------------------------
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('emergency_sos_siren_channel', {
        name: 'Emergency SOS Siren Alert',
        description: 'Critical life-safety alarms that sound immediately for 28 seconds even when phone is locked or on silent.',
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

      try {
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      } catch (taskErr) {}
    } catch (e) {
      console.warn('[NotificationService] Channel setup notice:', e?.message);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Request Native Notification Permissions (Android 13+ & iOS APNs)
// ---------------------------------------------------------------------------
export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return false;

  try {
    if (Platform.OS === 'ios') {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        if (existingStatus !== 'granted') {
          await Notifications.requestPermissionsAsync({
            ios: {
              allowAlert: true,
              allowBadge: true,
              allowSound: true,
              allowAnnouncements: false,
            },
          });
        }
      } catch (expoErr) {}

      const messaging = getNativeMessaging();
      if (messaging && typeof messaging.requestPermission === 'function') {
        const authStatus = await messaging.requestPermission({
          alert: true,
          announcement: false,
          badge: true,
          carPlay: true,
          provisional: false,
          sound: true,
        });
        const enabled =
          authStatus === 1 || // AuthorizationStatus.AUTHORIZED
          authStatus === 2;   // AuthorizationStatus.PROVISIONAL
        return enabled;
      }
      return true;
    }

    // Android / Fallback
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    console.warn('[NotificationService] Permission request error:', err?.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. Direct Native Google FCM Token Registration with Backend Server
// Exclusively registers Native FCM Token (NO Expo account / Push Token)
// ---------------------------------------------------------------------------
export async function registerPushDeviceToken(authToken) {
  if (Platform.OS === 'web') return null;

  try {
    await setupNotificationChannels();

    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.log('[NotificationService] Push notification permission not granted');
      return null;
    }

    // Direct Native Google FCM Token (iOS & Android)
    let nativeFcmToken = null;
    const messaging = getNativeMessaging();

    if (messaging) {
      if (Platform.OS === 'ios' && typeof messaging.registerDeviceForRemoteMessages === 'function') {
        try {
          await messaging.registerDeviceForRemoteMessages();
        } catch (regErr) {
          console.warn('[NotificationService] registerDeviceForRemoteMessages notice:', regErr?.message);
        }
      }

      if (typeof messaging.getToken === 'function') {
        try {
          nativeFcmToken = await messaging.getToken();
        } catch (fcmErr) {
          console.error('❌ [NotificationService] Native FCM getToken error:', fcmErr?.message);
        }
      }
    } else {
      console.warn('⚠️ [NotificationService] Native Firebase Messaging module not available');
    }

    if (!nativeFcmToken || typeof nativeFcmToken !== 'string' || nativeFcmToken.length < 10) {
      console.warn('⚠️ [NotificationService] No valid Native FCM token acquired. Skipping registration.');
      return null;
    }

    console.log(`✅ [NotificationService] Acquired Direct Native FCM Token for ${Platform.OS}: ${nativeFcmToken.substring(0, 25)}...`);

    // Register pure Native FCM token with backend
    try {
      await apiClient.post(
        '/push/register-device',
        {
          token: nativeFcmToken,
          platform: Platform.OS, // 'android' or 'ios'
        },
        authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
      );
      console.log('🚀 [NotificationService] Native FCM token successfully registered on backend');
    } catch (postErr) {
      console.warn('❌ [NotificationService] Native FCM token upload error:', postErr?.message);
    }

    return nativeFcmToken;
  } catch (error) {
    console.warn('[NotificationService] Device registration error:', error?.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 7. Token Invalidation on Logout
// ---------------------------------------------------------------------------
export async function unregisterPushDeviceToken() {
  if (Platform.OS === 'web') return;

  try {
    const messaging = getNativeMessaging();
    if (messaging && typeof messaging.getToken === 'function') {
      try {
        const nativeFcmToken = await messaging.getToken();
        if (nativeFcmToken) {
          await apiClient.post('/push/remove-device', { token: nativeFcmToken }).catch(() => {});
        }
      } catch (e) {}

      if (typeof messaging.deleteToken === 'function') {
        await messaging.deleteToken().catch(() => {});
      }
    }
  } catch (e) {}
}

// ---------------------------------------------------------------------------
// 8. Setup Full FCM Listeners (Foreground, Background Click, Terminated State, Token Refresh)
// ---------------------------------------------------------------------------
export function setupFcmListeners(authToken) {
  if (Platform.OS === 'web') {
    return () => {};
  }

  const messaging = getNativeMessaging();
  if (!messaging) {
    return () => {};
  }

  // On iOS, explicitly suppress native APNs hardware sound in foreground
  if (Platform.OS === 'ios' && typeof messaging.setForegroundNotificationPresentationOptions === 'function') {
    messaging.setForegroundNotificationPresentationOptions({
      alert: true,
      badge: true,
      sound: false,
    }).catch(() => {});
  }

  const unsubscribers = [];

  // A. Listen for FCM Token Refresh
  if (typeof messaging.onTokenRefresh === 'function') {
    const unsubToken = messaging.onTokenRefresh(async (newToken) => {
      console.log('🔄 [FCM] Token refreshed:', newToken.substring(0, 20) + '...');
      try {
        await apiClient.post(
          '/push/register-device',
          {
            token: newToken,
            platform: Platform.OS,
          },
          authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : undefined
        );
      } catch (err) {
        console.warn('[FCM] Failed to update refreshed token:', err?.message);
      }
    });
    if (typeof unsubToken === 'function') unsubscribers.push(unsubToken);
  }

  // B. Foreground FCM Message Handler
  if (typeof messaging.onMessage === 'function') {
    const unsubMsg = messaging.onMessage(async (remoteMessage) => {
      console.log('📩 [FCM Foreground] Message received:', remoteMessage?.notification?.title);
      const msgId = remoteMessage?.messageId || remoteMessage?.data?.sosId;
      if (isDuplicateNotification(msgId)) return;

      if (shouldPlaySirenForNotification(remoteMessage)) {
        playEmergencySiren(true, 28).catch(() => {});
      }
    });
    if (typeof unsubMsg === 'function') unsubscribers.push(unsubMsg);
  }

  // C. Background -> User Tapped Notification
  if (typeof messaging.onNotificationOpenedApp === 'function') {
    const unsubOpen = messaging.onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 [FCM Notification Opened from Background]:', remoteMessage?.data);
      handleNotificationNavigation(remoteMessage?.data);
    });
    if (typeof unsubOpen === 'function') unsubscribers.push(unsubOpen);
  }

  // D. Terminated App -> User Tapped Notification to Launch App
  if (typeof messaging.getInitialNotification === 'function') {
    messaging
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('🚀 [FCM Initial Notification from Terminated State]:', remoteMessage?.data);
          handleNotificationNavigation(remoteMessage?.data);
        }
      })
      .catch((err) => console.warn('[FCM Initial Notification Error]:', err?.message));
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        if (typeof unsub === 'function') unsub();
      } catch (e) {}
    });
  };
}

// Helper to route user to correct emergency screen when notification is tapped
function handleNotificationNavigation(data) {
  if (!data) return;
  const isSos = data?.type === 'SOS_TRIGGERED' || data?.type === 'CRITICAL_SOS';
  if (isSos) {
    if (shouldPlaySirenForNotification(data)) {
      playEmergencySiren(true, 28).catch(() => {});
    }
    navigate('ActiveSOS', {
      sosId: data?.sosId,
      victimName: data?.victimName,
      trackingUrl: data?.trackingUrl,
      latitude: data?.latitude,
      longitude: data?.longitude,
    });
  }
}
