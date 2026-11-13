import admin from 'firebase-admin';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Looks for serviceAccountKey.json or env credentials
 */
export function initFirebase() {
  if (firebaseInitialized) return admin;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
      path.resolve(process.cwd(), 'serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log('✅ [FCM] Firebase Admin SDK initialized with service account key');
    } else if (process.env.FIREBASE_CONFIG) {
      const config = JSON.parse(process.env.FIREBASE_CONFIG);
      admin.initializeApp({
        credential: admin.cert(config),
      });
      firebaseInitialized = true;
      console.log('✅ [FCM] Firebase Admin SDK initialized with FIREBASE_CONFIG');
    } else {
      console.warn('⚠️ [FCM] No serviceAccountKey.json or FIREBASE_CONFIG found.');
    }
  } catch (error) {
    console.warn('⚠️ [FCM] Initialization warning:', error.message);
  }

  return admin;
}

/**
 * Send High-Priority Emergency Siren Push via Expo Push Service
 * Wakes device from sleep and plays emergency siren on channel: 'emergency_sos_siren_channel'
 */
async function sendExpoEmergencyPush({ tokens, victimId, victimName, sosId, trackingUrl, latitude, longitude }) {
  if (!tokens || tokens.length === 0) return { success: true, count: 0 };

  console.log(`[ExpoPush] Sending emergency siren to ${tokens.length} Expo tokens...`);

  const messages = tokens.map((to) => ({
    to,
    title: '🚨 EMERGENCY SOS ALERT!',
    body: `${victimName} activated SOS! Tap to open live tracker.`,
    data: {
      type: 'SOS_TRIGGERED',
      sosId: String(sosId),
      victimId: String(victimId || ''),
      victimName: String(victimName),
      trackingUrl: String(trackingUrl || ''),
      latitude: String(latitude || ''),
      longitude: String(longitude || ''),
      timestamp: new Date().toISOString(),
    },
    sound: 'alarm_siren.wav',
    priority: 'high',
    channelId: 'emergency_sos_siren_channel',
    _displayInForeground: true,
  }));

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const data = await res.json();
    const tickets = Array.isArray(data?.data) ? data.data : [];
    let successCount = 0;
    let failureCount = 0;

    const { prisma } = await import('../config/prisma.js');

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i];
      if (ticket.status === 'ok') {
        successCount++;
      } else {
        failureCount++;
        const badToken = tokens[i];
        const masked = badToken.length > 10 ? `${badToken.substring(0, 8)}...` : '***';
        console.error(`🚨 [ExpoPush Error] Token #${i} (${masked}):`, ticket.message, ticket.details);

        if (ticket.details?.error === 'DeviceNotRegistered') {
          console.warn(`🧹 [ExpoPush Cleanup] Removing unregistered Expo token from database: ${masked}`);
          await prisma.deviceToken.deleteMany({ where: { token: badToken } }).catch(() => {});
        }
      }
    }

    console.log(`✅ [ExpoPush] Dispatched: ${successCount} success, ${failureCount} failed`);
    return { success: true, successCount, failureCount };
  } catch (err) {
    console.error('❌ [ExpoPush] Network dispatch error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send High-Priority Emergency Siren Push via Native Firebase Admin SDK
 * Configured with Android high-priority & iOS APNs alert & custom/critical sound
 */
async function sendFcmEmergencyPush({ tokens, victimId, victimName, sosId, trackingUrl, latitude, longitude }) {
  if (!tokens || tokens.length === 0) return { success: true, count: 0 };

  const maskedSample = tokens[0].length > 10 ? `${tokens[0].substring(0, 8)}...` : '***';
  console.log(`[FCM] Target tokens count: ${tokens.length}. Sample: ${maskedSample}`);

  initFirebase();

  if (!firebaseInitialized) {
    console.log(`[FCM Mock] Would send emergency siren to ${tokens.length} devices for victim: ${victimName}`);
    return { success: false, reason: 'Firebase not configured' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ANDROID STRATEGY: Send TWO messages per batch:
  //   1. Data-only high-priority message  → wakes Headless JS in killed state
  //      (Android OS must NOT see a "notification" key to invoke JS handler)
  //   2. Notification message              → shows system-tray banner with sound
  //
  // iOS STRATEGY: Single APNs message with sound + content-available wakes
  //   the app in background. iOS killed state relies on APNs sound file.
  //   iOS sound key MUST include .wav extension; Android channel sound MUST NOT.
  // ─────────────────────────────────────────────────────────────────────────────

  const sharedData = {
    type: 'SOS_TRIGGERED',
    isAlarm: 'true',
    sosId: String(sosId),
    victimId: String(victimId || ''),
    victimName: String(victimName),
    trackingUrl: String(trackingUrl || ''),
    latitude: String(latitude || ''),
    longitude: String(longitude || ''),
    timestamp: new Date().toISOString(),
  };

  // ── Message 1: Android DATA-ONLY (wakes Headless JS even when app is killed) ──
  const androidDataOnlyMessage = {
    tokens,
    // NO "notification" key → Android OS hands the full message to JS handler
    data: sharedData,
    android: {
      priority: 'high',
      // No android.notification block → pure data message, JS wakes up
    },
  };

  // ── Message 2: Combined Notification (banner + sound) for all platforms ──
  const message = {
    tokens,
    notification: {
      title: '🚨 EMERGENCY SOS ALERT!',
      body: `${victimName} activated SOS! Tap to open live tracker.`,
    },
    data: sharedData,
    android: {
      priority: 'high',
      notification: {
        channelId: 'emergency_sos_siren_channel',
        // Android res/raw lookup: NO file extension allowed
        sound: 'alarm_siren',
        priority: 'max',
        visibility: 'public',
        defaultVibrateTimings: false,
        vibrateTimingsMillis: [0, 500, 200, 500, 200, 500],
        defaultSound: false,
      },
    },
    apns: {
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
      payload: {
        aps: {
          alert: {
            title: '🚨 EMERGENCY SOS ALERT!',
            body: `${victimName} activated SOS! Tap to open live tracker.`,
          },
          // iOS APNs: file extension IS required
          sound: 'alarm_siren.wav',
          badge: 1,
          'content-available': 1,
          'interruption-level': 'time-sensitive',
        },
      },
    },
  };

  try {
    const messaging = getMessaging();

    // ── Step 1: Android Data-Only message (wakes Headless JS in killed/bg state) ──
    // Only send to tokens — FCM automatically ignores iOS for data-only if apns not set
    let dataOnlySuccess = 0;
    let dataOnlyFail = 0;
    try {
      const dataOnlyResp = await messaging.sendEachForMulticast(androidDataOnlyMessage);
      dataOnlySuccess = dataOnlyResp.successCount;
      dataOnlyFail = dataOnlyResp.failureCount;
      console.log(`✅ [FCM] Data-only wakeup dispatched: ${dataOnlySuccess} success, ${dataOnlyFail} failed`);
    } catch (dataErr) {
      console.warn('[FCM] Data-only wakeup warning:', dataErr.message);
    }

    // ── Step 2: Notification message (banner + sound for all platforms) ──
    const response = await messaging.sendEachForMulticast(message);
    console.log(`✅ [FCM] Emergency Siren notification dispatched: ${response.successCount} success, ${response.failureCount} failed`);

    // Cleanup stale / invalid tokens from database
    if (response.failureCount > 0) {
      const { prisma } = await import('../config/prisma.js');
      for (let idx = 0; idx < response.responses.length; idx++) {
        const resp = response.responses[idx];
        if (!resp.success) {
          const badToken = tokens[idx];
          const maskedToken = badToken.length > 10 ? `${badToken.substring(0, 8)}...` : '***';
          const errCode = resp.error?.code || 'UNKNOWN_ERROR';
          const errMsg = resp.error?.message || 'No description provided';
          console.error(`🚨 [FCM Error] Token #${idx} (${maskedToken}): Code = "${errCode}", Message = "${errMsg}"`);

          if (
            errCode === 'messaging/registration-token-not-registered' ||
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/invalid-argument'
          ) {
            console.warn(`🧹 [FCM Cleanup] Removing stale token from database: ${maskedToken}`);
            await prisma.deviceToken.deleteMany({ where: { token: badToken } }).catch(() => {});
          }
        }
      }
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('❌ [FCM] Emergency Siren push failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send High-Priority Emergency Siren Push Notification
 * Wakes device from sleep and plays emergency siren on channel: 'emergency_sos_siren_channel'
 * Supports BOTH Expo Push Tokens and Native FCM Tokens!
 * 
 * @param {Object} params
 * @param {string[]} params.tokens - FCM / Expo device tokens of parents & admins
 * @param {string} params.victimName - Name of person who triggered SOS
 * @param {string|number} params.sosId - SOS Session ID
 * @param {string} params.trackingUrl - Live location tracking URL
 * @param {number} [params.latitude] - Victim latitude
 * @param {number} [params.longitude] - Victim longitude
 */
export async function sendEmergencySirenPush({ tokens, victimId, victimName, sosId, trackingUrl, latitude, longitude }) {
  const validTokens = Array.from(new Set((tokens || []).filter((t) => typeof t === 'string' && t.trim().length > 10)));

  if (validTokens.length === 0) {
    return { success: false, reason: 'No valid device tokens provided' };
  }

  // Purge any stale legacy Expo tokens from DB
  const isExpoToken = (t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[');
  const legacyExpoTokens = validTokens.filter(isExpoToken);
  const fcmTokens = validTokens.filter((t) => !isExpoToken(t));

  if (legacyExpoTokens.length > 0) {
    import('../config/prisma.js').then(({ prisma }) => {
      prisma.deviceToken.deleteMany({
        where: { token: { in: legacyExpoTokens } },
      }).catch(() => {});
    }).catch(() => {});
  }

  console.log(`[Push Dispatch] Sending direct Native FCM Siren Push to ${fcmTokens.length} device(s) via Google Firebase Admin SDK`);

  if (fcmTokens.length === 0) {
    return { success: false, reason: 'No native FCM tokens available' };
  }

  return await sendFcmEmergencyPush({
    tokens: fcmTokens,
    victimId,
    victimName,
    sosId,
    trackingUrl,
    latitude,
    longitude,
  });
}
