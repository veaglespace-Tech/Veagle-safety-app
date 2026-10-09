// Deprecated Zustand store replaced by Redux Toolkit sosSlice
import { useSelector, useDispatch } from 'react-redux';
import {
  checkActiveSos,
  startEmergencySos,
  resolveEmergencySos,
  toggleAlarm,
} from './slices/sosSlice.js';

export const useSOSStore = () => {
  const dispatch = useDispatch();
  const sosState = useSelector((state) => state?.sos || {});
  return {
    ...sosState,
    fetchActiveSos: () => dispatch(checkActiveSos()),
    triggerSos: (isSilent, lat, lng) =>
      dispatch(startEmergencySos({ isSilent, initialLat: lat, initialLng: lng })),
    resolveSos: (sessionId) => dispatch(resolveEmergencySos(sessionId)),
    toggleAlarm: () => dispatch(toggleAlarm()),
  };
};
