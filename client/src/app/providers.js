'use client';

import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from '../redux/store.js';
import { fetchUser } from '../redux/slices/authSlice.js';
import { EmergencyAlarmListener } from '../components/common/EmergencyAlarmListener.js';
import { usePushNotification } from '../hooks/usePushNotification.js';
import { VisitorRenderTracker, FloatingBottomLeftCounter } from '../components/common/VisitorRenderTracker.js';

function AuthInitializer({ children }) {
  const dispatch = useDispatch();

  // Auto-register Service Worker & push subscription for all logged-in users
  usePushNotification();

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  return (
    <>
      {/* Global render counter (+2 on every visit/render) */}
      <VisitorRenderTracker />
      {/* Floating Bottom Left Counter Display */}
      <FloatingBottomLeftCounter />
      {/* Global real-time alarm listener (Socket.io - browser open) */}
      <EmergencyAlarmListener />
      {children}
    </>
  );
}

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
