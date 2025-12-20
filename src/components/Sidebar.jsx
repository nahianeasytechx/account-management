// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Wallet, Trash2, Globe, Home, List, 
  PieChart, FileText, BarChart, Search, Loader, ChevronUp, ChevronDown
} from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAccounts } from '../context/AccountsContext';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, currentView, setCurrentView }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { accounts, fetchAccounts } = useAccounts();
  const { transactions, fetchTransactions } = useTransactions();

  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
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

  const currencyOptions = [
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
  ];

  // Fetch recent transactions (top 3)
  useEffect(() => {
    const loadRecentTransactions = async () => {
      setLoadingTransactions(true);
      const res = await fetchTransactions(selectedAccountId);
      if (res.success) {
        setRecentTransactions(res.data.slice(0, 3));
      } else {
        setRecentTransactions([]);
      }
      setLoadingTransactions(false);
    };

    if (isAuthenticated) {
      loadRecentTransactions();
    }
  }, [selectedAccountId, isAuthenticated, fetchTransactions]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024 && location.pathname !== '/') {
      onClose();
    }
  }, [location.pathname, onClose, isOpen]);

  if (!isAuthenticated) return null;

  const handleAccountClick = (accountId) => {
    setSelectedAccountId(accountId);
    setCurrentView('ledger');
    navigate(`/account/${accountId}`);
    if (window.innerWidth < 1024) onClose();
  };

  const handleAllAccountsClick = () => {
    setSelectedAccountId('all');
    setCurrentView('dashboard');
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

  const handleDeleteClick = (account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const handleCurrencyChange = (accountId, currency) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      account.currency_code = currency;
      toast.success('Currency updated (API sync required)');
      setShowCurrencyMenu(null);
    }
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:mt-[57px] lg:h-[calc(100vh-57px)] flex flex-col`}>
        {/* Mobile header */}
        <div className="p-4 flex items-center justify-between lg:hidden border-b border-gray-700">
          <h2 className="font-bold text-lg text-white">Navigation</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300"><X size={20} /></button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Views */}
          <div className="space-y-1">
            {['dashboard', 'reports', 'transactions'].map(view => {
              const icons = { dashboard: PieChart, reports: BarChart, transactions: FileText };
              const Icon = icons[view];
              return (
                <button
                  key={view}
                  onClick={() => {
                    setCurrentView(view);
                    navigate(`/${view}`);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${currentView === view ? 'bg-blue-600/20 text-white border-l-4 border-blue-500' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                >
                  <Icon size={18} />
                  <span>{view.charAt(0).toUpperCase() + view.slice(1)}</span>
                </button>
              );
            })}
          </div>

          {/* Accounts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300 uppercase">Accounts</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowAddForm(!showAddForm)} className="p-1.5 hover:bg-gray-700 rounded text-gray-300"><Plus size={16} /></button>
                <button onClick={() => setShowAllAccounts(!showAllAccounts)} className="p-1.5 hover:bg-gray-700 rounded text-gray-300">{showAllAccounts ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
              </div>
            </div>

            {showAddForm && (
              <div className="mb-4 p-3 bg-gray-700 rounded-lg space-y-3">
                <input type="text" placeholder="Account name" className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} />
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white" value={newAccountCurrency} onChange={e => setNewAccountCurrency(e.target.value)}>
                  {currencyOptions.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button onClick={() => toast.success('Account added (API call needed)')} className="flex-1 px-3 py-2 bg-blue-600 rounded text-white">Add</button>
                  <button onClick={() => setShowAddForm(false)} className="flex-1 px-3 py-2 bg-gray-600 rounded text-white">Cancel</button>
                </div>
              </div>
            )}

            <button onClick={handleAllAccountsClick} className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center ${selectedAccountId === 'all' ? 'bg-blue-600/20 text-white border-l-4 border-blue-500' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
              <div className="flex items-center gap-3"><Home size={18}/><span>All Accounts</span></div>
              <span className="text-xs bg-gray-600 px-2 py-1 rounded">{accounts.length}</span>
            </button>

            {showAllAccounts && filteredAccounts.map(account => (
              <div key={account.id} className="group">
                <button onClick={() => handleAccountClick(account.id)} className={`w-full text-left px-4 py-3 rounded-lg flex justify-between items-center ${selectedAccountId === account.id ? 'bg-blue-600/20 text-white border-l-4 border-blue-500' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
                  <div className="flex items-center gap-3">
                    <Wallet size={18}/>
                    <div className="text-left">
                      <span className="block truncate">{account.name}</span>
                      <span className={`text-sm font-medium ${getAccountColor(getAccountBalance(account))}`}>
                        {getCurrencySymbol(account.currency_code)}{formatAmount(getAccountBalance(account))}
                      </span>
                    </div>
                  </div>
                  <div>
                    <button onClick={(e)=>{e.stopPropagation(); toggleAccountExpand(account.id)}} className="opacity-0 group-hover:opacity-100">{expandedAccount===account.id?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</button>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Recent Transactions */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2"><List size={12}/> Recent Transactions</h3>
            <div className="space-y-2">
              {loadingTransactions ? <Loader className="animate-spin text-blue-400"/> : recentTransactions.map(txn => (
                <div key={txn.id} className="px-2 py-1.5 hover:bg-gray-700 rounded-lg cursor-pointer" onClick={()=>navigate(`/transaction/${txn.id}`)}>
                  <div className="flex justify-between items-center text-xs text-gray-300">
                    <span className="truncate max-w-[120px]">{txn.source || txn.paid_to || txn.description}</span>
                    <span className={`font-medium ${txn.type==='in'?'text-green-400':'text-red-400'}`}>{txn.type==='in'?'+':'-'}{getCurrencySymbol(txn.currency_code)}{formatAmount(txn.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
