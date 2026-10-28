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
async function sendExpoEmergencyPush({ tokens, victimName, sosId, trackingUrl, latitude, longitude }) {
  if (!tokens || tokens.length === 0) return { success: true, count: 0 };

  console.log(`[ExpoPush] Sending emergency siren to ${tokens.length} Expo tokens...`);

  const messages = tokens.map((to) => ({
    to,
    title: '🚨 EMERGENCY SOS ALERT!',
    body: `${victimName} activated SOS! Tap to open live tracker.`,
    data: {
      type: 'SOS_TRIGGERED',
      sosId: String(sosId),
      victimName: String(victimName),
      trackingUrl: String(trackingUrl || ''),
      latitude: String(latitude || ''),
      longitude: String(longitude || ''),
      timestamp: new Date().toISOString(),
    },
    sound: 'default',
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
        console.error(`🚨 [ExpoPush Error] Token #${i} (${badToken.substring(0, 25)}...):`, ticket.message, ticket.details);

        if (ticket.details?.error === 'DeviceNotRegistered') {
          console.warn(`🧹 [ExpoPush Cleanup] Removing unregistered Expo token from database: ${badToken.substring(0, 25)}...`);
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
 */
async function sendFcmEmergencyPush({ tokens, victimName, sosId, trackingUrl, latitude, longitude }) {
  if (!tokens || tokens.length === 0) return { success: true, count: 0 };

  console.log(`[FCM] Target tokens count: ${tokens.length}. Sample: ${tokens[0].substring(0, 20)}...`);

  initFirebase();

  if (!firebaseInitialized) {
    console.log(`[FCM Mock] Would send emergency siren to ${tokens.length} devices for victim: ${victimName}`);
    return { success: false, reason: 'Firebase not configured' };
  }

  const message = {
    tokens,
    notification: {
      title: '🚨 EMERGENCY SOS ALERT!',
      body: `${victimName} activated SOS! Tap to open live tracker.`,
    },
    data: {
      type: 'SOS_TRIGGERED',
      sosId: String(sosId),
      victimName: String(victimName),
      trackingUrl: String(trackingUrl || ''),
      latitude: String(latitude || ''),
      longitude: String(longitude || ''),
      timestamp: new Date().toISOString(),
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'emergency_sos_siren_channel',
        sound: 'default',
        priority: 'max',
        visibility: 'public',
        defaultVibrateTimings: false,
        vibrateTimingsMillis: [0, 500, 200, 500, 200, 500],
      },
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          alert: {
            title: '🚨 EMERGENCY SOS ALERT!',
            body: `${victimName} activated SOS!`,
          },
          sound: 'default',
          badge: 1,
          'interruption-level': 'critical',
        },
      },
    },
  };

  try {
    const messaging = getMessaging();
    const response = await messaging.sendEachForMulticast(message);
    console.log(`✅ [FCM] Emergency Siren dispatched: ${response.successCount} success, ${response.failureCount} failed`);

    if (response.failureCount > 0) {
      const { prisma } = await import('../config/prisma.js');
      for (let idx = 0; idx < response.responses.length; idx++) {
        const resp = response.responses[idx];
        if (!resp.success) {
          const badToken = tokens[idx];
          const errCode = resp.error?.code || 'UNKNOWN_ERROR';
          const errMsg = resp.error?.message || 'No description provided';
          console.error(`🚨 [FCM Exact Error] Token #${idx} (${badToken.substring(0, 25)}...): Code = "${errCode}", Message = "${errMsg}"`);

          if (errCode === 'messaging/registration-token-not-registered') {
            console.warn(`🧹 [FCM Cleanup] Removing stale token from database: ${badToken.substring(0, 25)}...`);
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
export async function sendEmergencySirenPush({ tokens, victimName, sosId, trackingUrl, latitude, longitude }) {
  const validTokens = Array.from(new Set((tokens || []).filter((t) => typeof t === 'string' && t.trim().length > 10)));

  if (validTokens.length === 0) {
    return { success: false, reason: 'No valid device tokens provided' };
  }

  const isExpoToken = (t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken[');
  const expoTokens = validTokens.filter(isExpoToken);
  const fcmTokens = validTokens.filter((t) => !isExpoToken(t));

  console.log(`[Push Dispatch] Total: ${validTokens.length} (Expo: ${expoTokens.length}, Native FCM: ${fcmTokens.length})`);

  const results = {};

  if (expoTokens.length > 0) {
    results.expo = await sendExpoEmergencyPush({
      tokens: expoTokens,
      victimName,
      sosId,
      trackingUrl,
      latitude,
      longitude,
    });
  }

  if (fcmTokens.length > 0) {
    results.fcm = await sendFcmEmergencyPush({
      tokens: fcmTokens,
      victimName,
      sosId,
      trackingUrl,
      latitude,
      longitude,
    });
  }

  return { success: true, results };
}
