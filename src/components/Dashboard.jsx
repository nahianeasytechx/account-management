// src/components/Dashboard.jsx - PRODUCTION VERSION
import React, { useEffect, useState, useCallback } from 'react';
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
  
  const { getDashboardSummary } = useTransactions();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const account = selectedAccountId !== 'all' ? getAccountById(selectedAccountId) : null;

  // Memoize load function to prevent recreation on every render
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getDashboardSummary(selectedAccountId, filterType);
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setError(error.message || 'An error occurred while loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, filterType, getDashboardSummary]);

  // Load data only when dependencies actually change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
      // TODO: Implement delete transaction API call
      console.log('Delete transaction:', transactionId);
      loadDashboardData(); // Refresh after delete
    }
  };

  // Safely extract data with defaults
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
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-red-800 font-bold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedAccountId === 'all' 
              ? 'Dashboard - All Accounts' 
              : `Dashboard - ${account?.name || 'Account'}`
            }
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedAccountId === 'all' 
              ? `Viewing all ${accounts.length} accounts` 
              : `${summary.total_transactions} transactions in this account`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
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
        <DashboardCards summary={summary} />
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
            {displayedTransactions.length} transaction{displayedTransactions.length !== 1 ? 's' : ''}
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
            <div className="text-gray-400 mb-2">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">
              {filterType !== 'all' 
                ? `No ${filterType === 'in' ? 'cash in' : 'cash out'} transactions found`
                : 'No transactions yet'
              }
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {selectedAccountId === 'all' 
                ? 'Transactions will appear here from all accounts'
                : 'Add your first transaction from the Ledger Details page'
              }
            </p>
          </div>
        )}
      </div>
      
      {/* Summary Stats - Only show if there are transactions */}
      {displayedTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash In</h4>
            <p className="text-2xl font-bold text-green-600">
              ${summary.total_cash_in.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {displayedTransactions.filter(t => t.type === 'in').length} transaction{displayedTransactions.filter(t => t.type === 'in').length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash Out</h4>
            <p className="text-2xl font-bold text-red-600">
              ${summary.total_cash_out.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {displayedTransactions.filter(t => t.type === 'out').length} transaction{displayedTransactions.filter(t => t.type === 'out').length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
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

      {/* Delete Account Modal */}
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

export default Dashboard