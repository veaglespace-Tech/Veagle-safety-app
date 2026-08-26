import { apiClient } from './apiClient';

export const journeyApi = {
  startJourney: async (payload) => {
    const res = await apiClient.post('/journey/start', payload);
    return res.data;
  },
  completeJourney: async (journeyId) => {
    const res = await apiClient.post('/journey/complete', { journeyId });
    return res.data;
  },
  getActiveJourney: async () => {
    const res = await apiClient.get('/journey/active');
    return res.data;
  },
};
