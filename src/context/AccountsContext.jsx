import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest, handleApiError } from '../utils/api';
import toast from 'react-hot-toast';

const AccountsContext = createContext();

export const AccountsProvider = ({ children }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState('all');

  // Fetch accounts on mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/accounts');
      setAccounts(response.data || []);
    } catch (error) {
      handleApiError(error, 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (name, currencyCode) => {
    try {
      const response = await apiRequest('POST', '/accounts', {
        name,
        currency_code: currencyCode,
      });

      const newAccount = response.data;
      setAccounts([...accounts, newAccount]);
      toast.success(response.message || 'Account created successfully');
      return { success: true, data: newAccount };
    } catch (error) {
      const message = handleApiError(error, 'Failed to create account');
      return { success: false, message };
    }
  };

  const updateAccount = async (accountId, updates) => {
    try {
      const response = await apiRequest('PUT', `/accounts/${accountId}`, updates);
      
      setAccounts(accounts.map(account =>
        account.id === accountId ? { ...account, ...response.data } : account
      ));
      
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
      
      setAccounts(accounts.filter(account => account.id !== accountId));
      if (selectedAccountId === accountId) {
        setSelectedAccountId('all');
      }
      
      toast.success('Account deleted successfully');
      return { success: true };
    } catch (error) {
      const message = handleApiError(error, 'Failed to delete account');
      return { success: false, message };
    }
  };

  const getAccountBalance = (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? parseFloat(account.current_balance) : 0;
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, account) => sum + parseFloat(account.current_balance || 0), 0);
  };

  const getTotalTransactions = () => {
    return accounts.reduce((sum, account) => sum + parseInt(account.transaction_count || 0), 0);
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
        getAccountBalance,
        getTotalBalance,
        getTotalTransactions,
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