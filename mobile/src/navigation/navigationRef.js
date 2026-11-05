import * as React from 'react';

export const navigationRef = React.createRef();

export function navigate(name, params) {
  if (navigationRef.current?.isReady?.() && navigationRef.current) {
    try {
      navigationRef.current.navigate(name, params);
    } catch (e) {
      console.warn('[Navigation] Navigate failed:', e.message);
    }
  } else {
    // Retry once when navigator is ready
    setTimeout(() => {
      try {
        navigationRef.current?.navigate?.(name, params);
      } catch (err) {}
    }, 500);
  }
}

