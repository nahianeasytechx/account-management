import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, handleApiError } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await apiRequest('GET', '/auth/me');
          if (response && response.data) {
            setCurrentUser(response.data);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Failed to validate token:', error);
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiRequest('POST', '/auth/login', {
        email,
        password,
      });

      // Extract tokens and user data from response
      const { access_token, refresh_token, user } = response.data || response;

      if (!access_token || !user) {
        throw new Error('Invalid response from server');
      }

      // Store tokens
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Store user data
      setCurrentUser(user);
      setIsAuthenticated(true);

      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(user));

      toast.success(response.message || 'Login successful');
      return { success: true, data: user };
    } catch (error) {
      const message = handleApiError(error, 'Login failed');
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiRequest('POST', '/auth/register', {
        name: userData.name,
        email: userData.email,
        password: userData.password,
      });

      // Extract tokens and user data from response
      const { access_token, refresh_token, user } = response.data || response;

      if (!access_token || !user) {
        throw new Error('Invalid response from server');
      }

      // Store tokens
      localStorage.setItem('access_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Store user data
      setCurrentUser(user);
      setIsAuthenticated(true);

      // Store in localStorage for persistence
      localStorage.setItem('currentUser', JSON.stringify(user));

      toast.success(response.message || 'Registration successful');
      return { success: true, data: user };
    } catch (error) {
      const message = handleApiError(error, 'Registration failed');
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiRequest('POST', '/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear storage and state
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setIsAuthenticated(false);
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await apiRequest('PUT', '/user/profile', updates);
      const updatedUser = response.data || response;
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      toast.success(response.message || 'Profile updated successfully');
      return { success: true, data: updatedUser };
    } catch (error) {
      const message = handleApiError(error, 'Failed to update profile');
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await apiRequest('PUT', '/user/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success(response.message || 'Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error, 'Failed to change password');
      return { success: false, message };
    }
  };

  const getProfile = async () => {
    try {
      const response = await apiRequest('GET', '/auth/me');
      const user = response.data || response;
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      return { success: true, data: user };
    } catch (error) {
      const message = handleApiError(error, 'Failed to load profile');
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        getProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};