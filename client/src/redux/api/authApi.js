import { apiClient } from './apiClient.js';

export const authApi = {
  register: async (formData) => {
    const response = await apiClient.post('/auth/register', formData);
    return response.data;
  },

  verifyEmail: async ({ email, otp, pendingToken }) => {
    const response = await apiClient.post('/auth/verify-email', { email, otp, pendingToken });
    return response.data;
  },

  resendOtp: async (payload) => {
    const body = typeof payload === 'string' ? { email: payload } : payload;
    const response = await apiClient.post('/auth/resend-otp', body);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateSettings: async (settingsData) => {
    const response = await apiClient.put('/auth/settings', settingsData);
    return response.data;
  },

  sendEmailChangeOtp: async ({ newEmail }) => {
    const response = await apiClient.post('/auth/send-email-change-otp', { newEmail });
    return response.data;
  },

  verifyNewEmail: async ({ pendingEmail, otpCode }) => {
    const response = await apiClient.post('/auth/verify-new-email', { pendingEmail, otpCode });
    return response.data;
  },
};
