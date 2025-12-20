import React, { useState, useRef } from 'react';
import { Upload, Paperclip, X, Save } from 'lucide-react';
import { useAccounts } from '../context/AccountsContext';

const TransactionForm = ({ accountId, onAddTransaction, formatFileSize }) => {
  const { getAccountById, refreshAccounts } = useAccounts();
  const account = getAccountById(accountId);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'in',
    transaction_date: new Date().toISOString().split('T')[0],
    source: '',
    paid_to: '',
    description: '',
  });
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrencySymbol = () => {
    if (!account) return '$';
    const currencySymbols = {
      USD: '$',
      BDT: '৳',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      INR: '₹',
    };
    return currencySymbols[account.currency_code] || account.currency_symbol || '$';
  };

  const currencySymbol = getCurrencySymbol();

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Filter out duplicates and check file size (max 5MB)
    const filteredFiles = newFiles.filter(newFile => {
      if (newFile.size > 5 * 1024 * 1024) {
        alert(`File ${newFile.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return !files.some(existingFile => existingFile.name === newFile.name);
    });
    
    setFiles(prev => [...prev, ...filteredFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (formData.type === 'in' && !formData.source.trim()) {
      setError('Please enter the source of cash (where it came from)');
      return;
    }

    if (formData.type === 'out' && !formData.paid_to.trim()) {
      setError('Please enter who/where the cash was paid to');
      return;
    }

    setUploading(true);

    try {
      const transactionData = {
        account_id: accountId,
        amount: parseFloat(formData.amount),
        type: formData.type,
        transaction_date: formData.transaction_date,
        description: formData.description.trim(),
      };

      // Add source/paid_to based on type
      if (formData.type === 'in') {
        transactionData.source = formData.source.trim();
      } else {
        transactionData.paid_to = formData.paid_to.trim();
      }

      // Call the provided handler
      const result = await onAddTransaction(transactionData);
      
      if (result && result.success) {
        // Reset form
        setFormData({
          amount: '',
          type: 'in',
          transaction_date: new Date().toISOString().split('T')[0],
          source: '',
          paid_to: '',
          description: '',
        });
        setFiles([]);
        setError(null);
        
        // Refresh accounts to update balances
        refreshAccounts();
      } else {
        setError(result?.message || 'Failed to add transaction');
      }

    } catch (error) {
      console.error('Error adding transaction:', error);
      setError(error.message || 'Error adding transaction. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    return '📎';
  };

  const handleFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!account) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
        <p className="text-gray-500 text-center">Account not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold mb-4">Add New Transaction</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
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
              ...(e.target.value === 'in' ? { paid_to: '' } : { source: '' })
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
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Source/Paid To Fields */}
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
              value={formData.paid_to}
              onChange={(e) => setFormData({ ...formData, paid_to: e.target.value })}
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
        className={`w-full px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${
          uploading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {uploading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Adding Transaction...
          </>
        ) : (
          <>
            <Save size={18} />
            Add Transaction
          </>
        )}
      </button>
    </div>
  );
};

export default TransactionForm;