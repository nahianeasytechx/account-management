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
      gradient: 'from-green-500 to-emerald-600',
      iconBg: 'bg-green-500',
      lightBg: 'bg-gradient-to-br from-green-50 to-emerald-50'
    },
    {
      title: accountId ? 'Account Cash Out' : 'Total Cash Out',
      amount: totalOut,
      icon: TrendingDown,
      gradient: 'from-red-500 to-rose-600',
      iconBg: 'bg-red-500',
      lightBg: 'bg-gradient-to-br from-red-50 to-rose-50'
    },
    {
      title: accountId ? 'Account Balance' : 'Remaining Balance',
      amount: balance,
      icon: Wallet,
      gradient: balance >= 0 ? 'from-blue-500 to-indigo-600' : 'from-red-500 to-rose-600',
      iconBg: balance >= 0 ? 'bg-blue-500' : 'bg-red-500',
      lightBg: balance >= 0 ? 'bg-gradient-to-br from-blue-50 to-indigo-50' : 'bg-gradient-to-br from-red-50 to-rose-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${card.lightBg} border border-white/50`}
        >
          {/* Decorative gradient overlay */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl rounded-full -mr-16 -mt-16`}></div>
          
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">{card.title}</h3>
                <p className="text-xs text-gray-500">BDT Account</p>
              </div>
              <div className={`p-3 rounded-xl shadow-lg bg-gradient-to-br ${card.gradient}`}>
                <card.icon className="text-white" size={22} strokeWidth={2.5} />
              </div>
            </div>

            {/* Amount */}
            <div className="mt-2">
              <p className={`text-2xl md:text-3xl font-bold ${
                card.amount < 0 ? 'text-red-600' : 'text-gray-900'
              }`}>
                {currencySymbol}{Math.abs(round2(card.amount)).toFixed(2)}
              </p>
              {card.amount < 0 && (
                <p className="text-xs text-red-600 font-medium mt-1">Negative Balance</p>
              )}
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardCards;