// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Trash2, Filter, RefreshCw } from 'lucide-react';
import DashboardCards from './DashboardCards';
import TransactionCard from './TransactionCard';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useAccounts } from '../context/AccountsContext';
import { useTransactions } from '../context/TransactionContext';

const Dashboard = () => {
  const { 
    accounts, 
    selectedAccountId, 
    deleteAccount,
    getAccountById,
  } = useAccounts();
  
  const {
    fetchTransactions,
    deleteTransaction: deleteTransactionAPI,
    getDashboardSummary,
    loading: transactionsLoading,
  } = useTransactions();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'in', 'out'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const account = selectedAccountId !== 'all' ? getAccountById(selectedAccountId) : null;

  // Fetch dashboard data when account or filter changes
  useEffect(() => {
    loadDashboardData();
  }, [selectedAccountId, filterType]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const result = await getDashboardSummary(selectedAccountId, filterType);
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleDelete = async () => {
    if (account) {
      const result = await deleteAccount(account.id);
      if (result.success) {
        setShowDeleteModal(false);
      }
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const result = await deleteTransactionAPI(transactionId, selectedAccountId);
      if (result.success) {
        // Refresh dashboard data
        loadDashboardData();
      }
    }
  };

  // Get transactions from dashboard data
  const displayedTransactions = dashboardData?.transactions || [];
  const summary = dashboardData?.summary || {
    total_cash_in: 0,
    total_cash_out: 0,
    total_balance: 0,
    total_transactions: 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

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
              : `${summary.total_transactions} transactions in this account`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          
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
      </div>
      
      {/* Dashboard Cards */}
      <div className="mb-8">
        <DashboardCards 
          accountId={selectedAccountId === 'all' ? null : selectedAccountId}
          summary={summary}
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
                accountId={transaction.account_id}
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
              ${summary.total_cash_in.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {displayedTransactions.filter(t => t.type === 'in').length} transactions
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash Out</h4>
            <p className="text-2xl font-bold text-red-600">
              ${summary.total_cash_out.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {displayedTransactions.filter(t => t.type === 'out').length} transactions
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Net Balance</h4>
            <p className={`text-2xl font-bold ${
              summary.total_balance >= 0 ? 'text-gray-900' : 'text-red-600'
            }`}>
              ${Math.abs(summary.total_balance).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Current balance
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