import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiRequest } from './api';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => currentUser?.id, [currentUser?.id]);

  /* ===============================
     LOAD ACCOUNTS + TRANSACTIONS FROM API
  =============================== */
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setAccounts([]);
      setSelectedAccountId(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const data = await apiRequest('accounts.php', 'GET');

        if (!isMounted) return;

        if (data.success && data.data) {
          const accountsWithTransactions = data.data.map(acc => ({
            ...acc,
            transactions: (acc.transactions || []).map(t => ({
              ...t,
              amount: parseFloat(t.amount) || 0,
              balance: parseFloat(t.balance) || 0,
            })),
          }));

          setAccounts(accountsWithTransactions);
          setSelectedAccountId(accountsWithTransactions[0]?.id || null);
        } else {
          setAccounts([]);
          setSelectedAccountId(null);
          console.error('Failed to fetch accounts:', data.message);
        }
      } catch (error) {
        if (isMounted) {
          setAccounts([]);
          setSelectedAccountId(null);
        }
        console.error('Error fetching accounts:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAccounts();
    return () => { isMounted = false; };
  }, [isAuthenticated, userId]);

  /* ===============================
     ACCOUNT ACTIONS
  =============================== */
  const addAccount = useCallback(async (name, currency = 'BDT') => {
    try {
      const data = await apiRequest('accounts.php', 'POST', { name, currency });

      if (data.success && data.data) {
        const newAccount = {
          ...data.data,
          transactions: (data.data.transactions || []).map(t => ({
            ...t,
            amount: parseFloat(t.amount) || 0,
            balance: parseFloat(t.balance) || 0,
          })),
        };

        setAccounts(prev => [...prev, newAccount]);
        setSelectedAccountId(newAccount.id);
        return { success: true, data: newAccount };
      }

      return { success: false, message: data.message || 'Failed to add account' };
    } catch (error) {
      console.error('Add account failed:', error);
      return { success: false, message: error.message };
    }
  }, []);

  const deleteAccount = useCallback(async (accountId) => {
    try {
      const data = await apiRequest(`accounts.php?id=${accountId}`, 'DELETE');

      if (data.success) {
        setAccounts(prev => {
          const filtered = prev.filter(a => a.id !== accountId);
          if (selectedAccountId === accountId) {
            setSelectedAccountId(filtered[0]?.id || null);
          }
          return filtered;
        });
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (error) {
      console.error('Delete account failed:', error);
      return { success: false, message: error.message };
    }
  }, [selectedAccountId]);

  const getAccountById = useCallback((id) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return null;
    return {
      ...account,
      transactions: account.transactions || [],
    };
  }, [accounts]);

  /* ===============================
     TRANSACTION ACTIONS
  =============================== */
  const addTransaction = useCallback(async (accountId, transactionData) => {
    try {
      const data = await apiRequest('transactions.php', 'POST', {
        account_id: accountId,
        ...transactionData,
      });

      if (data.success && data.data) {
        const transaction = {
          ...data.data,
          amount: parseFloat(data.data.amount) || 0,
          balance: parseFloat(data.data.balance) || 0,
        };

        setAccounts(prev =>
          prev.map(acc =>
            acc.id === accountId
              ? { ...acc, transactions: [...(acc.transactions || []), transaction] }
              : acc
          )
        );

        return { success: true, data: transaction };
      }

      return { success: false, message: data.message || 'Failed to add transaction' };
    } catch (error) {
      console.error('Add transaction failed:', error);
      return { success: false, message: error.message };
    }
  }, []);

  const editTransaction = useCallback(async (accountId, transactionId, updates) => {
    try {
      const data = await apiRequest(`transactions.php?id=${transactionId}`, 'PUT', updates);

      if (data.success) {
        setAccounts(prev =>
          prev.map(acc =>
            acc.id === accountId
              ? {
                  ...acc,
                  transactions: (acc.transactions || []).map(t =>
                    t.id === transactionId
                      ? { ...t, ...updates, amount: parseFloat(updates.amount || t.amount), balance: parseFloat(updates.balance || t.balance) }
                      : t
                  ),
                }
              : acc
          )
        );

        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (error) {
      console.error('Edit transaction failed:', error);
      return { success: false, message: error.message };
    }
  }, []);

  const deleteTransaction = useCallback(async (accountId, transactionId) => {
    try {
      const data = await apiRequest(`transactions.php?id=${transactionId}`, 'DELETE');

      if (data.success) {
        setAccounts(prev =>
          prev.map(acc =>
            acc.id === accountId
              ? {
                  ...acc,
                  transactions: (acc.transactions || []).filter(t => t.id !== transactionId),
                }
              : acc
          )
        );
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (error) {
      console.error('Delete transaction failed:', error);
      return { success: false, message: error.message };
    }
  }, []);

  /* ===============================
     DERIVED DATA
  =============================== */
  const getAllTransactions = useCallback(() =>
    accounts.flatMap(acc =>
      (acc.transactions || []).map(t => ({
        ...t,
        accountId: acc.id,
        accountName: acc.name,
        currency: acc.currency,
      }))
    )
  , [accounts]);

  const getTotals = useCallback(() => {
    let totalIn = 0;
    let totalOut = 0;

    accounts.forEach(acc => {
      (acc.transactions || []).forEach(t => {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'in') totalIn += amount;
        else totalOut += amount;
      });
    });

    return {
      totalIn: parseFloat(totalIn.toFixed(2)),
      totalOut: parseFloat(totalOut.toFixed(2)),
      balance: parseFloat((totalIn - totalOut).toFixed(2)),
    };
  }, [accounts]);

  const contextValue = useMemo(() => ({
    loading,
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    addAccount,
    deleteAccount,
    getAccountById,
    addTransaction,
    editTransaction,
    deleteTransaction,
    getAllTransactions,
    getTotals,
  }), [
    loading, accounts, selectedAccountId,
    addAccount, deleteAccount, getAccountById,
    addTransaction, editTransaction, deleteTransaction,
    getAllTransactions, getTotals,
  ]);

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransactions must be used within TransactionProvider');
  return context;
};
