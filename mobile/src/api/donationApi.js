import { apiClient } from './apiClient';

export const donationApi = {
  initiateDonation: async (payload) => {
    const res = await apiClient.post('/donations/initiate', payload);
    return res.data;
  },
  verifyPayUSuccess: async (payload) => {
    const res = await apiClient.post('/donations/payu-success', payload);
    return res.data;
  },
  verifyPayUFailure: async (payload) => {
    const res = await apiClient.post('/donations/payu-failure', payload);
    return res.data;
  },
};
