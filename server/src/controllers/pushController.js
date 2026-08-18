import { prisma } from '../config/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

let webpush = null;
let vapidConfigured = false;

// Lazy-load web-push and configure VAPID only when keys are available
async function getWebPush() {
  if (webpush) return webpush;
  try {
    const { default: wp } = await import('web-push');
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      wp.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@veaglesafety.org',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
      vapidConfigured = true;
      webpush = wp;
    } else {
      console.warn('[WebPush] VAPID keys not configured - push notifications disabled');
    }
  } catch (e) {
    console.warn('[WebPush] web-push module error:', e.message);
  }
  return webpush;
}

/**
 * Save push subscription for current user (by email)
 */
export const savePushSubscription = asyncHandler(async (req, res) => {
  const { subscription } = req.body;
  const userEmail = req.user?.email;

  if (!subscription || !userEmail) {
    return res.status(400).json({ error: 'Subscription and user email required' });
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, userEmail, updatedAt: new Date() },
      create: { userEmail, endpoint, p256dh, auth },
    });
  } catch (e) {
    console.error('[WebPush] Failed to save subscription:', e.message);
    return res.status(500).json({ error: 'Failed to save push subscription' });
  }

  return res.json({ success: true, message: 'Push subscription saved' });
});

/**
 * Save push subscription by email (for trusted contacts visiting site)
 */
export const savePushSubscriptionByEmail = asyncHandler(async (req, res) => {
  const { subscription, email } = req.body;

  if (!subscription || !email) {
    return res.status(400).json({ error: 'Subscription and email required' });
  }

  const { endpoint, keys } = subscription;
  const { p256dh, auth } = keys;

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, userEmail: email, updatedAt: new Date() },
      create: { userEmail: email, endpoint, p256dh, auth },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Failed to save push subscription' });
  }

  return res.json({ success: true, message: 'Push subscription saved' });
});

/**
 * Send emergency SOS push notification to specific emails
 * Called from sosController when SOS is triggered
 */
export const sendEmergencyPushToEmails = async ({ emails, victimName, trackingUrl, latitude, longitude }) => {
  if (!emails || emails.length === 0) return;

  const wp = await getWebPush();
  if (!wp || !vapidConfigured) {
    console.log('[WebPush] Skipping push - VAPID not configured');
    return;
  }

  let subscriptions = [];
  try {
    subscriptions = await prisma.pushSubscription.findMany({
      where: { userEmail: { in: emails } },
    });
  } catch (e) {
    console.warn('[WebPush] DB query failed:', e.message);
    return;
  }

  if (subscriptions.length === 0) {
    console.log('[WebPush] No push subscriptions found for contacts:', emails);
    return;
  }

  const payload = JSON.stringify({
    title: '🚨 EMERGENCY SOS ALARM',
    body: `${victimName} has triggered an Emergency SOS! Open immediately.`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      type: 'SOS_EMERGENCY',
      victimName,
      trackingUrl,
      latitude,
      longitude,
      url: trackingUrl,
    },
    actions: [
      { action: 'view-map', title: '📍 View Live Location' },
    ],
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      wp.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`[WebPush] Emergency push: ${sent} sent, ${failed} failed`);
};

/**
 * Get VAPID public key (for client subscription)
 */
export const getVapidPublicKey = asyncHandler(async (req, res) => {
  return res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});
