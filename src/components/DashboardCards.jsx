import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

// Safe rounding function
const round2 = (num) => Math.round((parseFloat(num) + Number.EPSILON) * 100) / 100;

const DashboardCards = ({ accountId = null }) => {
  const { accounts, getTotals } = useTransactions();
  
  const calculateAccountTotals = () => {
    let totalIn = 0;
    let totalOut = 0;

    if (accountId) {
      const account = accounts.find(acc => acc.id === accountId);
      if (account) {
        account.transactions.forEach(t => {
          if (t.type === 'in') totalIn += round2(t.amount);
          else totalOut += round2(t.amount);
        });
      }
    } else {
      const totals = getTotals();
      totalIn = round2(totals.totalIn);
      totalOut = round2(totals.totalOut);
    }

    return {
      totalIn,
      totalOut,
      balance: round2(totalIn - totalOut),
    };
  };

  const { totalIn, totalOut, balance } = calculateAccountTotals();

  const currencySymbol = '৳';

  const cards = [
    {
      title: accountId ? 'Account Cash In' : 'Total Cash In',
      amount: totalIn,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: accountId ? 'Account Cash Out' : 'Total Cash Out',
      amount: totalOut,
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: accountId ? 'Account Balance' : 'Remaining Balance',
      amount: balance,
      icon: Wallet,
      color: balance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600',
      bgColor: balance >= 0 ? 'bg-blue-100' : 'bg-red-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <p className="text-xs text-gray-500 mt-1">BDT Account</p>
            </div>
            <div className={`p-3 rounded-lg ${card.bgColor}`}>
              <card.icon className={card.color} size={24} />
            </div>
          </div>
          <p className={`text-3xl font-bold ${card.amount < 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {currencySymbol}{Math.abs(round2(card.amount)).toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;
