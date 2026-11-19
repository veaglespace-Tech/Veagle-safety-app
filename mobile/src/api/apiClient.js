import axios from 'axios';
import { Alert, Linking, Platform } from 'react-native';
import { API_URL } from '../utils/constants';
import { clearAuthToken, getAuthToken } from '../utils/tokenStorage';

let onAuthenticatedSessionExpired = null;
export const setAuthenticatedSessionExpiredHandler = (handler) => {
  onAuthenticatedSessionExpired = handler;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token — mirrors the web app's interceptor using localStorage
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

// Interceptor to handle global 401 unauthorized & 402 subscription expired
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      try {
        await clearAuthToken();
        onAuthenticatedSessionExpired?.();
      } catch (e) {}
    } else if (error.response && error.response.status === 402) {
      const msg = "Your subscription plan has expired or is inactive. Please contact support at +91 92252 41608 to upgrade or renew your plan.";
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const call = window.confirm("Subscription Required\n\n" + msg + "\n\nClick OK to call +91 92252 41608");
        if (call) {
          Linking.openURL('tel:9225241608').catch(() => {});
        }
      } else {
        Alert.alert(
          "Subscription Required",
          msg,
          [
            { text: "Dismiss", style: "cancel" },
            {
              text: "Call +91 92252 41608",
              onPress: () => Linking.openURL('tel:9225241608').catch(() => {}),
            },
          ]
        );
      }
    }
    return Promise.reject(error);
  }
);
