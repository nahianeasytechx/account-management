// src/context/AccountsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, handleApiError } from '../config/api';
import toast from 'react-hot-toast';

const AccountsContext = createContext();

export const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/accounts');
      setAccounts(response.data || []);
    } catch (error) {
      handleApiError(error, 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const getAccountById = useCallback(
    (id) => accounts.find(acc => acc.id === id) || null,
    [accounts]
  );

  const createAccount = async (name, currencyCode) => {
    try {
      const response = await apiRequest('POST', '/accounts', { name, currency_code: currencyCode });
      setAccounts(prev => [...prev, response.data]);
      toast.success(response.message || 'Account created successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to create account');
      return { success: false, message };
    }
  };

  const updateAccount = async (accountId, updates) => {
    try {
      const response = await apiRequest('PUT', `/accounts/${accountId}`, updates);
      setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, ...response.data } : acc));
      toast.success(response.message || 'Account updated successfully');
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to update account');
      return { success: false, message };
    }
  };

  const deleteAccount = async (accountId) => {
    try {
      await apiRequest('DELETE', `/accounts/${accountId}`);
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      if (selectedAccountId === accountId) setSelectedAccountId('all');
      toast.success('Account deleted successfully');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error, 'Failed to delete account');
      return { success: false, message };
    }
  };

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        loading,
        selectedAccountId,
        setSelectedAccountId,
        fetchAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
        getAccountById,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) throw new Error('useAccounts must be used within AccountsProvider');
  return context;
};
