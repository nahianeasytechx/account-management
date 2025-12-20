// src/context/TransactionContext.jsx - UPDATED
import React, { createContext, useContext, useCallback } from 'react';
import { apiRequest, handleApiError } from '../config/api';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const getDashboardSummary = useCallback(async (accountId = 'all', type = 'all') => {
    try {
      const params = new URLSearchParams();
      if (accountId !== 'all') params.append('account_id', accountId);
      if (type !== 'all') params.append('type', type);
      
      const queryString = params.toString();
      const url = `/dashboard/summary${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest('GET', url);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to load dashboard summary');
      return { success: false, message };
    }
  }, []);

  const addTransaction = async (accountId, transactionData) => {
    try {
      const response = await apiRequest('POST', '/transactions', {
        ...transactionData,
        account_id: accountId
      });
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to add transaction');
      return { success: false, message };
    }
  };

  const updateTransaction = async (transactionId, updates) => {
    try {
      const response = await apiRequest('PUT', `/transactions/${transactionId}`, updates);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to update transaction');
      return { success: false, message };
    }
  };

  const deleteTransaction = async (transactionId) => {
    try {
      const response = await apiRequest('DELETE', `/transactions/${transactionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to delete transaction');
      return { success: false, message };
    }
  };

  const fetchTransactions = async (accountId = '', filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('account_id', accountId);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const queryString = params.toString();
      const url = `/transactions${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest('GET', url);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to load transactions');
      return { success: false, message };
    }
  };

  const getTransaction = async (transactionId) => {
    try {
      const response = await apiRequest('GET', `/transactions/${transactionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to load transaction');
      return { success: false, message };
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        getDashboardSummary,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        fetchTransactions,
        getTransaction
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