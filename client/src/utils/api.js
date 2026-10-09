import axios from 'axios';

const envServerUrl = typeof process !== 'undefined' ? (process.env?.NEXT_PUBLIC_SERVER_URL || process.env?.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '')) : null;
const envApiUrl = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_URL : null;

// Strong safeguard: If env variable accidentally contains localhost but we are running on a live domain, override it.
let safeServerUrl = envServerUrl;
if (typeof window !== 'undefined') {
  if (!safeServerUrl || safeServerUrl.includes('localhost') || safeServerUrl.includes('127.0.0.1')) {
    safeServerUrl = window.location.origin;
  }
}

export const SERVER_URL = safeServerUrl || 'http://localhost:5000';
export const API_URL = typeof window !== 'undefined' ? (envApiUrl || `${window.location.origin}/api`) : (envApiUrl || `${SERVER_URL}/api`);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tichi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global Response Interceptor for Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      if (error.response.status === 401) {
        // Optional: Dispatch a global logout event if unauthorized
        if (typeof window !== 'undefined') {
          // localStorage.removeItem('tichi_token');
          // window.location.href = '/auth';
        }
      }
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received (Network error)
      return Promise.reject({ success: false, message: 'Network error. Please check your connection.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject({ success: false, message: error.message });
    }
  }
);
