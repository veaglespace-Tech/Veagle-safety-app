import { apiClient } from './apiClient';

export const paymentApi = {
  initiatePayU: async ({ planId, amount, couponCode }) => {
    const res = await apiClient.post('/payment/payu-initiate', { planId, amount, couponCode });
    return res.data;
  },

  fetchPaymentHistory: async () => {
    const res = await apiClient.get('/payment/history');
    return res.data;
  },
};
