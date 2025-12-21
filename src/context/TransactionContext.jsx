import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from './AuthContext';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const storageKey = useMemo(
    () => (userId ? `ledger-accounts-${userId}` : null),
    [userId]
  );

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD USER DATA
  =============================== */
  useEffect(() => {
    if (!storageKey) return;

    setLoading(true);
    const saved = localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : [];

    setAccounts(parsed);
    setLoading(false);
  }, [storageKey]);

  /* ===============================
     SAVE USER DATA
  =============================== */
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(accounts));
  }, [accounts, storageKey]);

  /* ===============================
     ACCOUNT ACTIONS
  =============================== */

  // ✅ EXACT name Sidebar expects
  const addAccount = (name, currency = 'BDT') => {
    const newAccount = {
      id: Date.now().toString(),
      name,
      currency,
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    setAccounts((prev) => [...prev, newAccount]);
    setSelectedAccountId(newAccount.id);
  };

  const deleteAccount = (accountId) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));

    if (selectedAccountId === accountId) {
      setSelectedAccountId('all');
    }
  };

  const getAccountById = (id) =>
    accounts.find((a) => a.id === id) || null;

  /* ===============================
     TRANSACTION ACTIONS
  =============================== */

  const addTransaction = (accountId, data) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;

        const lastBalance =
          acc.transactions.length > 0
            ? acc.transactions[acc.transactions.length - 1].balance
            : 0;

        const newBalance =
          data.type === 'in'
            ? lastBalance + data.amount
            : lastBalance - data.amount;

        const transaction = {
          id: Date.now().toString(),
          ...data,
          date: data.date || new Date().toISOString(), // ✅ REQUIRED
          balance: newBalance,
        };

        return {
          ...acc,
          transactions: [...acc.transactions, transaction],
        };
      })
    );
  };

  const editTransaction = (accountId, transactionId, updates) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;

        let runningBalance = 0;

        const updatedTransactions = acc.transactions.map((t) => {
          const updated =
            t.id === transactionId ? { ...t, ...updates } : t;

          runningBalance =
            updated.type === 'in'
              ? runningBalance + updated.amount
              : runningBalance - updated.amount;

          return { ...updated, balance: runningBalance };
        });

        return { ...acc, transactions: updatedTransactions };
      })
    );
  };

  const deleteTransaction = (accountId, transactionId) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;

        let runningBalance = 0;
        const filtered = acc.transactions
          .filter((t) => t.id !== transactionId)
          .map((t) => {
            runningBalance =
              t.type === 'in'
                ? runningBalance + t.amount
                : runningBalance - t.amount;

            return { ...t, balance: runningBalance };
          });

        return { ...acc, transactions: filtered };
      })
    );
  };

  /* ===============================
     DERIVED DATA
  =============================== */

  const getAllTransactions = () =>
    accounts.flatMap((acc) =>
      acc.transactions.map((t) => ({
        ...t,
        accountId: acc.id,
        accountName: acc.name,
        currency: acc.currency,
      }))
    );

  const getTotals = () => {
    let totalIn = 0;
    let totalOut = 0;

    accounts.forEach((acc) =>
      acc.transactions.forEach((t) =>
        t.type === 'in'
          ? (totalIn += t.amount)
          : (totalOut += t.amount)
      )
    );

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut,
    };
  };

  return (
    <TransactionContext.Provider
      value={{
        loading,
        accounts,
        selectedAccountId,
        setSelectedAccountId,
        addAccount,          // ✅ FIXED
        deleteAccount,
        getAccountById,
        addTransaction,
        editTransaction,
        deleteTransaction,
        getAllTransactions,
        getTotals,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error(
      'useTransactions must be used within TransactionProvider'
    );
  }
  return context;
};
