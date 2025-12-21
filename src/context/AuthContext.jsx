import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const data = await apiRequest('auth.php', 'POST', { action: 'verify' });
        if (!data.success) {
          // Token invalid, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  const login = async (username, password) => {
    const data = await apiRequest('auth.php', 'POST', { action: 'login', username, password });
    if (!data.success) return { success: false, message: data.message };

    setCurrentUser(data.data.user);
    localStorage.setItem('currentUser', JSON.stringify(data.data.user));
    localStorage.setItem('token', data.data.token);
    return { success: true, message: 'Login successful' };
  };

  const register = async ({ username, email, password, name }) => {
    const data = await apiRequest('auth.php', 'POST', { action: 'register', username, email, password, name });
    if (!data.success) return { success: false, message: data.message };

    setCurrentUser(data.data.user);
    localStorage.setItem('currentUser', JSON.stringify(data.data.user));
    localStorage.setItem('token', data.data.token);
    return { success: true, message: 'Registration successful' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    return { success: true, message: 'Logged out successfully' };
  };

  const isAuthenticated = !!currentUser;

  if (isLoading) {
    return <div>Loading...</div>; // Or your loading component
  }

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};