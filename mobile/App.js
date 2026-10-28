import React, { useEffect } from 'react';
import { Provider, useSelector } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalErrorBoundary from './src/components/common/GlobalErrorBoundary';
import { setupNotificationChannels, registerPushDeviceToken } from './src/services/notificationService';
import { playEmergencySiren } from './src/utils/soundPlayer';

function AppInner() {
  const token = useSelector((state) => state.auth?.token);

  useEffect(() => {
    // 1. Configure Android High-Decibel Emergency Siren Channel on app start
    setupNotificationChannels();

    // 2. Register Device Token with server when user is authenticated
    if (token) {
      registerPushDeviceToken(token);
    }

    // 3. Listen for incoming notifications while app is in foreground / background
    const notifSub = Notifications.addNotificationReceivedListener((notification) => {
      const isSos = notification?.request?.content?.data?.type === 'SOS_TRIGGERED' ||
        notification?.request?.content?.title?.includes('SOS');
      if (isSos) {
        playEmergencySiren(false).catch(() => {});
      }
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const isSos = response?.notification?.request?.content?.data?.type === 'SOS_TRIGGERED' ||
        response?.notification?.request?.content?.title?.includes('SOS');
      if (isSos) {
        playEmergencySiren(false).catch(() => {});
      }
    });

    return () => {
      notifSub.remove();
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
    <GlobalErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <AppInner />
        </Provider>
      </GestureHandlerRootView>
    </GlobalErrorBoundary>
  );
}
