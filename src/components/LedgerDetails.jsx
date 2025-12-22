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
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md mx-auto p-8">
          {/* Icon Container */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 opacity-20 animate-pulse"></div>
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center shadow-lg">
              <svg 
                className="w-10 h-10 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
          </div>

          {/* Text Content */}
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
            Account Not Found
          </h3>
          <p className="text-sm lg:text-base text-gray-600 leading-relaxed mb-8 ">
          You Probably Did Not Select An Account Please Select An Account First
          </p>

        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{account.name} Ledger</h2>
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