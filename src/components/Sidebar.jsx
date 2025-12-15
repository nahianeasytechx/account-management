import React, { useState } from 'react';
import { X, Plus, Wallet, Trash2, Globe } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const Sidebar = ({ isOpen, onClose }) => {
  const { 
    accounts, 
    selectedAccountId, 
    setSelectedAccountId, 
    addAccount,
    updateAccountCurrency,
    deleteAccount 
  } = useTransactions();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('USD');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(null);

  const handleAddAccount = () => {
    if (newAccountName.trim()) {
      addAccount(newAccountName.trim(), newAccountCurrency);
      setNewAccountName('');
      setNewAccountCurrency('USD');
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
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleDeleteClick = (e, account) => {
    e.stopPropagation();
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const handleCurrencyChange = (accountId, currency) => {
    updateAccountCurrency(accountId, currency);
    setShowCurrencyMenu(null);
  };

  const confirmDelete = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete.id);
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  };

  const currencyOptions = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' }
  ];

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencyOptions.find(c => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 z-50 transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:mt-[57px] lg:h-[calc(100vh-57px)]
      `}>
        <div className="p-4 flex items-center justify-between lg:hidden border-b">
          <h2 className="font-bold text-lg">Menu</h2>
          <button onClick={onClose} className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Accounts</h3>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="cursor-pointer p-1 hover:bg-gray-100 rounded"
              title="Add Account"
            >
              <Plus size={18} />
            </button>
          </div>

          {showAddForm && (
            <div className="mb-3 space-y-3">
              <div>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Account name..."
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={newAccountCurrency}
                  onChange={(e) => setNewAccountCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currencyOptions.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddAccount}
                  className="cursor-pointer flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add Account
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAccountName('');
                    setNewAccountCurrency('USD');
                  }}
                  className="cursor-pointer flex-1 px-3 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {accounts.map(account => (
              <div key={account.id} className="group relative">
                <button
                  onClick={() => handleAccountClick(account.id)}
                  className={`
                    cursor-pointer w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between
                    ${selectedAccountId === account.id 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'hover:bg-gray-50 text-gray-700'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Wallet size={18} />
                    <div className="text-left">
                      <span className="block truncate">{account.name}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Globe size={10} />
                        {account.currency}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCurrencyMenu(showCurrencyMenu === account.id ? null : account.id);
                      }}
                      className="cursor-pointer p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all text-gray-500"
                      title="Change currency"
                    >
                      {getCurrencySymbol(account.currency)}
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, account)}
                      className="cursor-pointer p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 rounded transition-all"
                      title="Delete account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </button>

                {/* Currency dropdown menu */}
                {showCurrencyMenu === account.id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <p className="text-xs font-medium text-gray-500 mb-2 px-2">Change Currency</p>
                      {currencyOptions.map(currency => (
                        <button
                          key={currency.code}
                          onClick={() => handleCurrencyChange(account.id, currency.code)}
                          className={`cursor-pointer w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center justify-between ${
                            account.currency === currency.code ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          <span>{currency.code} - {currency.name}</span>
                          <span className="font-medium">{currency.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

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