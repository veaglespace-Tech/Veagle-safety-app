import React from 'react';
import { LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { useLocation } from './src/hooks/useLocation';

// Ignore harmless web-specific warnings to keep the on-screen UI clean
LogBox.ignoreLogs([
  '"shadow*" style props are deprecated',
  'Animated: `useNativeDriver` is not supported',
  'props.pointerEvents is deprecated'
]);

// Patch console.warn to keep the Metro terminal clean as well
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string') {
    if (
      args[0].includes('"shadow*" style props are deprecated') ||
      args[0].includes('useNativeDriver') ||
      args[0].includes('props.pointerEvents is deprecated')
    ) {
      return;
    }
  }
  originalWarn(...args);
};

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
