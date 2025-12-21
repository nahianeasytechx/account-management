import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
  Calendar,
  DollarSign,
  Type,
  MessageSquare
} from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

const TransactionCard = ({ transaction, accountId, onDelete }) => {
  const { 
    getAccountById, 
    editTransaction
  } = useTransactions();
  
  const account = getAccountById(accountId);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    amount: transaction.amount,
    type: transaction.type,
    date: transaction.date,
    source: transaction.source || '',
    paidTo: transaction.paidTo || '',
    description: transaction.description || ''
  });

  if (!account) return null;

  const currencySymbol = '৳';

  const handleSaveEdit = () => {
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
        ? { source: editForm.source.trim(), paidTo: '' }
        : { paidTo: editForm.paidTo.trim(), source: '' }
      )
    };

    editTransaction(accountId, transaction.id, updates);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      amount: transaction.amount,
      type: transaction.type,
      date: transaction.date,
      source: transaction.source || '',
      paidTo: transaction.paidTo || '',
      description: transaction.description || ''
    });
    setEditing(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
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
                  />
                </div>
              ) : (
                <>
                  <h4 className="font-medium text-gray-900">
                    {transaction.type === 'in' ? transaction.source : transaction.paidTo}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(transaction.date)} • {account.name}
                  </p>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {editing ? (
              <div className="flex items-center gap-2">
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
                {transaction.amount.toFixed(2)}
              </span>
            )}
            
            <div className="flex items-center gap-2">
              {!editing && (
                <>

                  
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
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
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
                  <span className="text-gray-500">Account Balance:</span>
                  <span className={`ml-2 font-bold ${
                    transaction.balance >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {currencySymbol}{Math.abs(transaction.balance).toFixed(2)}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">
                    {transaction.type === 'in' ? 'From:' : 'To:'}
                  </span>
                  <span className="ml-2 font-medium">
                    {transaction.type === 'in' ? transaction.source : transaction.paidTo}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="ml-2">{formatDate(transaction.date)}</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setEditing(true);
                    setExpanded(true);
                  }}
                  className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer flex items-center gap-2"
                >
                  <Edit2 size={14} />
                  Edit Transaction
                </button>
                <button
                  onClick={() => onDelete(transaction.id)}
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