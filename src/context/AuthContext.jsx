// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  API_ENDPOINTS, 
  get, 
  post, 
  setTokens, 
  clearTokens, 
  isAuthenticated as checkAuth,
  handleApiError
} from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!checkAuth()) {
        setLoading(false);
        return;
      }

      try {
        const response = await get(API_ENDPOINTS.AUTH_ME);
        let userData = response?.data || response;

        if (userData?.id || userData?.email) {
          setCurrentUser(userData);
        } else {
          clearTokens();
        }
      } catch (error) {
        clearTokens();
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Function to check authentication
  const isAuthenticated = () => !!currentUser;

  // Login function
  const login = async (email, password) => {
    try {
      const response = await post(API_ENDPOINTS.AUTH_LOGIN, { email, password });

      if (response.success && response.data?.user && response.data?.access_token) {
        setTokens(response.data.access_token, response.data.refresh_token);
        setCurrentUser(response.data.user);

        return {
          success: true,
          message: response.message,
          user: response.data.user
        };
      } else {
        return { success: false, message: 'Invalid server response format' };
      }
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await post(API_ENDPOINTS.AUTH_LOGOUT, { refresh_token: refreshToken }).catch(() => {});
      }
    } finally {
      clearTokens();
      setCurrentUser(null);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await post(API_ENDPOINTS.AUTH_REGISTER, {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      }, { skipAuth: true });

      return {
        success: response.success !== false,
        message: response.message || 'Registration successful',
        data: response.data || null
      };
    } catch (error) {
      return { success: false, message: handleApiError(error, 'Registration failed') };
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAuthenticated, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
