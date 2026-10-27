import React from 'react';
import { Provider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalErrorBoundary from './src/components/common/GlobalErrorBoundary';

function AppInner() {
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
