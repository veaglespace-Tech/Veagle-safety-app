'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateCoordinates, setLocationStatus } from '../../redux/slices/locationSlice.js';

export function GeoLocationTracker() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      dispatch(setLocationStatus('OFFLINE'));
      return;
    }

    const options = {
      enableHighAccuracy: true, // Force mobile & browser hardware GPS chip
      timeout: 15000,
      maximumAge: 0, // Disable stale cached location!
    };

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      dispatch(
        updateCoordinates({
          latitude,
          longitude,
          accuracy: Math.round(accuracy || 10),
        })
      );
    };

    const handleError = (error) => {
      console.warn('[High-Accuracy Geolocation Warning]:', error.message);
      if (error.code === error.PERMISSION_DENIED) {
        dispatch(setLocationStatus('DENIED'));
      } else {
        dispatch(setLocationStatus('STALE'));
      }
    };

    // 1. Request immediate high-precision hardware location
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, options);

    // 2. Watch position continuously in real-time as user moves
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      if (watchId && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [dispatch]);

  return null;
}
