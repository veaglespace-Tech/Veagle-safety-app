import { apiClient } from './apiClient';

export const parentApi = {
  getOverview: async () => {
    const res = await apiClient.get('/parent/overview');
    return res.data;
  },
  linkChild: async ({ identifier, relationship }) => {
    const res = await apiClient.post('/parent/link-child', { identifier, relationship });
    return res.data;
  },
  unlinkChild: async (linkId) => {
    const res = await apiClient.delete(`/parent/children/${linkId}`);
    return res.data;
  },
};
