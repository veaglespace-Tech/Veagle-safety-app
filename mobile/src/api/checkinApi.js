import { apiClient } from './apiClient';

export const checkinApi = {
  startCheckin: async (intervalMins) => {
    const res = await apiClient.post('/checkin/start', { intervalMins });
    return res.data;
  },
  confirmSafe: async (checkinId) => {
    const res = await apiClient.post('/checkin/safe', { checkinId });
    return res.data;
  },
  getActiveCheckin: async () => {
    const res = await apiClient.get('/checkin/active');
    return res.data;
  },
};
