import React, { useState } from 'react';
import { Trash2, Filter } from 'lucide-react';
import DashboardCards from './DashboardCards';
import TransactionCard from './TransactionCard';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useTransactions } from '../context/TransactionContext';

const Dashboard = () => {
  const { 
    accounts, 
    selectedAccountId, 
    getAccountById, 
    deleteAccount,
    getAllTransactions,
    deleteTransaction 
  } = useTransactions();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'in', 'out'
  
  const account = selectedAccountId !== 'all' ? getAccountById(selectedAccountId) : null;
  const allTransactions = getAllTransactions();
  
  // Filter transactions based on selected view
  let displayedTransactions = [];
  
  if (selectedAccountId === 'all') {
    // Show all transactions from all accounts
    displayedTransactions = allTransactions;
  } else if (account) {
    // Show only selected account's transactions
    displayedTransactions = account.transactions.map(t => ({
      ...t,
      accountId: account.id,
      accountName: account.name,
      accountCurrency: account.currency
    }));
  }
  
  // Apply type filter
  if (filterType !== 'all') {
    displayedTransactions = displayedTransactions.filter(
      t => t.type === filterType
    );
  }
  
  // Sort by date (newest first)
  displayedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleDelete = () => {
    if (account) {
      if (deleteAccount(account.id)) {
        setShowDeleteModal(false);
      }
    }
  };

  const handleDeleteTransaction = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(selectedAccountId, transactionId);
    }
  };

  // Calculate totals for dashboard cards
  const calculateTotals = () => {
    const transactionsToCalculate = selectedAccountId === 'all' 
      ? allTransactions 
      : account?.transactions || [];
    
    return {
      totalIn: transactionsToCalculate
        .filter(t => t.type === 'in')
        .reduce((sum, t) => sum + t.amount, 0),
      totalOut: transactionsToCalculate
        .filter(t => t.type === 'out')
        .reduce((sum, t) => sum + t.amount, 0),
      balance: transactionsToCalculate.reduce((sum, t) => 
        t.type === 'in' ? sum + t.amount : sum - t.amount, 0
      )
    };
  };

  const totals = calculateTotals();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedAccountId === 'all' ? 'Dashboard - All Accounts' : `Dashboard - ${account?.name}`}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedAccountId === 'all' 
              ? `Viewing all ${accounts.length} accounts` 
              : `${account?.transactions?.length || 0} transactions in this account`}
          </p>
        </div>
        
        {account && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Delete {account.name}
          </button>
        )}
      </div>
      
      {/* Dashboard Cards */}
      <div className="mb-8">
        <DashboardCards 
          accountId={selectedAccountId === 'all' ? null : selectedAccountId}
          customTotals={selectedAccountId === 'all' ? totals : null}
        />
      </div>
      
      {/* Transaction Cards Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-700">
              {selectedAccountId === 'all' ? 'All Transactions' : 'Account Transactions'}
            </h3>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`cursor-pointer px-3 py-1 text-sm rounded transition-colors ${
                    filterType === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('in')}
                  className={`cursor-pointer px-3 py-1 text-sm rounded transition-colors ${
                    filterType === 'in' 
                      ? 'bg-white text-green-600 shadow-sm' 
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Cash In
                </button>
                <button
                  onClick={() => setFilterType('out')}
                  className={`cursor-pointer px-3 py-1 text-sm rounded transition-colors ${
                    filterType === 'out' 
                      ? 'bg-white text-red-600 shadow-sm' 
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  Cash Out
                </button>
              </div>
            </div>
          </div>
          
          <span className="text-sm text-gray-500">
            {displayedTransactions.length} transactions
          </span>
        </div>
        
        {displayedTransactions.length > 0 ? (
          <div className="space-y-4">
            {displayedTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                accountId={transaction.accountId}
                onDelete={handleDeleteTransaction}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">
              {filterType !== 'all' 
                ? `No ${filterType === 'in' ? 'cash in' : 'cash out'} transactions found`
                : 'No transactions yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {selectedAccountId === 'all' 
                ? 'Transactions will appear here from all accounts'
                : 'Add your first transaction from the Ledger Details page'}
            </p>
          </div>
        )}
      </div>
      
      {/* Summary Stats */}
      {displayedTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash In</h4>
            <p className="text-2xl font-bold text-green-600">
              ${displayedTransactions
                .filter(t => t.type === 'in')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {displayedTransactions.filter(t => t.type === 'in').length} transactions
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash Out</h4>
            <p className="text-2xl font-bold text-red-600">
              ${displayedTransactions
                .filter(t => t.type === 'out')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {displayedTransactions.filter(t => t.type === 'out').length} transactions
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Net Balance</h4>
            <p className={`text-2xl font-bold ${
              displayedTransactions.reduce((sum, t) => 
                t.type === 'in' ? sum + t.amount : sum - t.amount, 0
              ) >= 0 ? 'text-gray-900' : 'text-red-600'
            }`}>
              ${Math.abs(displayedTransactions.reduce((sum, t) => 
                t.type === 'in' ? sum + t.amount : sum - t.amount, 0
              )).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Displayed transactions only
            </p>
          </div>
        </div>
      )}

      {account && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          accountName={account.name}
        />
      )}
    </div>
  );
};

export default Dashboard;