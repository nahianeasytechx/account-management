import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccountsProvider } from './context/AccountsContext'; // Add this import
import { TransactionProvider } from './context/TransactionContext';
import Login from './pages/Login';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* Wrap with AccountsProvider FIRST */}
        <AccountsProvider>
          {/* Then wrap with TransactionProvider */}
          <TransactionProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TransactionProvider>
        </AccountsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;