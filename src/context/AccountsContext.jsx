import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest } from './api'; // Use the API helper we created

const AccountsContext = createContext();

export const AccountsProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id;

  const storageKey = useMemo(
    () => (userId ? `ledger-accounts-${userId}` : null),
    [userId]
  );

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD USER ACCOUNTS FROM API
  =============================== */
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setAccounts([]);
      setSelectedAccountId(null);
      setLoading(false);
      return;
    }

    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const data = await apiRequest('accounts.php', 'GET');

        if (data.success) {
          setAccounts(data.data || []);
          setSelectedAccountId(data.data[0]?.id || null);
          // Optional: save to localStorage as cache
          localStorage.setItem(storageKey, JSON.stringify(data.data));
        } else {
          console.error('Failed to fetch accounts:', data.message);
          // Fallback to localStorage if available
          const saved = localStorage.getItem(storageKey);
          setAccounts(saved ? JSON.parse(saved) : []);
          setSelectedAccountId(saved ? JSON.parse(saved)[0]?.id : null);
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        const saved = localStorage.getItem(storageKey);
        setAccounts(saved ? JSON.parse(saved) : []);
        setSelectedAccountId(saved ? JSON.parse(saved)[0]?.id : null);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [isAuthenticated, userId, storageKey]);

  /* ===============================
     SAVE USER ACCOUNTS TO API
  =============================== */
  useEffect(() => {
    if (!isAuthenticated || !storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(accounts));
  }, [accounts, storageKey, isAuthenticated]);

  /* ===============================
     CLEAR DATA ON LOGOUT
  =============================== */
  useEffect(() => {
    if (!isAuthenticated) {
      setAccounts([]);
      setSelectedAccountId(null);
    }
  }, [isAuthenticated]);

  /* ===============================
     ACCOUNT ACTIONS (API integrated)
  =============================== */
  const createAccount = async (name, currency = 'BDT') => {
    try {
      const data = await apiRequest('accounts.php', 'POST', { name, currency });
      if (data.success) {
        setAccounts((prev) => [...prev, data.data]);
        setSelectedAccountId(data.data.id);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Create account failed:', error);
      return { success: false, message: error.message };
    }
  };

  const updateAccount = async (accountId, updates) => {
    try {
      const data = await apiRequest(`accounts.php?id=${accountId}`, 'PUT', updates);
      if (data.success) {
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === accountId ? { ...acc, ...updates } : acc))
        );
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Update account failed:', error);
      return { success: false, message: error.message };
    }
  };

  const deleteAccount = async (accountId) => {
    try {
      const data = await apiRequest(`accounts.php?id=${accountId}`, 'DELETE');
      if (data.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
        if (selectedAccountId === accountId) {
          const remaining = accounts.filter((a) => a.id !== accountId);
          setSelectedAccountId(remaining[0]?.id || null);
        }
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      console.error('Delete account failed:', error);
      return { success: false, message: error.message };
    }
  };

  const getAccountById = (id) => accounts.find((acc) => acc.id === id) || null;

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        loading,
        selectedAccountId,
        setSelectedAccountId,
        createAccount,
        updateAccount,
        deleteAccount,
        getAccountById,
        setAccounts,
      }}
    >
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountsProvider');
  }
  return context;
};
