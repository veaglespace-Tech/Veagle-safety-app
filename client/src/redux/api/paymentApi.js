import { apiClient } from './apiClient.js';

export const paymentApi = {
  createRazorpayOrder: async ({ planId }) => {
    const response = await apiClient.post('/payment/razorpay-create-order', { planId });
    return response.data;
  },

  fetchPaymentHistory: async () => {
    const response = await apiClient.get('/payment/history');
    return response.data;
  },
};
