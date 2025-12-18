import axios from 'axios';
import toast from 'react-hot-toast';

// API Configuration
const API_URL = 'http://localhost/sites/ledger-backend/api/'; // Update this to match your backend URL
const API_TIMEOUT = 30000;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Handle different response formats
    if (response.data && typeof response.data === 'object') {
      return response.data;
    }
    return { success: true, data: response.data };
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors (unauthorized/token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh token
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = refreshResponse.data;
        localStorage.setItem('access_token', access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear all auth data and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('currentUser');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      const networkError = {
        message: 'Network error. Please check your internet connection.',
        status: 0,
        data: null
      };
      toast.error(networkError.message);
      return Promise.reject(networkError);
    }

    // Handle server errors
    const serverError = {
      message: error.response.data?.message || error.response.statusText || 'An error occurred',
      status: error.response.status,
      data: error.response.data
    };

    // Don't show toast for 401 errors (already handled above)
    if (error.response.status !== 401) {
      toast.error(serverError.message);
    }

    return Promise.reject(serverError);
  }
);

// API request helper
export const apiRequest = async (method, endpoint, data = null, options = {}) => {
  try {
    const config = {
      method: method.toLowerCase(),
      url: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
      ...options
    };

    if (data) {
      if (method.toLowerCase() === 'get') {
        config.params = data;
      } else {
        config.data = data;
      }
    }

    console.log(`API Request: ${method.toUpperCase()} ${endpoint}`, data);
    const response = await api(config);
    console.log(`API Response: ${endpoint}`, response);
    return response;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Handle API errors with toast notifications
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  const message = error.message || error.data?.message || defaultMessage;
  
  // Don't show toast for 401 errors (handled by interceptor)
  if (error.status !== 401 && error.message !== 'No refresh token available') {
    toast.error(message);
  }
  
  console.error('API Error Details:', error);
  return message;
};

// Upload file helper
export const uploadFiles = async (endpoint, files, data = {}) => {
  const formData = new FormData();

  // Add files
  if (Array.isArray(files)) {
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
  } else {
    formData.append('file', files);
  }

  // Add additional data
  Object.keys(data).forEach((key) => {
    formData.append(key, data[key]);
  });

  try {
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Helper to get full file URL
export const getFileUrl = (fileId, type = 'download') => {
  return `${API_URL}/files/${type}/${fileId}`;
};

// Helper to check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

// Helper to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default api;