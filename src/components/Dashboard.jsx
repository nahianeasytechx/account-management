import React, { useState, useMemo } from 'react';
import { Trash2, Filter, Search, Calendar, X, ChevronLeft, ChevronRight, Printer, Download } from 'lucide-react';
import DashboardCards from './DashboardCards';
import TransactionCard from './TransactionCard';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import PrintStatementModal from './PrintStatementModal';
import { useTransactions } from '../context/TransactionContext';

const Dashboard = () => {
  const { 
    accounts, 
    selectedAccountId, 
    getAccountById, 
    deleteAccount,
    getAllTransactions,
    deleteTransaction,
    editTransaction 
  } = useTransactions();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

    // Date range filter
    if (dateFrom || dateTo) {
      transactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);
        
        let matchesFrom = true;
        let matchesTo = true;

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          matchesFrom = transactionDate >= fromDate;
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesTo = transactionDate <= toDate;
        }

        return matchesFrom && matchesTo;
      });
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
          t.amount?.toString().includes(lowerSearch)
        );
      });
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedAccountId, allTransactions, filterType, searchTerm, dateFrom, dateTo]);

  // Pagination calculations
  const totalPages = Math.ceil(displayedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = displayedTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm, dateFrom, dateTo, selectedAccountId]);

  // Summary stats (based on all filtered transactions, not just current page)
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
  const handleDelete = async () => {
    if (account) {
      await deleteAccount(account.id);
      setShowDeleteModal(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    const transaction = displayedTransactions.find(t => t.id === transactionId);
    if (transaction) {
      await deleteTransaction(transaction.accountId, transactionId);
    }
  };

  // Edit transaction handler
  const handleEditTransaction = async (accountId, transactionId, updates) => {
    return await editTransaction(accountId, transactionId, updates);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setFilterType('all');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || dateFrom || dateTo || filterType !== 'all';

  // Make editTransaction available globally for TransactionCard
  React.useEffect(() => {
    window.editTransaction = handleEditTransaction;
    return () => {
      delete window.editTransaction;
    };
  }, [editTransaction]);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800">
            {selectedAccountId === 'all' ? 'Dashboard - All Accounts' : `Dashboard - ${account?.name || ''}`}
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            {selectedAccountId === 'all' 
              ? `Viewing all ${accounts.length} accounts` 
              : `${account?.transactions?.length || 0} transactions in this account`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Print Statement Button */}
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors shadow-sm font-medium"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Print Statement</span>
            <span className="sm:hidden">Print</span>
          </button>

          {account && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Delete {account.name}</span>
              <span className="sm:hidden">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="mb-8">
        <DashboardCards accountId={selectedAccountId === 'all' ? null : selectedAccountId} />
      </div>

      {/* Search & Filter */}
      <div className="space-y-3 mb-4">
        {/* First Row: Search and Filter Type */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50 flex-1 sm:max-w-md">
            <Search size={16} className="text-gray-400 ml-1" />
            <input
              type="text"
              placeholder="Search by description, source, amount, account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none bg-transparent px-2 py-1 text-sm flex-1 min-w-0"
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
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 text-xs lg:text-sm rounded transition-colors ${
                    filterType === 'all' ? 'bg-black text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('in')}
                  className={`px-3 py-1 text-xs lg:text-sm rounded transition-colors ${
                    filterType === 'in' ? 'bg-green-500 text-white shadow-sm' : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Cash In
                </button>
                <button
                  onClick={() => setFilterType('out')}
                  className={`px-3 py-1 text-xs lg:text-sm rounded transition-colors ${
                    filterType === 'out' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  Cash Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row: Date Filter and Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Date Filter Toggle and Inputs */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                dateFrom || dateTo 
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Calendar size={16} />
              Date Range
              {(dateFrom || dateTo) && (
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  ✓
                </span>
              )}
            </button>

            {showDateFilter && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">From:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">To:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    title="Clear date filter"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results Count and Clear All */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {displayedTransactions.length} transaction{displayedTransactions.length !== 1 ? 's' : ''}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-white bg-black p-1 rounded font-semibold  whitespace-nowrap"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transactions */}
      {displayedTransactions.length > 0 ? (
        <>
          <div className="space-y-4 mb-6">
            {paginatedTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                accountId={transaction.accountId}
                accountName={transaction.accountName}
                onDelete={handleDeleteTransaction}
                getAccountById={getAccountById}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8  p-4 ">
            {/* Page info */}
            <div className="text-sm font-medium text-gray-700">
              Showing {startIndex + 1}-{Math.min(endIndex, displayedTransactions.length)} of {displayedTransactions.length} transactions
            </div>

            {/* Pagination buttons */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 text-gray-400 font-bold">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-10 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-black text-white shadow-md'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-400'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 px-4">
            {hasActiveFilters
              ? 'No transactions found matching your filters'
              : 'No transactions found'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {displayedTransactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash In</h4>
            <p className="text-xl md:text-2xl font-bold text-green-600">
              ৳{summaryStats.totalIn.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summaryStats.inCount} transaction{summaryStats.inCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash Out</h4>
            <p className="text-xl md:text-2xl font-bold text-red-600">
              ৳{summaryStats.totalOut.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {summaryStats.outCount} transaction{summaryStats.outCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 sm:col-span-2 lg:col-span-1">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Net Balance</h4>
            <p className={`text-xl md:text-2xl font-bold ${summaryStats.netBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              ৳{Math.abs(summaryStats.netBalance).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">All filtered transactions</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {account && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          accountName={account.name}
        />
      )}

      <PrintStatementModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        transactions={allTransactions}
        accountName={selectedAccountId === 'all' ? 'All Accounts' : account?.name}
        accountId={selectedAccountId}
      />
    </div>
  );
};

export default Dashboard;