import { apiClient } from './apiClient.js';

export const couponApi = {
  createCoupon: async (data) => {
    const response = await apiClient.post('/coupons', data);
    return response.data;
  },

  getAllCoupons: async () => {
    const response = await apiClient.get('/coupons');
    return response.data;
  },

  updateCoupon: async (id, data) => {
    const response = await apiClient.put(`/coupons/${id}`, data);
    return response.data;
  },

  deleteCoupon: async (id) => {
    const response = await apiClient.delete(`/coupons/${id}`);
    return response.data;
  },

  getAssignableUsers: async () => {
    const response = await apiClient.get('/coupons/assignable-users');
    return response.data;
  },

  getMyCoupons: async () => {
    const response = await apiClient.get('/coupons/my-coupons');
    return response.data;
  },

  validateCoupon: async (code, planId) => {
    const response = await apiClient.post('/coupons/validate', { code, planId });
    return response.data;
  },
};
