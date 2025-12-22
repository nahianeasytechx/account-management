import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Plus, Wallet, Home, Trash2, PieChart, ChevronDown, ChevronUp, LogOut 
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose, currentView, setCurrentView }) => {
  const { accounts, selectedAccountId, setSelectedAccountId, addAccount, deleteAccount } = useTransactions();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllAccounts, setShowAllAccounts] = useState(true);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('error');

const prevPath = useRef(location.pathname);

useEffect(() => {
  if (
    window.innerWidth < 1024 &&
    prevPath.current !== location.pathname
  ) {
    onClose();
  }

  prevPath.current = location.pathname;
}, [location.pathname, onClose]);

  const handleAddAccount = () => {
    const trimmedName = newAccountName.trim();
    if (!trimmedName) return;
    const existing = accounts.find(a => a.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) {
      setAlertMessage(`Account "${existing.name}" already exists!`);
      setAlertType('error');
      return;
    }
    addAccount(trimmedName);
    setNewAccountName('');
    setShowAddForm(false);
    setAlertMessage(`Account "${trimmedName}" created successfully!`);
    setAlertType('success');
  };

  const handleKeyPress = (e) => { 
    if (e.key === 'Enter') handleAddAccount(); 
  };

  const handleAccountClick = (id) => { 
    setSelectedAccountId(id); 
    setCurrentView('ledger'); 
    if (window.innerWidth < 1024) onClose(); 
  };
  
  const handleAllAccountsClick = () => { 
    setSelectedAccountId('all'); 
    setCurrentView('dashboard'); 
    if (window.innerWidth < 1024) onClose(); 
  };
  
  const handleViewClick = (view) => { 
    setCurrentView(view); 
    if (window.innerWidth < 1024) onClose(); 
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
  
  const toggleAccountExpand = (e, id) => {
    e.stopPropagation(); // FIXED: Prevent button propagation
    setExpandedAccount(expandedAccount === id ? null : id); 
  };

  const handleLogout = () => { 
    logout(); 
    navigate('/login'); 
  };

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getAccountBalance = (account) => 
    account.transactions?.[account.transactions.length - 1]?.balance || 0;
  
  const getAccountColor = (balance) => 
    balance > 1000 ? 'text-green-600' : 
    balance > 0 ? 'text-blue-600' : 
    balance < 0 ? 'text-red-600' : 
    'text-gray-600';
  
  const getCurrencySymbol = () => '৳';

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && window.innerWidth < 1024 && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:mt-[57px] lg:h-[calc(100vh-57px)]`}
      >
        {/* Mobile Header */}
        <div className="p-4 flex items-center justify-between lg:hidden border-b border-gray-700">
          <h2 className="font-bold text-lg text-white">Navigation</h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-700 rounded text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable nav content */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-4">
          {/* Dashboard Button */}
          <button
            onClick={() => handleViewClick('dashboard')}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 rounded-lg transition-colors
              ${currentView === 'dashboard' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
          >
            <PieChart size={18} /> Dashboard
          </button>

          {/* Accounts Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-300 uppercase">Accounts</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAddForm(!showAddForm)} 
                  className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
                  title="Add account"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={() => setShowAllAccounts(!showAllAccounts)} 
                  className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
                  title={showAllAccounts ? "Hide accounts" : "Show accounts"}
                >
                  {showAllAccounts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="mb-4 p-3 bg-gray-700 rounded space-y-2">
                <input 
                  type="text" 
                  value={newAccountName} 
                  onChange={(e) => setNewAccountName(e.target.value)} 
                  onKeyPress={handleKeyPress} 
                  placeholder="Account name..." 
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleAddAccount} 
                    className="flex-1 bg-blue-600 py-2 rounded text-white hover:bg-blue-500 transition-colors"
                  >
                    Add Account
                  </button>
                  <button 
                    onClick={() => setShowAddForm(false)} 
                    className="px-3 py-2 bg-gray-600 rounded text-gray-300 hover:bg-gray-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* All Accounts Button */}
            <button
              onClick={handleAllAccountsClick}
              className={`w-full text-left px-4 py-3 flex items-center justify-between rounded mb-2 transition-colors
                ${selectedAccountId === 'all' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                <Home size={18} /> All Accounts
              </div>
              <span className="text-xs bg-gray-600 px-2 py-1 rounded">{accounts.length}</span>
            </button>

            {/* Individual Accounts - FIXED: No nested buttons */}
            {showAllAccounts && filteredAccounts.map(account => (
              <div key={account.id} className="group mb-1">
                {/* Main Account Button */}
                <div className="relative">
                  <button
                    onClick={() => handleAccountClick(account.id)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between rounded transition-colors
                      ${selectedAccountId === account.id ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
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
                  </button>
                  
                  {/* FIXED: Expand button as separate overlay */}
                  <button 
                    onClick={(e) => toggleAccountExpand(e, account.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-600 rounded text-gray-400 transition-opacity"
                    title="Show options"
                  >
                    {expandedAccount === account.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {/* Expanded Options */}
                {expandedAccount === account.id && (
                  <div className="ml-10 mt-1 space-y-1">
                    <button 
                      onClick={(e) => handleDeleteClick(e, account)} 
                      className="w-full text-left px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 rounded flex items-center gap-2 transition-colors"
                    >
                      <Trash2 size={12} /> Delete Account
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Fixed Logout Nav */}
        <nav className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 flex items-center gap-3 rounded hover:bg-gray-700 text-red-400 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </nav>
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