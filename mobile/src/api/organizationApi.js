import { apiClient } from './apiClient';

export const organizationApi = {
  getOverview: async () => {
    const response = await apiClient.get('/organization/overview');
    return response.data;
  },

  addMember: async ({ identifier, memberCode, department }) => {
    const response = await apiClient.post('/organization/members', {
      identifier,
      memberCode,
      department,
    });
    return response.data;
  },

  removeMember: async (membershipId) => {
    const response = await apiClient.delete(`/organization/members/${membershipId}`);
    return response.data;
  },
};
