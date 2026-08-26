import { apiClient } from './apiClient';

export const adminApi = {
  // Plans
  getPlans: async () => {
    const res = await apiClient.get('/admin/plans');
    return res.data;
  },
  getGst: async () => {
    const res = await apiClient.get('/admin/gst');
    return res.data;
  },
  updateGst: async (gstPercentage) => {
    const res = await apiClient.put('/admin/gst', { gstPercentage });
    return res.data;
  },
  togglePlanStatus: async (planId) => {
    const res = await apiClient.post(`/admin/plans/${planId}/toggle`);
    return res.data;
  },
  savePlan: async (payload) => {
    const res = await apiClient.post('/admin/plans', payload);
    return res.data;
  },
  
  // Payments
  getPayments: async () => {
    const res = await apiClient.get('/admin/payments');
    return res.data;
  }
};
