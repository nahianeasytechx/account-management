// src/components/LedgerDetails.jsx - STYLED VERSION
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Trash2, RefreshCw, Filter, ArrowLeft, 
  Plus, Save, ArrowUpRight, ArrowDownRight, Eye, Edit2
} from 'lucide-react';
import DashboardCards from './DashboardCards';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useAccounts } from '../context/AccountsContext';
import { useTransactions } from '../context/TransactionContext';

const LedgerDetails = () => {
  const navigate = useNavigate();
  const { accountId: routeAccountId } = useParams();
  
  const { 
    accounts, 
    getAccountById, 
    deleteAccount,
    refreshAccounts,
    selectedAccountId,
    setSelectedAccountId
  } = useAccounts();
  
  const { 
    getDashboardSummary,
    addTransaction: addTransactionAPI
  } = useTransactions();
  
  const effectiveAccountId = routeAccountId || selectedAccountId;

  const [accountData, setAccountData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const [summary, setSummary] = useState({
    total_cash_in: 0,
    total_cash_out: 0,
    total_balance: 0,
    total_transactions: 0
  });

  const isMounted = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (routeAccountId && routeAccountId !== selectedAccountId) {
      setSelectedAccountId(routeAccountId);
    }
  }, [routeAccountId, selectedAccountId, setSelectedAccountId]);

  const loadLedgerData = useCallback(async () => {
    if (loadingRef.current) return;
    
    if (!effectiveAccountId || effectiveAccountId === 'all') {
      if (isMounted.current) {
        setError('Please select a specific account to view ledger details');
        setLoading(false);
      }
      return;
    }

    loadingRef.current = true;
    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const account = getAccountById(effectiveAccountId);
      if (!account) {
        if (isMounted.current) {
          setError('Account not found');
          setLoading(false);
          loadingRef.current = false;
        }
        return;
      }
      
      if (isMounted.current) {
        setAccountData(account);
      }

      const result = await getDashboardSummary(effectiveAccountId, filterType);

      if (!isMounted.current) return;

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
    } catch (err) {
      console.error(err);
      if (isMounted.current) {
        setError(err.message || 'An error occurred while loading ledger');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  }, [effectiveAccountId, filterType, getAccountById, getDashboardSummary]);

  useEffect(() => {
    loadLedgerData();
  }, [effectiveAccountId, filterType]);

  const handleRefresh = () => {
    refreshAccounts();
    loadLedgerData();
  };

  const handleDeleteAccount = async () => {
    if (accountData) {
      const result = await deleteAccount(accountData.id);
      if (result.success) {
        setShowDeleteModal(false);
        navigate('/dashboard');
      }
    }
  };

  const handleTransactionInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTransaction = async () => {
    if (!transactionForm.amount || parseFloat(transactionForm.amount) <= 0) {
      setTransactionError('Please enter a valid amount');
      return;
    }
    if (transactionForm.type === 'in' && !transactionForm.source.trim()) {
      setTransactionError('Please enter the source of cash');
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
        account_id: effectiveAccountId,
        amount: parseFloat(transactionForm.amount),
        type: transactionForm.type,
        transaction_date: transactionForm.transaction_date,
        description: transactionForm.description.trim(),
        source: transactionForm.type === 'in' ? transactionForm.source.trim() : null,
        paid_to: transactionForm.type === 'out' ? transactionForm.paid_to.trim() : null,
      };

      const result = await addTransactionAPI(effectiveAccountId, transactionData);

      if (result.success) {
        setTransactionForm({
          amount: '',
          type: 'in',
          transaction_date: new Date().toISOString().split('T')[0],
          source: '',
          paid_to: '',
          description: '',
        });
        setShowTransactionForm(false);
        refreshAccounts();
        await loadLedgerData();
      } else {
        setTransactionError(result.message || 'Failed to add transaction');
      }
    } catch (err) {
      console.error(err);
      setTransactionError(err.message || 'Error adding transaction');
    } finally {
      setUploadingTransaction(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

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
        refreshAccounts();
        await loadLedgerData();
      } else {
        alert(result.message || 'Failed to delete transaction');
      }
    } catch (err) {
      alert('Error deleting transaction: ' + err.message);
    }
  };

  const displayedTransactions = dashboardData?.transactions || [];

  const getCurrencySymbol = () => {
    if (!accountData) return '$';
    const symbols = { USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', INR: '₹' };
    return symbols[accountData.currency_code] || accountData.currency_symbol || '$';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  if (!effectiveAccountId || effectiveAccountId === 'all') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeft className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Account Selected</h3>
          <p className="text-gray-500 mb-4">
            Please select a specific account from the sidebar to view its ledger details
          </p>
          {accounts.length > 0 && (
            <button
              onClick={() => setSelectedAccountId(accounts[0].id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select First Account
            </button>
          )}
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
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
          <button
            onClick={() => {
              setSelectedAccountId('all');
              navigate('/dashboard');
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!accountData) {
    return <div className="text-center py-12 text-gray-500">Account not found</div>;
  }

  const currencySymbol = getCurrencySymbol();

  return (
    <div className="p-6">
      {/* Header with title and delete button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">
          {accountData.name} Ledger
        </h2>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
        >
          <Trash2 size={18} />
          Delete Account
        </button>
      </div>
      
      {/* Dashboard Cards */}
      <div className="mb-8">
        <DashboardCards 
          accountId={effectiveAccountId}
          summary={summary}
        />
      </div>
      
      {/* Add New Transaction Form */}
      <div className="mb-8 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Transaction</h3>
        
        {transactionError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {transactionError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Amount Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {currencySymbol}
              </span>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0"
                value={transactionForm.amount}
                onChange={handleTransactionInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              name="type"
              value={transactionForm.type}
              onChange={handleTransactionInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white cursor-pointer"
            >
              <option value="in">Cash In</option>
              <option value="out">Cash Out</option>
            </select>
          </div>

          {/* Date Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              name="transaction_date"
              value={transactionForm.transaction_date}
              onChange={handleTransactionInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 cursor-pointer"
            />
          </div>
        </div>

        {/* Source/Paid To Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {transactionForm.type === 'in' 
              ? 'Source (Where did the cash come from?)' 
              : 'Paid To (Where was the cash paid to?)'}
          </label>
          <input
            type="text"
            name={transactionForm.type === 'in' ? 'source' : 'paid_to'}
            value={transactionForm.type === 'in' ? transactionForm.source : transactionForm.paid_to}
            onChange={handleTransactionInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            placeholder='e.g., Client Name, Company, Salary, etc.'
          />
          <p className="text-xs text-gray-500 mt-2">
            Examples: "ABC Corporation", "John Doe", "Freelance Project", "Investment Return"
          </p>
        </div>

        {/* Description Field */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Name
          </label>
          <textarea
            name="description"
            value={transactionForm.description}
            onChange={handleTransactionInputChange}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 resize-none"
            placeholder="Add any notes or details about this transaction..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => {
              setTransactionForm({
                amount: '',
                type: 'in',
                transaction_date: new Date().toISOString().split('T')[0],
                source: '',
                paid_to: '',
                description: '',
              });
              setTransactionError(null);
            }}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Clear
          </button>
          <button
            onClick={handleAddTransaction}
            disabled={uploadingTransaction}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
          >
            {uploadingTransaction ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
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
      
      {/* Transactions List Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Transactions</h3>
          
          <div className="flex items-center gap-4">
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`cursor-pointer px-3 py-1.5 text-sm rounded transition-colors ${
                    filterType === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm font-medium' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('in')}
                  className={`cursor-pointer px-3 py-1.5 text-sm rounded transition-colors ${
                    filterType === 'in' 
                      ? 'bg-white text-green-600 shadow-sm font-medium' 
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Cash In
                </button>
                <button
                  onClick={() => setFilterType('out')}
                  className={`cursor-pointer px-3 py-1.5 text-sm rounded transition-colors ${
                    filterType === 'out' 
                      ? 'bg-white text-red-600 shadow-sm font-medium' 
                      : 'text-gray-600 hover:text-red-600'
                  }`}
                >
                  Cash Out
                </button>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
        
        {displayedTransactions.length > 0 ? (
          <div className="space-y-3">
            {displayedTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-full ${transaction.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {transaction.type === 'in' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-lg">
                          {transaction.source || transaction.paid_to || 'Transaction'}
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {transaction.description && <span>{transaction.description} • </span>}
                          {formatDate(transaction.transaction_date || transaction.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xl font-bold ${transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'in' ? '+' : '-'}{currencySymbol}{formatAmount(transaction.amount)}
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button
                        onClick={() => navigate(`/transaction/${transaction.id}`)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {/* Handle edit */}}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg">
              {filterType !== 'all' 
                ? `No ${filterType === 'in' ? 'cash in' : 'cash out'} transactions found`
                : 'No transactions yet'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Add your first transaction using the form above
            </p>
          </div>
        )}
      </div>
      
      {/* Delete Account Modal */}
      {accountData && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          accountName={accountData.name}
        />
      )}
    </div>
  );
};

export default LedgerDetails;