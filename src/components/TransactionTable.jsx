import React from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react";
import { useTransactions } from "../context/TransactionContext";

// Safe rounding function
const round2 = (num) => Math.round((parseFloat(num) + Number.EPSILON) * 100) / 100;

const TransactionTable = ({ transactions, accountId = null }) => {
  const { getAccountById } = useTransactions();
  const account = accountId ? getAccountById(accountId) : null;

  const currencySymbol = '৳';

  if (transactions.length === 0) {
    return (
      <div className="bg-linear-to-br from-gray-50 to-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
        <div className="max-w-sm mx-auto">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Transactions Yet</h3>
          <p className="text-gray-500 text-sm">
            Add your first transaction above to start tracking your finances.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-linear-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Transaction History</h3>
              <p className="text-xs text-gray-500">{transactions.length} total entries</p>
            </div>
          </div>
          {account && (
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Currency</p>
              <p className="text-sm font-semibold text-gray-800">BDT ({currencySymbol})</p>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-scroll max-h-100">
        <table className="w-full">
          <thead className="bg-black border-b border-gray-200">
            <tr>
              <th className="w-100 px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">Details</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Amount</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((transaction, index) => (
              <tr 
                key={transaction.id} 
                className="hover:bg-linear-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-150"
              >
                <td className="px-6 py-4 ">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(transaction.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      transaction.type === "in" 
                        ? "bg-linear-to-r from bg-green-500 to-green-600" 
                        : "bg-linear-to-r from bg-red-500 to-red-600"
                    }`}>
                      {transaction.type === "in" ? (
                        <ArrowUpRight className="text-white" size={16} />
                      ) : (
                        <ArrowDownRight className="text-white" size={16} />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-sm font-semibold ${
                        transaction.type === "in" ? "text-green-700" : "text-red-700"
                      }`}>
                        {transaction.type === "in" ? "Cash In" : "Cash Out"}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {transaction.type === "in" ? transaction.source : transaction.paidTo}
                    </span>
                    {transaction.description && (
                      <span className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                        {transaction.description}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                    <span className={`text-base font-bold ${
                      transaction.type === "in" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.type === "in" ? "+" : "-"}{currencySymbol}{round2(transaction.amount).toFixed(2)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-sm ${
                    transaction.balance >= 0 
                      ? "bg-linear-to-r from bg-blue-500 to-blue-600 text-white" 
                      : "bg-linear-to-r from bg-red-500 to-red-600 text-white"
                  }`}>
                    {transaction.balance >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {currencySymbol}{Math.abs(round2(transaction.balance)).toFixed(2)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Summary */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{transactions.length}</span> transactions
          </span>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                Cash In: <span className="font-semibold text-green-700">
                  {transactions.filter(t => t.type === 'in').length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">
                Cash Out: <span className="font-semibold text-red-700">
                  {transactions.filter(t => t.type === 'out').length}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionTable;