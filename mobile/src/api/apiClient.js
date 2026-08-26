import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TOKEN_KEY } from '../utils/constants';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token — mirrors the web app's interceptor using localStorage
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

// Interceptor to handle global 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);
