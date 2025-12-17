import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import DashboardCards from './DashboardCards';
import TransactionForm from './TransactionForm';
import TransactionTable from './TransactionTable';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useTransactions } from '../context/TransactionContext';

const LedgerDetails = () => {
  const { selectedAccountId, getAccountById, deleteAccount } = useTransactions();
  const account = getAccountById(selectedAccountId);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    if (account) {
      if (deleteAccount(account.id)) {
        setShowDeleteModal(false);
      }
    }
  };

  if (!account) {
    return <div className="text-center py-12 text-gray-500">Account not found</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{account.name} Ledger</h2>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>
      
      <DashboardCards accountId={selectedAccountId} />
      <TransactionForm accountId={account.id} />
      <TransactionTable transactions={account.transactions} accountId={account.id} />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        accountName={account.name}
      />
    </div>
  );
};

export default LedgerDetails;