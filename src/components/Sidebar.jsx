import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Wallet, Trash2, Home, List, 
  TrendingUp, PieChart,
  ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose, currentView, setCurrentView }) => {
  const { 
    accounts, 
    selectedAccountId, 
    setSelectedAccountId, 
    addAccount,
    deleteAccount,
    getAllTransactions
  } = useTransactions();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllAccounts, setShowAllAccounts] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      onClose();
    }
  }, [location.pathname, onClose, isOpen]);

  const handleAddAccount = () => {
    if (newAccountName.trim()) {
      addAccount(newAccountName.trim(), 'BDT');
      setNewAccountName('');
      setShowAddForm(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddAccount();
    }
  };

  const handleAccountClick = (accountId) => {
    setSelectedAccountId(accountId);
    setCurrentView('ledger');
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleAllAccountsClick = () => {
    setSelectedAccountId('all');
    setCurrentView('dashboard');
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleViewClick = (view) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleDeleteClick = (e, account) => {
    e.stopPropagation();
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete.id);
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  };

  const toggleAccountExpand = (accountId) => {
    setExpandedAccount(expandedAccount === accountId ? null : accountId);
  };

  const getCurrencySymbol = () => {
    return '৳';
  };

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentTransactions = getAllTransactions()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const getAccountBalance = (account) => {
    const lastTransaction = account.transactions[account.transactions.length - 1];
    return lastTransaction?.balance || 0;
  };

  const getAccountColor = (balance) => {
    if (balance > 1000) return 'text-green-600';
    if (balance > 0) return 'text-blue-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 bg-opacity-50 z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 w-64 z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:mt-[57px] lg:h-[calc(100vh-57px)] flex flex-col
      `}>
        {/* Mobile Header */}
        <div className="p-4 flex items-center justify-between lg:hidden border-b border-gray-700">
          <h2 className="font-bold text-lg text-white">Navigation</h2>
          <button onClick={onClose} className="cursor-pointer p-2 hover:bg-gray-700 rounded-lg text-gray-300">
            <X size={20} />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* View Selection */}
            <div className="space-y-1 mb-6">
              <button
                onClick={() => handleViewClick('dashboard')}
                className={`cursor-pointer w-full text-left px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${
                  currentView === 'dashboard' 
                    ? 'bg-transparent text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <PieChart size={18} />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Accounts Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300 uppercase">Accounts</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="cursor-pointer p-1.5 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                    title="Add Account"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => setShowAllAccounts(!showAllAccounts)}
                    className="cursor-pointer p-1.5 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"
                  >
                    {showAllAccounts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {showAddForm && (
                <div className="mb-4 p-3 bg-gray-700 rounded-lg space-y-3">
                  <input
                    type="text"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Account name..."
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400">Currency: BDT (৳)</p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddAccount}
                      className="cursor-pointer flex-1 px-3 py-2 bg-transparent hover:bg-blue-700 text-white rounded transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewAccountName('');
                      }}
                      className="cursor-pointer flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* All Accounts Button */}
              <button
                onClick={handleAllAccountsClick}
                className={`cursor-pointer w-full text-left px-4 py-3 rounded-lg transition-all mb-2 flex items-center justify-between ${
                  selectedAccountId === 'all' 
                    ? 'bg-transparent text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home size={18} />
                  <span>All Accounts</span>
                </div>
                <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                  {accounts.length}
                </span>
              </button>

              {/* Individual Accounts */}
              {showAllAccounts && filteredAccounts.length > 0 && (
                <div className="space-y-1">
                  {filteredAccounts.map(account => (
                    <div key={account.id} className="group">
                      <button
                        onClick={() => handleAccountClick(account.id)}
                        className={`cursor-pointer w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                          selectedAccountId === account.id 
                            ? 'bg-transparent text-white' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Wallet size={18} />
                          <div className="text-left">
                            <span className="block truncate max-w-[120px]">{account.name}</span>
                            <span className={`text-sm font-medium ${getAccountColor(getAccountBalance(account))}`}>
                              {getCurrencySymbol()}{getAccountBalance(account).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAccountExpand(account.id);
                            }}
                            className="cursor-pointer p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded text-gray-400"
                          >
                            {expandedAccount === account.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </button>

                      {/* Account Actions */}
                      {expandedAccount === account.id && (
                        <div className="ml-10 mt-1 space-y-1">
                          <button
                            onClick={(e) => handleDeleteClick(e, account)}
                            className="cursor-pointer w-full text-left px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 rounded flex items-center gap-2"
                          >
                            <Trash2 size={12} />
                            Delete Account
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showAllAccounts && filteredAccounts.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <Wallet className="mx-auto mb-2" size={24} />
                  <p className="text-sm">No accounts found</p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 px-2 flex items-center gap-2">
                <List size={12} />
                Recent Transactions
              </h3>
              <div className="space-y-2">
                {recentTransactions.slice(0, 3).map(transaction => (
                  <div key={transaction.id} className="px-2 py-1.5 hover:bg-gray-700 rounded-lg cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-300 truncate max-w-[120px]">
                        {transaction.source}
                      </span>
                      <span className={`text-xs font-medium ${
                        transaction.type === 'in' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'in' ? '+' : '-'}{getCurrencySymbol()}{transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {transaction.description}
                    </div>
                  </div>
                ))}
              </div>
              {recentTransactions.length > 3 && (
                <button
                  onClick={() => navigate('/transactions')}
                  className="w-full text-center text-xs text-blue-400 hover:text-blue-300 mt-2 py-1 cursor-pointer"
                >
                  View all transactions →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Summary */}
        <div className="border-t border-gray-700 p-4 bg-gray-900/50">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Balance</span>
              <span className="font-medium text-green-400">
                {getCurrencySymbol()}{accounts.reduce((sum, acc) => sum + getAccountBalance(acc), 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Accounts</span>
              <span className="font-medium text-blue-300">{accounts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Transactions</span>
              <span className="font-medium text-purple-300">
                {accounts.reduce((sum, acc) => sum + acc.transactions.length, 0)}
              </span>
            </div>
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
        onConfirm={confirmDelete}
        accountName={accountToDelete?.name || ''}
      />
    </>
  );
};

export default Sidebar;