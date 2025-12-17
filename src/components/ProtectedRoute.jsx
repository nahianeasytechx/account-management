// components/ProtectedRoute.js
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Store the attempted location for redirecting after login
  useEffect(() => {
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectPath', location.pathname);
    }
  }, [isAuthenticated, location]);

  if (!isAuthenticated) {
    // Redirect to login with the return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;