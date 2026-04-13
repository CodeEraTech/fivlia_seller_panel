import axios from 'axios';
import { getApiBaseUrl, USE_FIREBASE } from './endpoints.js';

// Create axios instance
const apiClient = axios.create({
  timeout: 50000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const baseUrl = await getApiBaseUrl();
    config.baseURL = baseUrl; // 🔥 yahi magic hai
    return config;
  },
  (error) => Promise.reject(error)
);


// Get token from localStorage
const getToken = () => {
  const token = localStorage.getItem("token");
  return token;
};

// Helper function to add auth headers
const withAuth = (config = {}) => {
  const token = getToken();

  if (!token) {
    return config;
  }

  const authConfig = {
    ...config,
    headers: {
      ...config.headers,
      Authorization: `Bearer ${token}`
    }
  };

  return authConfig;
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {

    if (config.authRequired) {
      const token = getToken();


      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;

      } else {

      }

      // Clean up to avoid passing custom flags to server
      delete config.authRequired;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    
    return response;
  },
  (error) => {
    
    if (error.response?.status === 401) {
    
      const message = error.response?.data?.message?.toLowerCase() || '';

      if (
        message.includes('unauthorized') ||
        message.includes('invalid token') ||
        message.includes('token expired')
      ) {
    
        localStorage.removeItem("token");
    
      } else {
    
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions
export const get = (endpoint, config = {}) => {
  const finalConfig = config.authRequired ? withAuth(config) : config;
  return apiClient.get(endpoint, finalConfig);
};

export const post = (endpoint, data, config = {}) => {
  const finalConfig = config.authRequired ? withAuth(config) : config;
  return apiClient.post(endpoint, data, finalConfig);
};

export const put = (endpoint, data, config = {}) => {
  const finalConfig = config.authRequired ? withAuth(config) : config;
  return apiClient.put(endpoint, data, finalConfig);
};

export const del = (endpoint, config = {}) => {
  const finalConfig = config.authRequired ? withAuth(config) : config;
  return apiClient.delete(endpoint, finalConfig);
};

export default apiClient;
