import React from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useLocation } from './src/hooks/useLocation';

// Inner component wraps the app and always calls useLocation
// (safe: hook internally checks if user is authenticated before tracking)
function AppInner() {
  useLocation();
  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFF0F3" />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <AppInner />
      </Provider>
    </GestureHandlerRootView>
  );
}
