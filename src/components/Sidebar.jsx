import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, Plus, Wallet, Trash2, Globe, Home, List, 
  PieChart, FileText, BarChart, Search, Loader, ChevronUp, ChevronDown,
  LogOut, Settings, User, Bell
} from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAccounts } from '../context/AccountsContext';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    accounts, 
    selectedAccountId, 
    setSelectedAccountId,
    getAccountById,
    deleteAccount,
    refreshAccounts,
    createAccount 
  } = useAccounts();
  
  const { fetchTransactions } = useTransactions();

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('BDT');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(null);
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllAccounts, setShowAllAccounts] = useState(true);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const currencyOptions = [
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  ];

  // Get current view from pathname
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/account/')) return 'ledger';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/transactions')) return 'transactions';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  // Load recent transactions for the current account
  const loadRecentTransactions = useCallback(async () => {
    if (!isAuthenticated || !selectedAccountId) return;
    
    setLoadingTransactions(true);
    try {
      const accountIdForTransactions = selectedAccountId === 'all' ? '' : selectedAccountId;
      const res = await fetchTransactions(accountIdForTransactions);
      if (res.success) {
        setRecentTransactions(res.data?.transactions?.slice(0, 3) || []);
      } else {
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error('Error loading recent transactions:', error);
      setRecentTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, [isAuthenticated, selectedAccountId, fetchTransactions]);

  // Update selectedAccountId based on URL when component mounts
  useEffect(() => {
    if (location.pathname.includes('/account/')) {
      const accountId = location.pathname.split('/account/')[1];
      if (accountId) {
        setSelectedAccountId(accountId);
      }
    } else if (location.pathname === '/dashboard') {
      setSelectedAccountId('all');
    }
  }, [location.pathname, setSelectedAccountId]);

  useEffect(() => {
    loadRecentTransactions();
  }, [loadRecentTransactions]);

  useEffect(() => {
    if (isOpen && window.innerWidth < 1024 && location.pathname !== '/') {
      onClose();
    }
  }, [location.pathname, onClose, isOpen]);

  const handleAccountClick = (accountId) => {
    // Update context
    setSelectedAccountId(accountId);
    
    // Navigate to the account ledger page
    navigate(`/account/${accountId}`);
    
    if (window.innerWidth < 1024) onClose();
  };

  const handleAllAccountsClick = () => {
    setSelectedAccountId('all');
    navigate('/dashboard');
    if (window.innerWidth < 1024) onClose();
  };

  const toggleAccountExpand = (accountId) => {
    setExpandedAccount(expandedAccount === accountId ? null : accountId);
  };

  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencyOptions.find(c => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

  const getAccountBalance = (account) => {
    return parseFloat(account.current_balance || account.balance || 0);
  };

  const getAccountColor = (balance) => {
    if (balance > 1000) return 'text-green-400';
    if (balance > 0) return 'text-blue-400';
    if (balance < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const filteredAccounts = accounts.filter(account =>
    account.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = (account, e) => {
    e.stopPropagation();
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    
    setLoadingDelete(true);
    try {
      const result = await deleteAccount(accountToDelete.id);
      if (result.success) {
        toast.success('Account deleted successfully');
        
        // If we were viewing the deleted account, redirect to dashboard
        if (selectedAccountId === accountToDelete.id) {
          navigate('/dashboard');
        }
        
        // Refresh accounts list
        refreshAccounts();
      } else {
        toast.error(result.message || 'Failed to delete account');
      }
    } catch (error) {
      toast.error('Error deleting account: ' + error.message);
    } finally {
      setLoadingDelete(false);
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    try {
      const result = await createAccount({
        name: newAccountName.trim(),
        currency_code: newAccountCurrency
      });
      
      if (result.success) {
        toast.success('Account created successfully');
        setNewAccountName('');
        setShowAddForm(false);
        
        // Select the new account
        if (result.data && result.data.id) {
          setSelectedAccountId(result.data.id);
          navigate(`/account/${result.data.id}`);
        }
      } else {
        toast.error(result.message || 'Failed to create account');
      }
    } catch (error) {
      toast.error('Error creating account: ' + error.message);
    }
  };

  const handleViewClick = (view) => {
    if (view === 'dashboard') {
      setSelectedAccountId('all');
      navigate('/dashboard');
    } else if (view === 'reports') {
      navigate('/reports');
    } else if (view === 'transactions') {
      navigate('/transactions');
    }
    
    if (window.innerWidth < 1024) onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out: ' + error.message);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:mt-[57px] lg:h-[calc(100vh-57px)] flex flex-col`}>
        {/* User Profile */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium truncate">{currentUser?.name || 'User'}</h3>
              <p className="text-xs text-gray-400 truncate">{currentUser?.email || 'user@example.com'}</p>
            </div>
          </div>
        </div>

        {/* Mobile header */}
        <div className="p-4 flex items-center justify-between lg:hidden border-b border-gray-700">
          <h2 className="font-bold text-lg text-white">Navigation</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Views */}
          <div className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: PieChart, path: '/dashboard' },
              { id: 'reports', label: 'Reports', icon: BarChart, path: '/reports' },
              { id: 'transactions', label: 'All Transactions', icon: FileText, path: '/transactions' }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewClick(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                    isActive 
                      ? 'bg-blue-600/20 text-white border-l-4 border-blue-500' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Accounts Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300 uppercase">Accounts</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddForm(!showAddForm)} 
                  className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
                  title="Add Account"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={() => setShowAllAccounts(!showAllAccounts)} 
                  className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
                  title={showAllAccounts ? "Collapse Accounts" : "Expand Accounts"}
                >
                  {showAllAccounts ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </button>
              </div>
            </div>

            {/* Add Account Form */}
            {showAddForm && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg space-y-3">
                <input 
                  type="text" 
                  placeholder="Account name" 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={newAccountName} 
                  onChange={e => setNewAccountName(e.target.value)}
                  autoFocus
                />
                <select 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  value={newAccountCurrency} 
                  onChange={e => setNewAccountCurrency(e.target.value)}
                >
                  {currencyOptions.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddAccount}
                    className="flex-1 px-3 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-3 py-2 bg-gray-600 rounded text-white hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Search Accounts */}
            <div className="mb-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* All Accounts Button */}
            <button 
              onClick={handleAllAccountsClick} 
              className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center mb-2 ${
                selectedAccountId === 'all' 
                  ? 'bg-blue-600/20 text-white border-l-4 border-blue-500' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home size={18}/>
                <span>All Accounts</span>
              </div>
              <span className="text-xs bg-gray-600 px-2 py-1 rounded">{accounts.length}</span>
            </button>

            {/* Account List */}
            {showAllAccounts && filteredAccounts.length > 0 ? (
              filteredAccounts.map(account => {
                const isActive = selectedAccountId === account.id;
                return (
                  <div key={account.id} className="group relative">
                    <button 
                      onClick={() => handleAccountClick(account.id)} 
                      className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center mb-1 ${
                        isActive 
                          ? 'bg-blue-600/20 text-white border-l-4 border-blue-500' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Wallet size={18}/>
                        <div className="text-left">
                          <span className="block truncate max-w-[120px]">{account.name}</span>
                          <span className={`text-sm font-medium ${getAccountColor(getAccountBalance(account))}`}>
                            {getCurrencySymbol(account.currency_code)}{formatAmount(getAccountBalance(account))}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDeleteClick(account, e)}
                          className="p-1 hover:bg-red-900/30 rounded text-red-400"
                          title="Delete Account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </button>
                  </div>
                );
              })
            ) : showAllAccounts && filteredAccounts.length === 0 ? (
              <div className="text-center py-4 text-gray-400">
                <p className="text-sm">No accounts found</p>
                {searchTerm && (
                  <p className="text-xs mt-1">Try a different search term</p>
                )}
              </div>
            ) : null}
          </div>

          {/* Recent Transactions */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-2">
                <List size={12}/>
                Recent Transactions
              </h3>
              <button 
                onClick={loadRecentTransactions}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-2">
              {loadingTransactions ? (
                <div className="flex justify-center py-2">
                  <Loader className="animate-spin text-blue-400" size={20}/>
                </div>
              ) : recentTransactions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">No recent transactions</p>
              ) : (
                recentTransactions.map((txn, index) => {
                  const account = getAccountById(txn.account_id);
                  const txnCurrencySymbol = account ? getCurrencySymbol(account.currency_code) : '$';
                  
                  return (
                    <div 
                      key={index} 
                      className="px-2 py-1.5 hover:bg-gray-700 rounded-lg cursor-pointer"
                      onClick={() => {
                        if (txn.id) {
                          navigate(`/transaction/${txn.id}`);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-300 truncate max-w-[120px]">
                          {txn.source || txn.paid_to || txn.description || 'Transaction'}
                        </div>
                        <span className={`font-medium ${txn.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                          {txn.type === 'in' ? '+' : '-'}
                          {txnCurrencySymbol}
                          {formatAmount(txn.amount)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {account ? account.name : ''} • {new Date(txn.transaction_date || txn.date).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Settings & Logout */}
        <div className="p-4 border-t border-gray-700">
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/settings')}
              className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button 
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 text-gray-300 hover:bg-red-900/30 hover:text-red-300"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAccountToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        accountName={accountToDelete?.name}
        loading={loadingDelete}
      />
    </>
  );
};

export default Sidebar;