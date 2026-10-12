import { LogBox } from 'react-native';

// Ignore harmless dev/web-specific warnings to keep the on-screen UI clean
LogBox.ignoreLogs([
  'Cannot connect to Expo CLI',
  '"shadow*" style props are deprecated',
  '"textShadow*" style props are deprecated',
  'Animated: `useNativeDriver` is not supported',
  'props.pointerEvents is deprecated',
  '[expo-av]: Expo AV has been deprecated',
]);

// Patch console.warn to keep the Metro terminal clean as well
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string') {
    if (
      args[0].includes('Cannot connect to Expo CLI') ||
      args[0].includes('"shadow*" style props are deprecated') ||
      args[0].includes('"textShadow*" style props are deprecated') ||
      args[0].includes('useNativeDriver') ||
      args[0].includes('props.pointerEvents is deprecated') ||
      args[0].includes('[expo-av]: Expo AV has been deprecated')
    ) {
      return;
    }
  }
  originalWarn(...args);
};
