import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DashboardCards from './DashboardCards';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useTransactions } from '../context/TransactionContext';

const Dashboard = () => {
  const { accounts, selectedAccountId, getAccountById, deleteAccount } = useTransactions();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const account = getAccountById(selectedAccountId);
  const recentTransactions = accounts
    .flatMap(acc => acc.transactions.map(t => ({ ...t, accountName: acc.name })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const handleDelete = () => {
    if (account) {
      if (deleteAccount(account.id)) {
        setShowDeleteModal(false);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        {account && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Delete {account.name}
          </button>
        )}
      </div>
      
      {/* Selected Account Overview */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-lg font-semibold text-gray-700">Selected Account</h3>
          {account && (
            <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full">
              {account.name}
            </span>
          )}
        </div>
        <DashboardCards accountId={selectedAccountId} />
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions (All Accounts)</h3>
        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{transaction.accountName}</p>
                  <p className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
<span className={`font-semibold ${transaction.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
  {transaction.type === 'in' ? '+' : '-'}$
  {transaction.amount.toFixed(2)}
</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        )}
      </div>

      {account && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          accountName={account.name}
        />
      )}
    </div>
  );
};

export default Dashboard;