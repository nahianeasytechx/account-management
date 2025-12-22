import React, { useState, useRef } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { AlertCircle, CheckCircle, X, Info, DollarSign, Calendar, User, FileText } from 'lucide-react';

const TransactionForm = ({ accountId }) => {
  const { addTransaction, getAccountById } = useTransactions();
  const account = getAccountById(accountId);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    type: 'in',
    date: new Date().toISOString().split('T')[0],
    source: '',
    paidTo: '',
    description: '',
  });
  
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    type: 'error', // 'error', 'success', 'warning'
    icon: null,
    fields: [], // Fields that need attention
  });

  const getCurrencySymbol = () => {
    if (!account) return '$';
    const currencySymbols = {
      BDT: '৳',
    };
    return currencySymbols[account.currency] || account.currency;
  };

  const currencySymbol = getCurrencySymbol();

  const showAlertModal = (title, message, type = 'error', fields = []) => {
    const icons = {
      error: <AlertCircle className="text-red-600" size={28} />,
      success: <CheckCircle className="text-green-600" size={28} />,
      warning: <Info className="text-yellow-600" size={28} />,
    };

    setAlertData({
      title,
      message,
      type,
      icon: icons[type],
      fields,
    });
    setShowAlert(true);
  };

  const handleSubmit = async () => {
    // Validation
    const errors = [];
    const fields = [];

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.push('Please enter a valid amount');
      fields.push('amount');
    }

    if (formData.type === 'in' && !formData.source.trim()) {
      errors.push('Please enter the source of cash (where it came from)');
      fields.push('source');
    }

    if (formData.type === 'out' && !formData.paidTo.trim()) {
      errors.push('Please enter who/where the cash was paid to');
      fields.push('paidTo');
    }

    if (errors.length > 0) {
      showAlertModal(
        'Validation Error',
        errors.join('\n'),
        'error',
        fields
      );
      return;
    }

    setUploading(true);
// Add this helper function at the top
const round2 = (num) => Math.round((parseFloat(num) + Number.EPSILON) * 100) / 100;

// Inside handleSubmit, before sending
const transactionData = {
  amount: round2(formData.amount),  // <-- round here
  type: formData.type,
  date: formData.date,
  description: formData.description.trim(),
  files: files
};

