// src/components/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAccounts } from '../context/AccountsContext';
import { useTransactions } from '../context/TransactionContext';
import DashboardCards from './DashboardCards';
import TransactionCard from './TransactionCard';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const Dashboard = () => {
  const { accounts, selectedAccountId, getAccountById, deleteAccount } = useAccounts();
  const { transactions, getDashboardSummary, loading } = useTransactions();
  const [dashboardData, setDashboardData] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const account = selectedAccountId === 'all' ? null : getAccountById(selectedAccountId);

  useEffect(() => {
    const loadDashboard = async () => {
      const result = await getDashboardSummary(selectedAccountId, filterType);
      if (result.success) setDashboardData(result.data);
    };
    loadDashboard();
  }, [selectedAccountId, filterType, getDashboardSummary]);

  const displayedTransactions = dashboardData?.transactions || [];
  const summary = dashboardData?.summary || {
    total_cash_in: 0,
    total_cash_out: 0,
    total_balance: 0,
    total_transactions: 0,
  };

  const handleDeleteAccount = async () => {
    if (!account) return;
    const result = await deleteAccount(account.id);
    if (result.success) setShowDeleteModal(false);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-2">
        {selectedAccountId === 'all' ? 'Dashboard - All Accounts' : `Dashboard - ${account?.name}`}
      </h2>

      <DashboardCards summary={summary} />

      <div className="mt-6">
        {displayedTransactions.length > 0 ? (
          displayedTransactions.map(txn => (
            <TransactionCard key={txn.id} transaction={txn} />
          ))
        ) : (
          <p>No transactions to display</p>
        )}
      </div>

      {account && (
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
          accountName={account.name}
        />
      )}
    </div>
  );
};

export default Dashboard;
