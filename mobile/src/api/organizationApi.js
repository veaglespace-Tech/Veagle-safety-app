import { apiClient } from './apiClient';

export const organizationApi = {
  getOverview: async () => {
    const response = await apiClient.get('/organization/overview');
    return response.data;
  }
};
