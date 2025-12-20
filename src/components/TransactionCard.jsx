// src/components/TransactionCard.jsx - FIXED VERSION
import React, { useState, useRef } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Download, 
  Eye, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Edit2,
  Save,
  X,
  Plus,
  Calendar,
  Type,
  MessageSquare
} from 'lucide-react';
import { useAccounts } from '../context/AccountsContext';

const TransactionCard = ({ transaction, accountId, onDelete }) => {
  const { getAccountById } = useAccounts();
  const account = getAccountById(accountId);
  
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: transaction.amount,
    type: transaction.type,
    date: transaction.transaction_date || transaction.date,
    source: transaction.source || '',
    paidTo: transaction.paid_to || transaction.paidTo || '',
    description: transaction.description || ''
  });
  const [newFiles, setNewFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Helper function for file size formatting
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!account) {
    console.warn('Account not found for transaction:', transaction);
    return null;
  }

  const getCurrencySymbol = () => {
    const currencySymbols = {
      USD: '$',
      BDT: '৳',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      INR: '₹',
    };
    return currencySymbols[account.currency_code || account.currency] || '$';
  };

  const currencySymbol = getCurrencySymbol();

  const getFileIcon = (filename) => {
    if (filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) return <ImageIcon size={16} className="text-blue-500" />;
    if (filename.match(/\.pdf$/i)) return <FileText size={16} className="text-red-500" />;
    return <File size={16} className="text-gray-500" />;
  };

  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editForm.amount || editForm.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (editForm.type === 'in' && !editForm.source.trim()) {
      alert('Please enter the source of cash');
      return;
    }

    if (editForm.type === 'out' && !editForm.paidTo.trim()) {
      alert('Please enter who/where the cash was paid to');
      return;
    }

    const updates = {
      amount: parseFloat(editForm.amount),
      type: editForm.type,
      date: editForm.date,
      description: editForm.description.trim(),
      ...(editForm.type === 'in' 
        ? { source: editForm.source.trim(), paid_to: '' }
        : { paid_to: editForm.paidTo.trim(), source: '' }
      )
    };

    console.log('Saving transaction updates:', updates);
    // TODO: Call API to update transaction
    // await apiRequest('PUT', `/transactions/${transaction.id}`, updates);
    
    setEditing(false);
    alert('Transaction updated (API integration pending)');
  };

  const handleCancelEdit = () => {
    setEditForm({
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.transaction_date || transaction.date,
      source: transaction.source || '',
      paidTo: transaction.paid_to || transaction.paidTo || '',
      description: transaction.description || ''
    });
    setNewFiles([]);
    setEditing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
      {/* Card Header */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => !editing && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              transaction.type === 'in' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {transaction.type === 'in' ? (
                <ArrowUpRight className="text-green-600" size={20} />
              ) : (
                <ArrowDownRight className="text-red-600" size={20} />
              )}
            </div>
            
            <div>
              {editing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editForm.type === 'in' ? editForm.source : editForm.paidTo}
                    onChange={(e) => editForm.type === 'in' 
                      ? setEditForm({...editForm, source: e.target.value})
                      : setEditForm({...editForm, paidTo: e.target.value})
                    }
                    className="px-3 py-1 border rounded text-sm font-medium"
                    placeholder={editForm.type === 'in' ? "Source of cash..." : "Paid to..."}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <>
                  <h4 className="font-medium text-gray-900">
                    {transaction.type === 'in' 
                      ? (transaction.source || 'Cash In')
                      : (transaction.paid_to || transaction.paidTo || 'Cash Out')
                    }
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(transaction.transaction_date || transaction.date)} • {account.name}
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {editing ? (
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                  className="w-32 px-3 py-1 border rounded text-right text-lg font-bold"
                  placeholder="0.00"
                />
                <span className="text-lg font-bold text-gray-500">{currencySymbol}</span>
              </div>
            ) : (
              <span className={`text-lg font-bold ${
                transaction.type === 'in' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'in' ? '+' : '-'}{currencySymbol}
                {parseFloat(transaction.amount || 0).toFixed(2)}
              </span>
            )}
            
            <div className="flex items-center gap-2">
              {transaction.attachments?.length > 0 && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Paperclip size={14} />
                  <span className="text-xs">{transaction.attachments.length}</span>
                </div>
              )}
              
              {!editing && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }}
                    className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                    title="Edit transaction"
                  >
                    <Edit2 size={18} />
                  </button>
                  
                  {expanded ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 p-4">
          {editing ? (
            /* Edit Form */
            <div className="space-y-4">
              {/* Edit Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Type size={14} />
                    Transaction Type
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ 
                      ...editForm, 
                      type: e.target.value,
                      ...(e.target.value === 'in' ? { paidTo: '' } : { source: '' })
                    })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="in">Cash In</option>
                    <option value="out">Cash Out</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={14} />
                    Date
                  </label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare size={14} />
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add description..."
                  rows="2"
                />
              </div>
              
              {/* Add New Files Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Add More Attachments</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                  >
                    <Plus size={14} />
                    Add Files
                  </button>
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAddFiles}
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                />
                
                {/* New Files List */}
                {newFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Paperclip size={16} className="text-blue-500" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewFile(index)}
                          className="p-1 hover:bg-red-100 rounded text-red-600 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Edit Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={uploadingFile}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {uploadingFile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <>
              {/* Description */}
              {transaction.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700">{transaction.description}</p>
                </div>
              )}
              
              {/* Transaction Details */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className={`ml-2 font-medium ${
                    transaction.type === 'in' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'in' ? 'Cash In' : 'Cash Out'}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Balance After:</span>
                  <span className={`ml-2 font-bold ${
                    (transaction.balance || 0) >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {currencySymbol}{Math.abs(transaction.balance || 0).toFixed(2)}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">
                    {transaction.type === 'in' ? 'From:' : 'To:'}
                  </span>
                  <span className="ml-2 font-medium">
                    {transaction.type === 'in' 
                      ? (transaction.source || 'N/A')
                      : (transaction.paid_to || transaction.paidTo || 'N/A')
                    }
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2">{formatDate(transaction.transaction_date || transaction.date)}</span>
                </div>
              </div>
              
              {/* Attachments */}
              {transaction.attachments && transaction.attachments.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Attachments</h5>
                  <div className="space-y-2">
                    {transaction.attachments.map((attachment, index) => {
                      const filename = typeof attachment === 'string' ? attachment : attachment.filename;
                      const isImage = filename.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            {getFileIcon(filename)}
                            <span className="text-sm text-gray-700 truncate">{filename}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(true);
                    setExpanded(true);
                  }}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Edit Transaction
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete && onDelete(transaction.id);
                  }}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete Transaction
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionCard;