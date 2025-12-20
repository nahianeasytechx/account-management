// src/components/DashboardCards.jsx
import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const DashboardCards = ({ summary }) => {
  // Safely extract summary data with defaults
  const totalCashIn = summary?.total_cash_in || 0;
  const totalCashOut = summary?.total_cash_out || 0;
  const totalBalance = summary?.total_balance || 0;
  const totalTransactions = summary?.total_transactions || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Cash In Card */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-500 rounded-lg">
            <TrendingUp className="text-white" size={24} />
          </div>
        </div>
        <h3 className="text-sm font-medium text-green-700 mb-1">Total Cash In</h3>
        <p className="text-3xl font-bold text-green-900">
          ${totalCashIn.toFixed(2)}
        </p>
        <p className="text-xs text-green-600 mt-2">
          Income transactions
        </p>
      </div>

      {/* Total Cash Out Card */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-red-500 rounded-lg">
            <TrendingDown className="text-white" size={24} />
          </div>
        </div>
        <h3 className="text-sm font-medium text-red-700 mb-1">Total Cash Out</h3>
        <p className="text-3xl font-bold text-red-900">
          ${totalCashOut.toFixed(2)}
        </p>
        <p className="text-xs text-red-600 mt-2">
          Expense transactions
        </p>
      </div>

      {/* Account Balance Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-blue-500 rounded-lg">
            <Wallet className="text-white" size={24} />
          </div>
        </div>
        <h3 className="text-sm font-medium text-blue-700 mb-1">Account Balance</h3>
        <p className={`text-3xl font-bold ${
          totalBalance >= 0 ? 'text-blue-900' : 'text-red-900'
        }`}>
          ${totalBalance.toFixed(2)}
        </p>
        <p className="text-xs text-blue-600 mt-2">
          {totalTransactions} total transactions
        </p>
      </div>
    </div>
  );
};

export default DashboardCards;