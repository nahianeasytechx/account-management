import React, { useState, useMemo } from 'react';
import { Trash2, Filter, Search } from 'lucide-react';
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
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize selected account
  const account = useMemo(() => 
    selectedAccountId !== 'all' ? getAccountById(selectedAccountId) : null,
    [selectedAccountId, getAccountById]
  );

  // Memoize all transactions
  const allTransactions = useMemo(() => getAllTransactions(), [getAllTransactions]);

  // Filtered & searched transactions
  const displayedTransactions = useMemo(() => {
    let transactions = allTransactions.map(t => ({
      ...t,
      accountId: t.accountId,
      accountName: t.accountName
    }));

    // Only filter by selected account if no search is active
    if (selectedAccountId !== 'all' && searchTerm.trim() === '') {
      transactions = transactions.filter(t => t.accountId === selectedAccountId);
    }

    // Type filter
    if (filterType !== 'all') {
      transactions = transactions.filter(t => t.type === filterType);
    }

    // Search filter
    if (searchTerm.trim() !== '') {
      const lowerSearch = searchTerm.toLowerCase();
      transactions = transactions.filter(t => {
        return (
          t.name?.toLowerCase().includes(lowerSearch) ||
          t.source?.toLowerCase().includes(lowerSearch) ||
          t.paidTo?.toLowerCase().includes(lowerSearch) ||
          t.description?.toLowerCase().includes(lowerSearch) ||
          t.accountName?.toLowerCase().includes(lowerSearch) ||
          t.amount?.toString().includes(lowerSearch) ||
          (t.date && new Date(t.date).toLocaleDateString().includes(lowerSearch))
        );
      });
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedAccountId, allTransactions, filterType, searchTerm]);

  // Summary stats
  const summaryStats = useMemo(() => {
    return {
      totalIn: displayedTransactions
        .filter(t => t.type === 'in')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      totalOut: displayedTransactions
        .filter(t => t.type === 'out')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
      netBalance: displayedTransactions.reduce((sum, t) =>
        t.type === 'in' ? sum + parseFloat(t.amount || 0) : sum - parseFloat(t.amount || 0), 0
      ),
      inCount: displayedTransactions.filter(t => t.type === 'in').length,
      outCount: displayedTransactions.filter(t => t.type === 'out').length
    };
  }, [displayedTransactions]);

  // Delete account
  const handleDelete = () => {
    if (account) {
      deleteAccount(account.id);
      setShowDeleteModal(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(selectedAccountId, transactionId);
    }
  };

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
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Delete {account.name}
          </button>
        )}
      </div>

      {/* Dashboard Cards */}
      <div className="mb-8">
        <DashboardCards accountId={selectedAccountId === 'all' ? null : selectedAccountId} />
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, amount, date, description, or account"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-none bg-transparent px-2 py-1 text-sm w-64"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-gray-400 hover:text-gray-600 px-2"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filterType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('in')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filterType === 'in' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-green-600'
              }`}
            >
              Cash In
            </button>
            <button
              onClick={() => setFilterType('out')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                filterType === 'out' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              Cash Out
            </button>
          </div>
        </div>

        <span className="text-sm text-gray-500">{displayedTransactions.length} transactions</span>
      </div>

      {/* Transactions */}
      {displayedTransactions.length > 0 ? (
        <div className="space-y-4">
          {displayedTransactions.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              transaction={transaction}
              accountId={transaction.accountId}
              accountName={transaction.accountName}
              onDelete={handleDeleteTransaction}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">
            {searchTerm 
              ? `No transactions found for "${searchTerm}"`
              : filterType !== 'all' 
                ? `No ${filterType === 'in' ? 'cash in' : 'cash out'} transactions found`
                : 'No transactions found'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {displayedTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash In</h4>
            <p className="text-2xl font-bold text-green-600">
              ৳{summaryStats.totalIn.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summaryStats.inCount} transactions
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash Out</h4>
            <p className="text-2xl font-bold text-red-600">
              ৳{summaryStats.totalOut.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summaryStats.outCount} transactions
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Net Balance</h4>
            <p className={`text-2xl font-bold ${summaryStats.netBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              ৳{Math.abs(summaryStats.netBalance).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Displayed transactions only</p>
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
