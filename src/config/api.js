// src/config/api.js

// ============================================
// API BASE URL - UPDATE THIS TO MATCH YOUR BACKEND
// ============================================
export const API_BASE_URL = 'http://localhost/sites/ledger-backend/api';

// ============================================
// API ENDPOINTS
// ============================================
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_REGISTER: '/auth/register',
  AUTH_LOGIN: '/auth/login',
  AUTH_REFRESH: '/auth/refresh',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_ME: '/auth/me',
  AUTH_VERIFY: '/auth/verify',

  // Account endpoints
  ACCOUNTS: '/accounts',
  ACCOUNT_BY_ID: (id) => `/accounts/${id}`,
  ACCOUNT_BALANCE: (id) => `/accounts/${id}/balance`,

  // Transaction endpoints
  TRANSACTIONS: '/transactions',
  TRANSACTION_BY_ID: (id) => `/transactions/${id}`,
  TRANSACTION_FILES: (id) => `/transactions/${id}/files`,
  TRANSACTION_FILE_DELETE: (transactionId, fileId) => `/transactions/${transactionId}/files/${fileId}`,

  // Dashboard endpoints
  DASHBOARD_SUMMARY: '/dashboard/summary',
  DASHBOARD_OVERVIEW: '/dashboard/overview',
  DASHBOARD_EXPORT: '/dashboard/export',
  DASHBOARD_STATEMENT: '/dashboard/statement',

  // User endpoints
  USER_PROFILE: '/user/profile',
  USER_CHANGE_PASSWORD: '/user/password',
  USER_DELETE: '/user/delete',
  USER_STATISTICS: '/user/statistics',

  // File endpoints
  FILE_DOWNLOAD: (fileId) => `/files/${fileId}/download`,
  FILE_PREVIEW: (fileId) => `/files/${fileId}/preview`,
  FILE_THUMBNAIL: (fileId) => `/files/${fileId}/thumbnail`,
};

// ============================================
// TOKEN MANAGEMENT
// ============================================

/**
 * Get access token from localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

/**
 * Store tokens in localStorage
 */
export const setTokens = (accessToken, refreshToken = null) => {
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

/**
 * Clear tokens from localStorage
 */
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

// ============================================
// REFRESH TOKEN LOGIC
// ============================================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    // Handle different response structures
    let newAccessToken;
    if (data.data && data.data.access_token) {
      newAccessToken = data.data.access_token;
    } else if (data.access_token) {
      newAccessToken = data.access_token;
    } else if (data.token) {
      newAccessToken = data.token;
    } else {
      throw new Error('No access token in refresh response');
    }

    setTokens(newAccessToken);
    processQueue(null, newAccessToken);
    
    return newAccessToken;
  } catch (error) {
    processQueue(error, null);
    clearTokens();
    
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// ============================================
// MAIN API REQUEST FUNCTION - SIMPLIFIED
// ============================================

/**
 * Make API request with automatic token refresh
 * @param {string} method - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {string} endpoint - API endpoint
 * @param {object|FormData} data - Request body data
 * @param {object} options - Additional fetch options
 * @returns {Promise<object>} - Response data
 */
export const apiRequest = async (method, endpoint, data = null, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAccessToken();

  console.log(`API Request: ${method} ${url}`);

  // Prepare headers
  const headers = {
    ...options.headers,
  };

  // Add Content-Type for JSON (except for FormData)
  if (!(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization header if token exists
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Prepare fetch config
  const config = {
    method,
    headers,
    credentials: 'include',
    ...options,
  };

  // Add body if data exists
  if (data) {
    if (data instanceof FormData) {
      // Let browser set Content-Type for FormData
      delete headers['Content-Type'];
      config.body = data;
    } else if (method !== 'GET' && method !== 'DELETE') {
      config.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(url, config);
    
    // Handle "Failed to fetch" - server unreachable
    if (response.status === 0) {
      throw new Error(`Cannot connect to server at ${url}. Check if backend is running.`);
    }
    
    console.log(`API Response: ${response.status} ${response.statusText}`);
    
    // Parse response
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      // Try to parse as JSON if it looks like JSON
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }
      } else {
        responseData = text;
      }
    }
    
    // Handle error responses
    if (!response.ok) {
      const error = new Error(responseData.message || responseData.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = responseData;
      throw error;
    }
    
    return responseData;
  } catch (error) {
    console.error('API Request Error:', {
      error: error.message,
      method,
      endpoint,
      url
    });
    
    throw error;
  }
};

// ============================================
// CONVENIENCE API METHODS
// ============================================

/**
 * GET request
 */
export const get = (endpoint, options = {}) => {
  return apiRequest('GET', endpoint, null, options);
};

/**
 * POST request
 */
export const post = (endpoint, data, options = {}) => {
  return apiRequest('POST', endpoint, data, options);
};

/**
 * PUT request
 */
export const put = (endpoint, data, options = {}) => {
  return apiRequest('PUT', endpoint, data, options);
};

/**
 * PATCH request
 */
export const patch = (endpoint, data, options = {}) => {
  return apiRequest('PATCH', endpoint, data, options);
};

/**
 * DELETE request
 */
export const del = (endpoint, options = {}) => {
  return apiRequest('DELETE', endpoint, null, options);
};

// ============================================
// ERROR HANDLING
// ============================================

/**
 * Extract user-friendly error message from error object
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  if (error.message) {
    return error.message;
  }
  
  if (error.data) {
    if (typeof error.data === 'object') {
      return error.data.message || error.data.error || 
             (error.data.errors && Array.isArray(error.data.errors) && error.data.errors[0]) ||
             defaultMessage;
    } else if (typeof error.data === 'string') {
      return error.data;
    }
  }
  
  return defaultMessage;
};

/**
 * Test connection to backend
 */
export const testConnection = async () => {
  try {
    const response = await fetch(API_BASE_URL);
    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        message: 'Backend is reachable',
        data
      };
    }
    return {
      connected: false,
      message: `Backend responded with ${response.status}`
    };
  } catch (error) {
    return {
      connected: false,
      message: `Cannot connect to backend: ${error.message}`
    };
  }
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  apiRequest,
  get,
  post,
  put,
  patch,
  del,
  getAccessToken,
  setTokens,
  clearTokens,
  isAuthenticated,
  handleApiError,
  testConnection,
};