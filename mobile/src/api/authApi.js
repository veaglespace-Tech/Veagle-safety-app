import { apiClient } from './apiClient';

export const authApi = {
  register: async (payload) => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },
  verifyEmail: async (payload) => {
    const res = await apiClient.post('/auth/verify-email', payload);
    return res.data;
  },
  resendOtp: async (payload) => {
    const res = await apiClient.post('/auth/resend-otp', payload);
    return res.data;
  },
  login: async (payload) => {
    const res = await apiClient.post('/auth/login', payload);
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
  getProfile: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  updateSettings: async (payload) => {
    const res = await apiClient.put('/auth/settings', payload);
    return res.data;
  },
  forgotPassword: async (payload) => {
    const res = await apiClient.post('/auth/forgot-password', payload);
    return res.data;
  },
  resetPassword: async (payload) => {
    const res = await apiClient.post('/auth/reset-password', payload);
    return res.data;
  },
};
