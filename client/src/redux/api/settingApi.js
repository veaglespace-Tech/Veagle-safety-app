import { apiClient } from './apiClient.js';

export const settingApi = {
  fetchSettings: async (keys) => {
    let url = '/settings';
    if (keys && keys.length > 0) {
      url += `?keys=${keys.join(',')}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  updateSettings: async (settings) => {
    const response = await apiClient.put('/settings', { settings });
    return response.data;
  },

  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('media', file);

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
