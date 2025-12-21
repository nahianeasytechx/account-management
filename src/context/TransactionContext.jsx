import React, { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

export const TransactionProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('ledger-accounts');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: 'Main Account',
        currency: 'BDT',
        transactions: [
          { 
            id: 't1', 
            amount: 5000, 
            type: 'in', 
            date: '2024-12-10', 
            balance: 5000,
            source: 'Client Payment',
            description: 'Payment from ABC Corp for project work'
          },
          { 
            id: 't2', 
            amount: 1500, 
            type: 'out', 
            date: '2024-12-11', 
            balance: 3500,
            paidTo: 'Office Supplies',
            description: 'Purchase of office stationery'
          }
        ]
      },
      {
        id: '2',
        name: 'Savings Account',
        currency: 'BDT',
        transactions: [
          { 
            id: 't3', 
            amount: 10000, 
            type: 'in', 
            date: '2024-12-12', 
            balance: 10000,
            source: 'Freelance Work',
            description: 'Web development project completion'
          }
        ]
      },
      {
        id: '3',
        name: 'Expense Account',
        currency: 'BDT',
        transactions: []
      }
    ];
  });

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id);
  const [currentUser] = useState({ name: 'John Doe', role: 'Admin' });

  useEffect(() => {
    localStorage.setItem('ledger-accounts', JSON.stringify(accounts));
  }, [accounts]);

  const addAccount = (name) => {
    const newAccount = {
      id: Date.now().toString(),
      name,
      currency: 'BDT', // Always BDT
      transactions: []
    };
    setAccounts([...accounts, newAccount]);
    setSelectedAccountId(newAccount.id);
  };

  const deleteAccount = (accountId) => {
    if (accounts.length <= 1) {
      alert("Cannot delete the last account. You must have at least one account.");
      return false;
    }
    
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    setAccounts(updatedAccounts);
    
    if (selectedAccountId === accountId) {
      setSelectedAccountId(updatedAccounts[0]?.id || null);
    }
    
    return true;
  };

  const addTransaction = (accountId, transactionData) => {
    const { ...transaction } = transactionData;
    
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

        // Update all subsequent balances
        const updatedTransactions = [...acc.transactions, newTransaction];
        let runningBalance = updatedTransactions[0]?.balance || 0;
        
        for (let i = 1; i < updatedTransactions.length; i++) {
          runningBalance = updatedTransactions[i].type === 'in'
            ? runningBalance + updatedTransactions[i].amount
            : runningBalance - updatedTransactions[i].amount;
          updatedTransactions[i].balance = runningBalance;
        }

        return {
          ...acc,
          transactions: updatedTransactions
        };
      }
      return acc;
    }));
  };

  const editTransaction = (accountId, transactionId, updates) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        const updatedTransactions = acc.transactions.map(t => {
          if (t.id === transactionId) {
            const updatedTransaction = { ...t, ...updates };
            
            // Recalculate balance if amount changed
            if (updates.amount !== undefined && updates.amount !== t.amount) {
              // Find the transaction index
              const transactionIndex = acc.transactions.findIndex(t => t.id === transactionId);
              
              // Recalculate all balances from this transaction forward
              let runningBalance = transactionIndex > 0 
                ? acc.transactions[transactionIndex - 1].balance 
                : 0;
              
              // Update this transaction's balance
              runningBalance = updatedTransaction.type === 'in'
                ? runningBalance + updatedTransaction.amount
                : runningBalance - updatedTransaction.amount;
              updatedTransaction.balance = runningBalance;
              
              // Update subsequent transactions
              for (let i = transactionIndex + 1; i < acc.transactions.length; i++) {
                runningBalance = acc.transactions[i].type === 'in'
                  ? runningBalance + acc.transactions[i].amount
                  : runningBalance - acc.transactions[i].amount;
                acc.transactions[i].balance = runningBalance;
              }
            }
            
            return updatedTransaction;
          }
          return t;
        });

        return {
          ...acc,
          transactions: updatedTransactions
        };
      }
      return acc;
    }));
  };

  const deleteTransaction = (accountId, transactionId) => {
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        const filteredTransactions = acc.transactions.filter(t => t.id !== transactionId);
        
        // Recalculate balances after deletion
        if (filteredTransactions.length > 0) {
          let runningBalance = filteredTransactions[0].type === 'in'
            ? filteredTransactions[0].amount
            : -filteredTransactions[0].amount;
          filteredTransactions[0].balance = runningBalance;
          
          for (let i = 1; i < filteredTransactions.length; i++) {
            runningBalance = filteredTransactions[i].type === 'in'
              ? runningBalance + filteredTransactions[i].amount
              : runningBalance - filteredTransactions[i].amount;
            filteredTransactions[i].balance = runningBalance;
          }
        }
        
        return {
          ...acc,
          transactions: filteredTransactions
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

  // Get all transactions for dashboard
  const getAllTransactions = () => {
    return accounts.flatMap(acc => 
      acc.transactions.map(t => ({ 
        ...t, 
        accountId: acc.id,
        accountName: acc.name,
        accountCurrency: acc.currency
      }))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return (
    <TransactionContext.Provider value={{
      accounts,
      selectedAccountId,
      setSelectedAccountId,
      currentUser,
      addAccount,
      deleteAccount,
      addTransaction,
      editTransaction,
      deleteTransaction,
      getAccountById,
      getTotals,
      getAllTransactions
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