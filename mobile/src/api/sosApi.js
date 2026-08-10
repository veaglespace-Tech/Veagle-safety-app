import { apiClient } from './apiClient';

export const sosApi = {
  startSos: async (payload) => {
    const res = await apiClient.post('/sos/start', payload);
    return res.data;
  },
  updateSosLocation: async ({ sosSessionId, latitude, longitude, accuracy }) => {
    const res = await apiClient.post('/sos/location', { sosSessionId, latitude, longitude, accuracy });
    return res.data;
  },
  resolveSos: async (sosSessionId) => {
    const res = await apiClient.post('/sos/resolve', { sosSessionId });
    return res.data;
  },
  fetchActiveSos: async () => {
    const res = await apiClient.get('/sos/active');
    return res.data;
  },
  getPublicTrack: async (token) => {
    const res = await apiClient.get(`/sos/public-track/${token}`);
    return res.data;
  },
};
