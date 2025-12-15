import React, { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';

const TransactionForm = ({ accountId }) => {
  const { addTransaction, getAccountById } = useTransactions();
  const account = getAccountById(accountId);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'in',
    date: new Date().toISOString().split('T')[0]
  });

  // Get currency symbol
  const getCurrencySymbol = () => {
    if (!account) return '$';
    const currencySymbols = {
      'USD': '$',
      'BDT': '৳',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'INR': '₹'
    };
    return currencySymbols[account.currency] || account.currency;
  };

  const currencySymbol = getCurrencySymbol();

  const handleSubmit = () => {
    if (formData.amount && parseFloat(formData.amount) > 0) {
      addTransaction(accountId, {
        amount: parseFloat(formData.amount),
        type: formData.type,
        date: formData.date
      });
      setFormData({
        amount: '',
        type: 'in',
        date: new Date().toISOString().split('T')[0]
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Add Transaction</h3>
        {account && (
          <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full">
            Currency: {account.currency} ({currencySymbol})
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="in">Cash In</option>
            <option value="out">Cash Out</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <button
        onClick={handleSubmit}
        className="cursor-pointer mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add Transaction
      </button>
    </div>
  );
};

export default TransactionForm;