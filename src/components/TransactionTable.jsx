import React from 'react';
import { useTransactions } from '../context/TransactionContext';

const TransactionTable = ({ transactions, accountId = null }) => {
  const { getAccountById } = useTransactions();
  const account = accountId ? getAccountById(accountId) : null;

  // Get currency symbol
  const getCurrencySymbol = () => {
    if (!account) return '$';
    const currencySymbols = {
      'USD': '$',
      'BDT': '৳',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'INR': '₹'
    };
    return currencySymbols[account.currency] || account.currency;
  };

  const currencySymbol = getCurrencySymbol();

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
        <p className="text-gray-500">No transactions yet. Add your first transaction above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          {account && (
            <span className="text-sm text-gray-600">
              Currency: <span className="font-medium">{account.currency} ({currencySymbol})</span>
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash In</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cash Out</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {transaction.type === 'in' ? (
                    <span className="text-green-600 font-medium">
                      {currencySymbol}{transaction.amount.toFixed(2)}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  {transaction.type === 'out' ? (
                    <span className="text-red-600 font-medium">
                      {currencySymbol}{transaction.amount.toFixed(2)}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <span className={`font-semibold ${transaction.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {currencySymbol}{Math.abs(transaction.balance).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;