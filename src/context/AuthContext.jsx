import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from './api';
import PreLoader from '../components/PreLoader';

const AuthContext = createContext();

// Error Display Component
const ErrorScreen = ({ message, onRetry }) => {
  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 border border-red-200 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          {/* Error Icon */}
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Connection Error
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            {message || "Unable to connect to the server. Please check your internet connection and try again."}
          </p>
          
          <button
            onClick={onRetry}
            className="w-full bg-linear-to-r from-blue-500 to-green-500 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-600 hover:to-green-600 transition-all shadow-md hover:shadow-lg"
          >
            Retry Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isLoading, setIsLoading] = useState(() => {
    // Only set loading true if there's a token to verify
    return !!localStorage.getItem('token');
  });
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState(null);

  // Verify token on mount (page load/reload)
  const verifyToken = async () => {
    const token = localStorage.getItem('token');
    
    // Only show loader and verify if token exists
    if (token) {
      setShowLoader(true);
      setError(null);
      
      try {
        // Wait for minimum display time (smooth animation)
        const minDisplayTime = 1000;
        const startTime = Date.now();
        
        // Verify the token
        const data = await apiRequest('auth.php', 'POST', { action: 'verify' });
        
        if (!data.success) {
          // Token invalid, clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
        }
        
        // Ensure loader shows for minimum time
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);
        
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        setShowLoader(false);
        setIsLoading(false);
      } catch (err) {
        // API request failed
        setError(err.message || "Failed to connect to server");
        setShowLoader(false);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, []);

  const login = async (username, password) => {
    try {
      const data = await apiRequest('auth.php', 'POST', { action: 'login', username, password });
      
      if (!data.success) {
        return { success: false, message: data.message };
      }

      // Show loader for smooth transition
      setShowLoader(true);
      
      // Wait for minimum display time before showing dashboard
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCurrentUser(data.data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      localStorage.setItem('token', data.data.token);
      
      setShowLoader(false);
      return { success: true, message: 'Login successful' };
    } catch (err) {
      setShowLoader(false);
      return { success: false, message: err.message || "Network error. Please try again." };
    }
  };

  const register = async ({ username, email, password, name }) => {
    try {
      const data = await apiRequest('auth.php', 'POST', { action: 'register', username, email, password, name });
      
      if (!data.success) {
        return { success: false, message: data.message };
      }

      // Show loader for smooth transition
      setShowLoader(true);

      // Wait for minimum display time
      await new Promise(resolve => setTimeout(resolve, 2000));

      setCurrentUser(data.data.user);
      localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      localStorage.setItem('token', data.data.token);
      
      setShowLoader(false);
      return { success: true, message: 'Registration successful' };
    } catch (err) {
      setShowLoader(false);
      return { success: false, message: err.message || "Network error. Please try again." };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    return { success: true, message: 'Logged out successfully' };
  };

  const isAuthenticated = !!currentUser;

  // Show error screen if API failed during initial verification
  if (error) {
    return <ErrorScreen message={error} onRetry={() => {
      setError(null);
      setIsLoading(true);
      verifyToken();
    }} />;
  }

  // Show loader during initial verification (only if token exists) or login/register
  if (isLoading || showLoader) {
    return <PreLoader />;
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