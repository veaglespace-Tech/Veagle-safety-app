import { apiClient } from './apiClient.js';

export const referralApi = {
  createPartner: async (data) => {
    const response = await apiClient.post('/partners', data);
    return response.data;
  },

  getAllPartners: async () => {
    const response = await apiClient.get('/partners');
    return response.data;
  },

  getPartnerById: async (id) => {
    const response = await apiClient.get(`/partners/${id}`);
    return response.data;
  },

  updatePartner: async (id, data) => {
    const response = await apiClient.put(`/partners/${id}`, data);
    return response.data;
  },

  deletePartner: async (id) => {
    const response = await apiClient.delete(`/partners/${id}`);
    return response.data;
  },

  getPartnerStats: async (email, code) => {
    const response = await apiClient.post('/partners/stats', { email, code });
    return response.data;
  },
};
