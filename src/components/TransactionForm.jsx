import React, { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';

const TransactionForm = ({ accountId }) => {
  const { addTransaction, getAccountById } = useTransactions();
  const account = getAccountById(accountId);
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'in',
    date: new Date().toISOString().split('T')[0],
    source: '',
    paidTo: '',
    description: '',
  });
  
  const [uploading, setUploading] = useState(false);

  const currencySymbol = '৳';

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (formData.type === 'in' && !formData.source.trim()) {
      alert('Please enter the source of cash (where it came from)');
      return;
    }

    if (formData.type === 'out' && !formData.paidTo.trim()) {
      alert('Please enter who/where the cash was paid to');
      return;
    }

    setUploading(true);

    try {
      const transactionData = {
        amount: parseFloat(formData.amount),
        type: formData.type,
        date: formData.date,
        description: formData.description.trim(),
      };

      // Add source/paidTo based on type
      if (formData.type === 'in') {
        transactionData.source = formData.source.trim();
      } else {
        transactionData.paidTo = formData.paidTo.trim();
      }

      await addTransaction(accountId, transactionData);

      // Reset form
      setFormData({
        amount: '',
        type: 'in',
        date: new Date().toISOString().split('T')[0],
        source: '',
        paidTo: '',
        description: '',
      });

    } catch (error) {
      console.error('Error adding transaction:', error);
      alert(error.message || 'Error adding transaction. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold mb-4">Add New Transaction</h3>
      
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
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ 
              ...formData, 
              type: e.target.value,
              // Clear the other field when switching type
              ...(e.target.value === 'in' ? { paidTo: '' } : { source: '' })
            })}
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
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Source/Paid To Fields - Now text inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {formData.type === 'in' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source (Where did the cash come from?)
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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
              value={formData.paidTo}
              onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
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
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add any notes or details about this transaction..."
          rows="2"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={uploading}
        className={`w-full px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
          uploading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {uploading ? 'Adding Transaction...' : 'Add Transaction'}
      </button>
    </div>
  );
};

export default TransactionForm;