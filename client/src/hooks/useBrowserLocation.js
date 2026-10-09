import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateCoordinates, setLocationStatus, setTrackingState } from '../redux/slices/locationSlice.js';
import { sosApi } from '../redux/api/sosApi.js';

export const useBrowserLocation = (activeSosId = null) => {
  const dispatch = useDispatch();
  const watchIdRef = useRef(null);
  const lastSentCoordRef = useRef({ lat: null, lng: null });

  // Calculate rough distance between two coordinates in meters
  const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371e3; // Earth radius in meters
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const deltaP = p2 - p1;
    const deltaLon = lon2 - lon1;
    const deltaLambda = (deltaLon * Math.PI) / 180;
    const a =
      Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
      Math.cos(p1) * Math.cos(p2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    dispatch(setTrackingState(false));
  };

  const startLocationTracking = () => {
    if (!('geolocation' in navigator)) {
      dispatch(setLocationStatus('DENIED'));
      return;
    }

    if (watchIdRef.current !== null) {
      // Already tracking
      return;
    }

    dispatch(setTrackingState(true));

    const success = async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const acc = position.coords.accuracy;

      // Update Redux state immediately for UI
      dispatch(
        updateCoordinates({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
        })
      );

      // If there's an active SOS session, sync to backend
      if (activeSosId) {
        const { lat: lastLat, lng: lastLng } = lastSentCoordRef.current;
        const distance = getDistanceInMeters(lastLat, lastLng, lat, lng);
        const timeSinceLastSync = Date.now() - (lastSentCoordRef.current.time || 0);

        console.log(`[useBrowserLocation] GPS Update - Lat: ${lat}, Lng: ${lng}, Distance: ${distance}m, Time: ${timeSinceLastSync}ms`);

        // Throttle updates: send if moved at least 1 meter OR 3 seconds have passed OR haven't sent yet
        if (distance > 1 || timeSinceLastSync > 3000 || lastLat === null) {
          try {
            console.log('[useBrowserLocation] Syncing to backend...');
            await sosApi.updateSosLocation({
              sosSessionId: activeSosId,
              latitude: lat,
              longitude: lng,
              accuracy: acc,
            });
            console.log('[useBrowserLocation] Backend sync successful!');
            lastSentCoordRef.current = { lat, lng, time: Date.now() };
          } catch (err) {
            console.error('[useBrowserLocation] Failed to sync GPS to backend:', err);
          }
        }
      }
    };

    const error = (err) => {
      console.warn('[useBrowserLocation] GPS Error:', err);
      if (err.code === 1) {
        dispatch(setLocationStatus('DENIED'));
      } else if (err.code === 2) {
        dispatch(setLocationStatus('OFFLINE'));
      } else if (err.code === 3) {
        dispatch(setLocationStatus('STALE'));
      }
    };

    const options = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(success, error, options);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  return {
    startLocationTracking,
    stopLocationTracking,
  };
};