// Add source/paidTo based on type
if (formData.type === 'in') {
  transactionData.source = formData.source.trim();
} else {
  transactionData.paidTo = formData.paidTo.trim();
}

    try {
      const transactionData = {
        amount: parseFloat(formData.amount),
        type: formData.type,
        date: formData.date,
        description: formData.description.trim(),
        files: files
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
      setFiles([]);

      // Show success message
      showAlertModal(
        'Transaction Added!',
        `Successfully added ${currencySymbol}${transactionData.amount} ${transactionData.type === 'in' ? 'cash in' : 'cash out'} transaction.`,
        'success'
      );

    } catch (error) {
      console.error('Error adding transaction:', error);
      showAlertModal(
        'Transaction Failed',
        error.message || 'Error adding transaction. Please try again.',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const getFieldIcon = (fieldName) => {
    const icons = {
      amount: <DollarSign size={16} className="text-gray-500" />,
      date: <Calendar size={16} className="text-gray-500" />,
      source: <User size={16} className="text-gray-500" />,
      paidTo: <User size={16} className="text-gray-500" />,
      description: <FileText size={16} className="text-gray-500" />,
    };
    return icons[fieldName] || null;
  };

  const getFieldLabel = (fieldName) => {
    const labels = {
      amount: 'Amount',
      source: 'Source',
      paidTo: 'Paid To',
      description: 'Description',
    };
    return labels[fieldName] || fieldName;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
          </div>
          Add New Transaction
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Amount */}
          <div className={alertData.fields.includes('amount') ? 'animate-pulse' : ''}>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
           
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
                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  alertData.fields.includes('amount') ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {alertData.fields.includes('amount') && (
              <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle size={12} /> Enter a valid amount
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  type: 'in',
                  paidTo: ''
                })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  formData.type === 'in' 
                    ? 'bg-linear-to-r from-green-500 to-green-600 text-white text-white shadow-sm ring-1 ring-green-200' 
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                Cash In
              </button>
              <button
                type="button"
                onClick={() => setFormData({ 
                  ...formData, 
                  type: 'out',
                  source: ''
                })}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  formData.type === 'out' 
                    ? 'bg-linear-to-r from-red-500 to-red-600 text-white  shadow-sm ring-1 ring-red-200' 
                    : 'text-gray-600 hover:text-red-600'
                }`}
              >
                Cash Out
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-gray-500" />
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
            />
          </div>
        </div>

        {/* Source/Paid To Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {formData.type === 'in' ? (
            <div className={alertData.fields.includes('source') ? 'animate-pulse' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-gray-500" />
                Source (Where did the cash come from?)
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  alertData.fields.includes('source') ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                }`}
                placeholder="e.g., Client Name, Company, Salary, etc."
              />
              {alertData.fields.includes('source') && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> This field is required
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Examples: "ABC Corporation", "John Doe", "Freelance Project", "Investment Return"
              </p>
            </div>
          ) : (
            <div className={alertData.fields.includes('paidTo') ? 'animate-pulse' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-gray-500" />
                Paid To (Where was the cash paid to?)
              </label>
              <input
                type="text"
                value={formData.paidTo}
                onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  alertData.fields.includes('paidTo') ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'
                }`}
                placeholder="e.g., Vendor Name, Service Provider, Expense Category, etc."
              />
              {alertData.fields.includes('paidTo') && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> This field is required
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Examples: "Office Supplies Store", "Internet Bill", "Employee Salary", "Rent Payment"
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4 md:mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText size={16} className="text-gray-500" />
            Description (Optional)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Add any notes or details about this transaction..."
            rows="3"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className={` px-6 py-2  rounded-lg font-semibold  transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
            uploading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Adding Transaction...
            </div>
          ) : (
            'Add Transaction'
          )}
        </button>

      </div>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setShowAlert(false)}
          />
          
          {/* Modal */}
          <div className="relative z-10 w-full max-w-md animate-scale-in">
            <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all`}>
              {/* Header */}
              <div className={`p-6 ${alertData.type === 'error' ? 'bg-red-50' : alertData.type === 'success' ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${alertData.type === 'error' ? 'bg-red-100' : alertData.type === 'success' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      {alertData.icon}
                    </div>
                    <h3 className={`text-xl font-bold ${alertData.type === 'error' ? 'text-red-700' : alertData.type === 'success' ? 'text-green-700' : 'text-yellow-700'}`}>
                      {alertData.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAlert(false)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-gray-700 text-lg">{alertData.message}</p>
                    
                    {alertData.type === 'success' && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 w-full">
                        <div className="flex items-center justify-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-green-800">Transaction Summary</p>
                            <p className="text-sm text-green-600">
                              {currencySymbol}{formData.amount} • {formData.type === 'in' ? 'Cash In' : 'Cash Out'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  {alertData.type === 'error' && alertData.fields.length > 0 ? (
                    <button
                      onClick={() => {
                        setShowAlert(false);
                        // Focus on first error field
                        const firstField = alertData.fields[0];
                        document.querySelector(`[name="${firstField}"]`)?.focus();
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all"
                    >
                      Fix Errors
                    </button>
                  ) : alertData.type === 'success' ? (
                    <button
                      onClick={() => {
                        setShowAlert(false);
                        // Reset form if needed
                        if (!uploading) {
                          setFormData({
                            amount: '',
                            type: 'in',
                            date: new Date().toISOString().split('T')[0],
                            source: '',
                            paidTo: '',
                            description: '',
                          });
                        }
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all"
                    >
                      Add Another
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAlert(false)}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all"
                    >
                      Got it
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowAlert(false)}
                    className={`py-3 px-6 rounded-lg font-medium transition-all ${
                      alertData.type === 'success' 
                        ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default TransactionForm;