import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, handleApiError } from '../config/api';
import toast from 'react-hot-toast';

const AccountsContext = createContext();

export const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  // Use useCallback to memoize refreshAccounts
  const refreshAccounts = useCallback(async () => {
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
    refreshAccounts();
  }, [refreshAccounts]);

  const getAccountById = useCallback(
    (id) => accounts.find(acc => acc.id === id) || null,
    [accounts]
  );

  const createAccount = async (accountData) => {
    try {
      // Always create account with BDT currency
      const dataWithBDT = {
        ...accountData,
        currency: 'BDT' // Force BDT currency
      };
      const response = await apiRequest('POST', '/accounts', dataWithBDT);
      const newAccount = response.data;
      setAccounts(prev => [...prev, newAccount]);
      toast.success(response.message || 'Account created successfully');
      return { success: true, data: newAccount };
    } catch (error) {
      const message = handleApiError(error, 'Failed to create account');
      return { success: false, message };
    }
  };

  const updateAccount = async (accountId, updates) => {
    try {
      // Remove currency from updates if present (we only use BDT)
      const { currency, ...filteredUpdates } = updates;
      const response = await apiRequest('PUT', `/accounts/${accountId}`, filteredUpdates);
      const updatedAccount = response.data;
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, ...updatedAccount } : acc
      ));
      toast.success(response.message || 'Account updated successfully');
      return { success: true, data: updatedAccount };
    } catch (error) {
      const message = handleApiError(error, 'Failed to update account');
      return { success: false, message };
    }
  };

  const deleteAccount = async (accountId) => {
    try {
      const response = await apiRequest('DELETE', `/accounts/${accountId}`);
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      // If the deleted account was selected, reset to 'all'
      if (selectedAccountId === accountId) {
        setSelectedAccountId('all');
      }
      
      toast.success(response.message || 'Account deleted successfully');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error, 'Failed to delete account');
      return { success: false, message };
    }
  };

  const getAccountBalance = async (accountId) => {
    try {
      const response = await apiRequest('GET', `/accounts/${accountId}/balance`);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to load account balance');
      return { success: false, message };
    }
  };

  const getLedgerData = async (accountId) => {
    try {
      const response = await apiRequest('GET', `/ledger/${accountId}`);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to load ledger data');
      return { success: false, message };
    }
  };

  const getAccountSummary = async (accountId) => {
    try {
      const response = await apiRequest('GET', `/ledger/${accountId}/summary`);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to load account summary');
      return { success: false, message };
    }
  };

  const getAccountTransactions = async (accountId, filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `/ledger/${accountId}/transactions${queryParams ? `?${queryParams}` : ''}`;
      const response = await apiRequest('GET', url);
      return { success: true, data: response.data };
    } catch (error) {
      const message = handleApiError(error, 'Failed to load transactions');
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
        refreshAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
        getAccountById,
        getAccountBalance,
        getLedgerData,
        getAccountSummary,
        getAccountTransactions
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