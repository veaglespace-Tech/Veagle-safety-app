import axios from 'axios';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, TOKEN_KEY } from '../utils/constants';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
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

// Interceptor to handle global 401 unauthorized & 402 subscription expired
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } catch (e) {}
    } else if (error.response && error.response.status === 402) {
      const msg = "Your subscription plan has expired or is inactive. Please contact support at 8237999101 to upgrade or renew your plan.";
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const call = window.confirm("Subscription Required\n\n" + msg + "\n\nClick OK to call 8237999101");
        if (call) {
          Linking.openURL('tel:8237999101').catch(() => {});
        }
      } else {
        Alert.alert(
          "Subscription Required",
          msg,
          [
            { text: "Dismiss", style: "cancel" },
            {
              text: "Call 8237999101",
              onPress: () => Linking.openURL('tel:8237999101').catch(() => {}),
            },
          ]
        );
      }
    }
    return Promise.reject(error);
  }
);
