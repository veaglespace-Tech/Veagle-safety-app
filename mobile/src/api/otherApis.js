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

export const journeyApi = {
  startJourney: async (payload) => {
    const res = await apiClient.post('/journey/start', payload);
    return res.data;
  },
  completeJourney: async (journeyId) => {
    const res = await apiClient.post('/journey/complete', { journeyId });
    return res.data;
  },
  getActiveJourney: async () => {
    const res = await apiClient.get('/journey/active');
    return res.data;
  },
};

export const checkinApi = {
  startCheckin: async (intervalMins) => {
    const res = await apiClient.post('/checkin/start', { intervalMins });
    return res.data;
  },
  confirmSafe: async (checkinId) => {
    const res = await apiClient.post('/checkin/safe', { checkinId });
    return res.data;
  },
  getActiveCheckin: async () => {
    const res = await apiClient.get('/checkin/active');
    return res.data;
  },
};
