import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trash2, RefreshCw, Filter, ArrowLeft, 
  Plus, FileText, Upload, Paperclip, X, Save,
  ArrowUpRight, ArrowDownRight, Eye, Edit2, Download
} from 'lucide-react';
import DashboardCards from './DashboardCards';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useAccounts } from '../context/AccountsContext';
import { useTransactions } from '../context/TransactionContext';

const LedgerDetails = ({ accountId }) => {
  const navigate = useNavigate();
  
  const { 
    accounts, 
    getAccountById, 
    deleteAccount,
    refreshAccounts 
  } = useAccounts();
  
  const { 
    getDashboardSummary,
    addTransaction: addTransactionAPI,
    formatFileSize 
  } = useTransactions();
  
  const [accountData, setAccountData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Transaction form state
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    type: 'in',
    transaction_date: new Date().toISOString().split('T')[0],
    source: '',
    paid_to: '',
    description: '',
  });
  const [uploadingTransaction, setUploadingTransaction] = useState(false);
  const [transactionError, setTransactionError] = useState(null);
  
  // Summary state
  const [summary, setSummary] = useState({
    total_cash_in: 0,
    total_cash_out: 0,
    total_balance: 0,
    total_transactions: 0
  });

  // Load account and ledger data
  const loadLedgerData = useCallback(async () => {
    if (!accountId || accountId === 'all') {
      setError('Please select an account from the sidebar');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get account from context
      const account = getAccountById(accountId);
      if (!account) {
        setError('Account not found');
        setLoading(false);
        return;
      }
      
      setAccountData(account);
      
      // Get ledger data
      const result = await getDashboardSummary(accountId, filterType);
      
      if (result.success) {
        setDashboardData(result.data);
        setSummary(result.data?.summary || {
          total_cash_in: 0,
          total_cash_out: 0,
          total_balance: 0,
          total_transactions: 0
        });
      } else {
        setError(result.message || 'Failed to load ledger data');
      }
    } catch (error) {
      console.error('Failed to load ledger:', error);
      setError(error.message || 'An error occurred while loading ledger');
    } finally {
      setLoading(false);
    }
  }, [accountId, filterType, getAccountById, getDashboardSummary]);

  // Load data when accountId changes
  useEffect(() => {
    loadLedgerData();
  }, [loadLedgerData]);

  const handleRefresh = () => {
    loadLedgerData();
    refreshAccounts();
  };

  const handleDeleteAccount = async () => {
    if (accountData) {
      const result = await deleteAccount(accountData.id);
      if (result.success) {
        setShowDeleteModal(false);
        navigate('/'); // Redirect to home/dashboard after deletion
      }
    }
  };

  // Transaction form handlers
  const handleTransactionInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTransaction = async () => {
    if (!transactionForm.amount || parseFloat(transactionForm.amount) <= 0) {
      setTransactionError('Please enter a valid amount');
      return;
    }

    if (transactionForm.type === 'in' && !transactionForm.source.trim()) {
      setTransactionError('Please enter the source of cash (where it came from)');
      return;
    }

    if (transactionForm.type === 'out' && !transactionForm.paid_to.trim()) {
      setTransactionError('Please enter who/where the cash was paid to');
      return;
    }

    setUploadingTransaction(true);
    setTransactionError(null);

    try {
      const transactionData = {
        account_id: accountId,
        amount: parseFloat(transactionForm.amount),
        type: transactionForm.type,
        transaction_date: transactionForm.transaction_date,
        description: transactionForm.description.trim(),
        source: transactionForm.type === 'in' ? transactionForm.source.trim() : null,
        paid_to: transactionForm.type === 'out' ? transactionForm.paid_to.trim() : null,
      };

      const result = await addTransactionAPI(accountId, transactionData);
      
      if (result.success) {
        // Reset form
        setTransactionForm({
          amount: '',
          type: 'in',
          transaction_date: new Date().toISOString().split('T')[0],
          source: '',
          paid_to: '',
          description: '',
        });
        setShowTransactionForm(false);
        
        // Refresh data
        loadLedgerData();
        refreshAccounts();
      } else {
        setTransactionError(result.message || 'Failed to add transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      setTransactionError(error.message || 'Error adding transaction. Please try again.');
    } finally {
      setUploadingTransaction(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const response = await fetch(`/api/transactions/${transactionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          loadLedgerData();
          refreshAccounts();
        } else {
          alert(result.message || 'Failed to delete transaction');
        }
      } catch (error) {
        alert('Error deleting transaction: ' + error.message);
      }
    }
  };

  // Safely extract data
  const displayedTransactions = dashboardData?.transactions || [];

  // Helper functions
  const getCurrencySymbol = () => {
    if (!accountData) return '$';
    const currencySymbols = {
      USD: '$',
      BDT: '৳',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      INR: '₹',
    };
    return currencySymbols[accountData.currency_code] || accountData.currency_symbol || '$';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!accountId || accountId === 'all') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No account selected</p>
          <p className="text-sm text-gray-400">
            Please select an account from the sidebar to view its ledger details
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Loading ledger...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!accountData) {
    return (
      <div className="text-center py-12 text-gray-500">
        Account not found or you don't have permission to view it
      </div>
    );
  }

  const currencySymbol = getCurrencySymbol();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{accountData.name} Ledger</h2>
            <p className="text-sm text-gray-500 mt-1">
              {summary.total_transactions} transactions • {accountData.currency_code} ({currencySymbol})
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransactionForm(!showTransactionForm)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add Transaction
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="mb-8">
        <DashboardCards accountId={accountId} summary={summary} />
      </div>
      
      {/* Add Transaction Form */}
      {showTransactionForm && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Transaction</h3>
          
          {transactionError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{transactionError}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({currencySymbol})
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  {currencySymbol}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  value={transactionForm.amount}
                  onChange={handleTransactionInputChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                name="type"
                value={transactionForm.type}
                onChange={(e) => {
                  handleTransactionInputChange(e);
                  // Clear the opposite field when switching type
                  if (e.target.value === 'in') {
                    setTransactionForm(prev => ({ ...prev, paid_to: '' }));
                  } else {
                    setTransactionForm(prev => ({ ...prev, source: '' }));
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="in">Cash In</option>
                <option value="out">Cash Out</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                name="transaction_date"
                value={transactionForm.transaction_date}
                onChange={handleTransactionInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Source/Paid To Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {transactionForm.type === 'in' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source (Where did the cash come from?)
                </label>
                <input
                  type="text"
                  name="source"
                  value={transactionForm.source}
                  onChange={handleTransactionInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Client Name, Company, Salary, etc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: "ABC Corporation", "John Doe", "Freelance Project", "Investment Return"
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paid To (Where was the cash paid to?)
                </label>
                <input
                  type="text"
                  name="paid_to"
                  value={transactionForm.paid_to}
                  onChange={handleTransactionInputChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Vendor Name, Service Provider, Expense Category, etc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: "Office Supplies Store", "Internet Bill", "Employee Salary", "Rent Payment"
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <textarea
              name="description"
              value={transactionForm.description}
              onChange={handleTransactionInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes or details about this transaction..."
              rows="2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowTransactionForm(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTransaction}
              disabled={uploadingTransaction}
              className={`px-4 py-2 text-sm text-white rounded-lg cursor-pointer flex items-center gap-2 ${
                uploadingTransaction 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploadingTransaction ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Add Transaction
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Transaction History Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-700">Transaction History</h3>
            
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
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">All Transactions</h3>
                <span className="text-sm text-gray-600">
                  Currency: {accountData.currency_code} ({currencySymbol})
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source/Paid To</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedTransactions.filter(t => 
                    filterType === 'all' || t.type === filterType
                  ).map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(transaction.transaction_date || transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {transaction.type === "in" ? (
                            <ArrowUpRight className="text-green-500" size={16} />
                          ) : (
                            <ArrowDownRight className="text-red-500" size={16} />
                          )}
                          <span className={`text-sm font-medium ${
                            transaction.type === "in" ? "text-green-600" : "text-red-600"
                          }`}>
                            {transaction.type === "in" ? "Cash In" : "Cash Out"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {transaction.type === "in" 
                          ? (transaction.source || 'N/A')
                          : (transaction.paid_to || transaction.paidTo || 'N/A')
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {transaction.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-semibold ${
                          transaction.type === "in" ? "text-green-600" : "text-red-600"
                        }`}>
                          {transaction.type === "in" ? "+" : "-"}
                          {currencySymbol}
                          {parseFloat(transaction.amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-semibold ${
                          (transaction.balance || 0) >= 0
                            ? "text-gray-900"
                            : "text-red-600"
                        }`}>
                          {currencySymbol}
                          {Math.abs(transaction.balance || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="p-1 hover:bg-red-50 rounded text-red-600 cursor-pointer"
                            title="Delete transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            className="p-1 hover:bg-blue-50 rounded text-blue-600 cursor-pointer"
                            title="Edit transaction"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">
              {filterType !== 'all' 
                ? `No ${filterType === 'in' ? 'cash in' : 'cash out'} transactions found`
                : 'No transactions yet'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Add your first transaction using the "Add Transaction" button above
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
              {currencySymbol}{summary.total_cash_in.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {displayedTransactions.filter(t => t.type === 'in').length} transactions
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Total Cash Out</h4>
            <p className="text-2xl font-bold text-red-600">
              {currencySymbol}{summary.total_cash_out.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {displayedTransactions.filter(t => t.type === 'out').length} transactions
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Current Balance</h4>
            <p className={`text-2xl font-bold ${
              summary.total_balance >= 0 ? 'text-gray-900' : 'text-red-600'
            }`}>
              {currencySymbol}{Math.abs(summary.total_balance).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Updated just now
            </p>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        accountName={accountData.name}
      />
    </div>
  );
};

export default LedgerDetails;