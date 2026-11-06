import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalErrorBoundary from './src/components/common/GlobalErrorBoundary';
import {
  setupNotificationChannels,
  registerPushDeviceToken,
  setupFcmListeners,
  shouldPlaySirenForNotification,
} from './src/services/notificationService';
import { playEmergencySiren } from './src/utils/soundPlayer';

function AppInner() {
  const token = useSelector((state) => state.auth?.token);

  useEffect(() => {
    // 1. Configure Android High-Decibel Emergency Siren Channel on app start
    setupNotificationChannels();

    // 2. Register Native FCM / Expo Device Token with server when user is authenticated
    if (token) {
      registerPushDeviceToken(token);
    }

    // 3. Setup Native Firebase Messaging listeners (Foreground, Open from BG, Terminated, Refresh)
    const cleanupFcm = setupFcmListeners(token);

    // 4. Fallback for non-FCM local notification response (tap)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (shouldPlaySirenForNotification(data)) {
        playEmergencySiren(true, 28).catch(() => {});
      }
    });

    return () => {
      cleanupFcm?.();
      responseSub.remove();
    };
  }, [token]);

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFF0F3" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GlobalErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Provider store={store}>
            <AppInner />
          </Provider>
        </GestureHandlerRootView>
      </GlobalErrorBoundary>
    </SafeAreaProvider>
  );
}
