import React, { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('ledger-accounts');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: 'Premium',
        currency: 'USD',
        transactions: [
          { id: 't1', amount: 14.14, type: 'in', date: '2024-12-10', balance: 14.14 },
          { id: 't2', amount: 100, type: 'out', date: '2024-12-11', balance: -85.86 }
        ]
      },
      {
        id: '2',
        name: 'Regular',
        currency: 'BDT',
        transactions: [
          { id: 't3', amount: 100, type: 'in', date: '2024-12-12', balance: 100 }
        ]
      },
      {
        id: '3',
        name: 'Office Cash',
        currency: 'USD',
        transactions: []
      }
    ];
  });

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id);
  const [currentUser] = useState({ name: 'John Doe', role: 'Admin' });

  useEffect(() => {
    localStorage.setItem('ledger-accounts', JSON.stringify(accounts));
  }, [accounts]);

  const addAccount = (name, currency = 'USD') => {
    const newAccount = {
      id: Date.now().toString(),
      name,
      currency,
      transactions: []
    };
    setAccounts([...accounts, newAccount]);
    setSelectedAccountId(newAccount.id);
  };

  const updateAccountCurrency = (accountId, currency) => {
    setAccounts(accounts.map(acc => 
      acc.id === accountId ? { ...acc, currency } : acc
    ));
  };

  const deleteAccount = (accountId) => {
    if (accounts.length <= 1) {
      alert("Cannot delete the last account. You must have at least one account.");
      return false;
    }
    
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    setAccounts(updatedAccounts);
    
    // If the deleted account was selected, select the first account
    if (selectedAccountId === accountId) {
      setSelectedAccountId(updatedAccounts[0]?.id || null);
    }
    
    return true;
  };

  const addTransaction = (accountId, transaction) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        const lastBalance = acc.transactions.length > 0 
          ? acc.transactions[acc.transactions.length - 1].balance 
          : 0;
        
        const newBalance = transaction.type === 'in' 
          ? lastBalance + transaction.amount 
          : lastBalance - transaction.amount;

        const newTransaction = {
          ...transaction,
          id: Date.now().toString(),
          balance: newBalance
        };

        return {
          ...acc,
          transactions: [...acc.transactions, newTransaction]
        };
      }
      return acc;
    }));
  };

  const getAccountById = (id) => accounts.find(acc => acc.id === id);

  const getTotals = () => {
    let totalIn = 0;
    let totalOut = 0;

    accounts.forEach(acc => {
      acc.transactions.forEach(t => {
        if (t.type === 'in') totalIn += t.amount;
        else totalOut += t.amount;
      });
    });

    return {
      totalIn,
      totalOut,
      balance: totalIn - totalOut
    };
  };

  return (
    <TransactionContext.Provider value={{
      accounts,
      selectedAccountId,
      setSelectedAccountId,
      currentUser,
      addAccount,
      updateAccountCurrency,
      deleteAccount,
      addTransaction,
      getAccountById,
      getTotals
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransactions must be used within TransactionProvider');
  return context;
};