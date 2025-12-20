// src/context/TransactionContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { apiRequest, handleApiError, API_ENDPOINTS } from '../config/api';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async (accountId = 'all', type = 'all') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (accountId !== 'all') params.append('account_id', accountId);
      if (type !== 'all') params.append('type', type);

      const response = await apiRequest('GET', `${API_ENDPOINTS.DASHBOARD_SUMMARY}?${params.toString()}`);
      if (response.success) {
        setTransactions(response.data.transactions || []);
        return { success: true, data: response.data };
      }
      return { success: false, message: 'Failed to fetch transactions' };
    } catch (error) {
      const message = handleApiError(error, 'Failed to fetch transactions');
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const getDashboardSummary = async (accountId = 'all', type = 'all') => {
    try {
      const result = await fetchTransactions(accountId, type);
      if (result.success) return { success: true, data: result.data };
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        fetchTransactions,
        getDashboardSummary,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransactions must be used within TransactionProvider');
  return context;
};
