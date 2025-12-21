import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';

const AccountsContext = createContext();

export const AccountsProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const userId = currentUser?.id;

  // Fixed: Ensure storageKey properly reflects user id
  const storageKey = useMemo(
    () => (userId ? `ledger-accounts-${userId}` : null),
    [userId]
  );

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ===============================
     LOAD USER DATA
  =============================== */
  useEffect(() => {
    // Fixed: Clear data when no user is logged in
    if (!isAuthenticated || !userId) {
      setAccounts([]);
      setSelectedAccountId(null);
      setLoading(false);
      return;
    }

    if (!storageKey) return;

    setLoading(true);
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      
      setAccounts(parsed);
      setSelectedAccountId(parsed[0]?.id || null);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [storageKey, isAuthenticated, userId]); // Added isAuthenticated and userId to dependencies

  /* ===============================
     SAVE USER DATA
  =============================== */
  useEffect(() => {
    // Fixed: Only save if user is authenticated
    if (!isAuthenticated || !storageKey) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(accounts));
    } catch (error) {
      console.error('Error saving accounts:', error);
    }
  }, [accounts, storageKey, isAuthenticated]);

  /* ===============================
     CLEAR DATA ON LOGOUT
  =============================== */
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear local state when user logs out
      setAccounts([]);
      setSelectedAccountId(null);
    }
  }, [isAuthenticated]);

  /* ===============================
     ACCOUNT ACTIONS
  =============================== */

  const createAccount = (name) => {
    const newAccount = {
      id: Date.now().toString(),
      name,
      currency: 'BDT',
      transactions: [],
      createdAt: new Date().toISOString(),
    };

    setAccounts((prev) => [...prev, newAccount]);
    setSelectedAccountId(newAccount.id);
  };

  const updateAccount = (accountId, updates) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId ? { ...acc, ...updates } : acc
      )
    );
  };

  const deleteAccount = (accountId) => {
    setAccounts((prev) => prev.filter((a) => a.id !== accountId));

    if (selectedAccountId === accountId) {
      const remainingAccounts = accounts.filter((a) => a.id !== accountId);
      setSelectedAccountId(remainingAccounts[0]?.id || null);
    }
  };

  const getAccountById = (id) =>
    accounts.find((acc) => acc.id === id) || null;

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
        setAccounts, // Fixed: Expose setAccounts if TransactionContext needs it
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