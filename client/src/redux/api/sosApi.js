import { apiClient } from './apiClient.js';

export const sosApi = {
  startSos: async (payload) => {
    const response = await apiClient.post('/sos/start', payload);
    return response.data;
  },

  updateSosLocation: async ({ sosSessionId, latitude, longitude, accuracy }) => {
    const response = await apiClient.post('/sos/location', {
      sosSessionId,
      latitude,
      longitude,
      accuracy,
    });
    return response.data;
  },

  resolveSos: async (sosSessionId) => {
    const response = await apiClient.post('/sos/resolve', { sosSessionId });
    return response.data;
  },

  fetchActiveSos: async () => {
    const response = await apiClient.get('/sos/active');
    return response.data;
  },

  getSosLocation: async (id) => {
    const response = await apiClient.get(`/sos/active/${id}/location`);
    return response.data;
  },

  getPublicTrack: async (token) => {
    const response = await apiClient.get(`/sos/public-track/${token}`);
    return response.data;
  },
};
