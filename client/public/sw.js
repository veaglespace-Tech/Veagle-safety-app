// Sakhi Suraksha Emergency SOS Service Worker
// Handles Web Push Notifications and plays alarm even when browser is closed

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming Web Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: '🚨 Emergency SOS Alert', body: event.data?.text() || 'Someone needs help!' };
  }

  const title = data.title || '🚨 EMERGENCY SOS ALARM';
  const body = data.body || 'Emergency SOS triggered. Open app immediately!';
  const icon = data.icon || '/icon-192.png';
  const badge = data.badge || '/icon-192.png';
  const notifData = data.data || {};

  const options = {
    body,
    icon,
    badge,
    vibrate: [300, 100, 300, 100, 300, 100, 600],
    sound: '/emergency-alarm.mp3',
    tag: 'sos-emergency',
    requireInteraction: true,
    renotify: true,
    data: notifData,
    actions: [
      { action: 'view-map', title: '📍 View Live Location' },
      { action: 'call', title: '📞 Call Now' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notifData = event.notification.data || {};

  let targetUrl = notifData.trackingUrl || notifData.url || '/';

  if (action === 'call' && notifData.victimPhone) {
    targetUrl = `tel:${notifData.victimPhone}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Basic fetch handler for PWA requirements (bypass for live tracking)
self.addEventListener('fetch', (event) => {
  // Pass everything to network so live tracking and real-time updates aren't broken by aggressive caching
  event.respondWith(fetch(event.request));
});
