'use client';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { apiClient } from '../redux/api/apiClient.js';

/**
 * Registers Service Worker and subscribes to Web Push Notifications.
 * Called from Providers so every logged-in user is auto-subscribed.
 * Trusted contacts visiting the site with their email will also be subscribed.
 */
export function usePushNotification() {
  const { token, user } = useSelector((state) => state.auth || {});

  useEffect(() => {
    // Only attempt push notification subscription for authenticated users
    if (!token) return;

    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return;
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      return;
    }

    async function registerAndSubscribe() {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Get VAPID public key from server
        const keyRes = await apiClient.get('/push/vapid-key');
        const vapidPublicKey = keyRes.data?.publicKey;
        if (!vapidPublicKey) return;

        // Convert VAPID key to Uint8Array
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

        // Request notification permission if default
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;
        }

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        // Save subscription to server
        if (subscription) {
          await apiClient.post('/push/subscribe', { subscription });
          console.log('[PushNotification] Subscribed successfully for:', user?.email || 'user');
        }
      } catch (error) {
        // Silently ignore optional push notification failures
      }
    }

    registerAndSubscribe();
  }, [token, user?.email]);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
