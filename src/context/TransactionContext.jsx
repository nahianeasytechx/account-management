import React, { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

// File size limits
const FILE_SIZE_LIMITS = {
  image: 5 * 1024 * 1024, // 5MB
  pdf: 10 * 1024 * 1024, // 10MB
  document: 2 * 1024 * 1024, // 2MB
  default: 2 * 1024 * 1024 // 2MB
};

// Maximum total storage limit for all files (10MB)
const TOTAL_STORAGE_LIMIT = 10 * 1024 * 1024;

// Store files in memory
let fileStorage = new Map(); // Map<transactionId_fileName, file>

export const TransactionProvider = ({ children }) => {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('ledger-accounts');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        name: 'Premium',
        currency: 'USD',
        transactions: [
          { 
            id: 't1', 
            amount: 14.14, 
            type: 'in', 
            date: '2024-12-10', 
            balance: 14.14,
            source: 'Client Payment',
            description: 'Payment from ABC Corp for project work',
            attachments: ['invoice_abc.pdf']
          },
          { 
            id: 't2', 
            amount: 100, 
            type: 'out', 
            date: '2024-12-11', 
            balance: -85.86,
            paidTo: 'Office Supplies',
            description: 'Purchase of office stationery',
            attachments: ['receipt_office.jpg']
          }
        ]
      },
      {
        id: '2',
        name: 'Regular',
        currency: 'BDT',
        transactions: [
          { 
            id: 't3', 
            amount: 100, 
            type: 'in', 
            date: '2024-12-12', 
            balance: 100,
            source: 'Freelance Work',
            description: 'Web development project completion',
            attachments: []
          }
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

  // Calculate total storage used by attachments
  const calculateTotalStorageUsed = () => {
    let total = 0;
    accounts.forEach(account => {
      account.transactions.forEach(transaction => {
        transaction.attachments?.forEach(filename => {
          const key = `${transaction.id}_${filename}`;
          const file = fileStorage.get(key);
          if (file) {
            total += file.size || 0;
          }
        });
      });
    });
    return total;
  };

  // Validate file size
  const validateFileSize = (file, type) => {
    const limit = FILE_SIZE_LIMITS[type] || FILE_SIZE_LIMITS.default;
    if (file.size > limit) {
      const limitInMB = limit / (1024 * 1024);
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `File too large. Maximum size for ${type} files is ${limitInMB}MB. ` +
        `Your file is ${fileSizeInMB}MB.`
      );
    }
    
    // Check total storage limit
    const currentStorage = calculateTotalStorageUsed();
    if (currentStorage + file.size > TOTAL_STORAGE_LIMIT) {
      const remainingMB = ((TOTAL_STORAGE_LIMIT - currentStorage) / (1024 * 1024)).toFixed(2);
      throw new Error(
        `Storage limit reached. You have ${remainingMB}MB remaining. ` +
        `Please delete some files to free up space.`
      );
    }
    
    return true;
  };

  // Create thumbnail for images
  const createImageThumbnail = (file) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(null);
        return;
      }

      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const maxWidth = 150;
          const maxHeight = 150;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const thumbnail = canvas.toDataURL('image/jpeg', 0.5);
          resolve(thumbnail);
        };
        img.onerror = () => resolve(null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

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
    
    if (selectedAccountId === accountId) {
      setSelectedAccountId(updatedAccounts[0]?.id || null);
    }
    
    return true;
  };

  const addTransaction = async (accountId, transactionData) => {
    const { files = [], ...transaction } = transactionData;
    
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        const lastBalance = acc.transactions.length > 0 
          ? acc.transactions[acc.transactions.length - 1].balance 
          : 0;
        
        const newBalance = transaction.type === 'in' 
          ? lastBalance + transaction.amount 
          : lastBalance - transaction.amount;

        // Store file names in transaction
        const fileNames = files.map(file => file.name);
        
        const newTransaction = {
          ...transaction,
          id: Date.now().toString(),
          balance: newBalance,
          attachments: fileNames
        };

        // Store files in memory
        files.forEach(file => {
          const key = `${newTransaction.id}_${file.name}`;
          fileStorage.set(key, file);
        });

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

  // NEW: Edit transaction function
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
        // Remove files from memory
        const transaction = acc.transactions.find(t => t.id === transactionId);
        if (transaction?.attachments) {
          transaction.attachments.forEach(filename => {
            const key = `${transactionId}_${filename}`;
            fileStorage.delete(key);
          });
        }
        
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

  const addAttachmentToTransaction = async (accountId, transactionId, file) => {
    const type = file.type.startsWith('image/') ? 'image' : 
                 file.type === 'application/pdf' ? 'pdf' : 'document';
    
    validateFileSize(file, type);
    
    const account = accounts.find(acc => acc.id === accountId);
    const transaction = account?.transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Create thumbnail for images
    let thumbnail = null;
    if (type === 'image') {
      thumbnail = await createImageThumbnail(file);
    }
    
    // Store file in memory
    const key = `${transactionId}_${file.name}`;
    fileStorage.set(key, file);
    
    // Add to transaction attachments
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          transactions: acc.transactions.map(t => 
            t.id === transactionId 
              ? { 
                  ...t, 
                  attachments: [...(t.attachments || []), file.name],
                  attachmentThumbnails: {
                    ...(t.attachmentThumbnails || {}),
                    [file.name]: thumbnail
                  }
                }
              : t
          )
        };
      }
      return acc;
    }));
  };

  const deleteAttachment = (accountId, transactionId, filename) => {
    // Remove from memory
    const key = `${transactionId}_${filename}`;
    fileStorage.delete(key);
    
    // Remove from transaction
    setAccounts(accounts.map(acc => {
      if (acc.id === accountId) {
        return {
          ...acc,
          transactions: acc.transactions.map(t => 
            t.id === transactionId 
              ? { 
                  ...t, 
                  attachments: (t.attachments || []).filter(f => f !== filename),
                  attachmentThumbnails: {
                    ...(t.attachmentThumbnails || {}),
                    [filename]: undefined
                  }
                }
              : t
          )
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

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
      updateAccountCurrency,
      deleteAccount,
      addTransaction,
      editTransaction, // NEW: Added edit function
      deleteTransaction,
      addAttachmentToTransaction,
      deleteAttachment,
      getAccountById,
      getTotals,
      getAllTransactions,
      FILE_SIZE_LIMITS,
      calculateTotalStorageUsed,
      TOTAL_STORAGE_LIMIT,
      fileStorage,
      formatFileSize
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