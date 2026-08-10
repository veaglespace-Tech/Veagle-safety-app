import { apiClient } from './apiClient';

export const emergencyEmailsApi = {
  getEmails: async () => {
    const res = await apiClient.get('/emergency-emails');
    return res.data;
  },
  addEmail: async (payload) => {
    const res = await apiClient.post('/emergency-emails', payload);
    return res.data;
  },
  deleteEmail: async (id) => {
    const res = await apiClient.delete(`/emergency-emails/${id}`);
    return res.data;
  },
};
