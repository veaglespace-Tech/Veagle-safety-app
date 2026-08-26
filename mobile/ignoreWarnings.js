import { LogBox } from 'react-native';

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
