import { apiClient } from './apiClient';

export const contactsApi = {
  getContacts: async () => {
    const res = await apiClient.get('/contacts');
    return res.data;
  },
  addContact: async (payload) => {
    const res = await apiClient.post('/contacts', payload);
    return res.data;
  },
  updateContact: async (id, payload) => {
    const res = await apiClient.put(`/contacts/${id}`, payload);
    return res.data;
  },
  deleteContact: async (id) => {
    const res = await apiClient.delete(`/contacts/${id}`);
    return res.data;
  },
};
