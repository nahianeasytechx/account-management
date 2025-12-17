import React from "react";
import { FileText, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useTransactions } from "../context/TransactionContext";

const TransactionTable = ({ transactions, accountId = null }) => {
  const { getAccountById } = useTransactions();
  const account = accountId ? getAccountById(accountId) : null;

  const getCurrencySymbol = () => {
    if (!account) return "$";
    const currencySymbols = {
      USD: "$",
      BDT: "৳",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      INR: "₹",
    };
    return currencySymbols[account.currency] || account.currency;
  };

  const currencySymbol = getCurrencySymbol();

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
        <p className="text-gray-500">
          No transactions yet. Add your first transaction above.
        </p>
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
              Currency:{" "}
              <span className="font-medium">
                {account.currency} ({currencySymbol})
              </span>
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {transactions[0]?.type === 'in' ? 'Source' : 'Paid To'}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Attachments
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {transaction.type === "in" ? (
                      <ArrowUpRight className="text-green-500" size={16} />
                    ) : (
                      <ArrowDownRight className="text-red-500" size={16} />
                    )}
                    <span className={`text-sm font-medium ${
                      transaction.type === "in" ? "text-green-600" : "text-red-600"
                    }`}>
                      {transaction.type === "in" ? "Cash In" : "Cash Out"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {transaction.type === "in" ? transaction.source : transaction.paidTo}
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <span className={`font-semibold ${
                    transaction.type === "in" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "in" ? "+" : "-"}
                    {currencySymbol}
                    {transaction.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-right">
                  <span className={`font-semibold ${
                    transaction.balance >= 0
                      ? "text-gray-900"
                      : "text-red-600"
                  }`}>
                    {currencySymbol}
                    {Math.abs(transaction.balance).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  {transaction.attachments?.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <FileText className="text-blue-500" size={14} />
                      <span className="text-xs text-blue-600">
                        {transaction.attachments.length} file(s)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">None</span>
                  )}
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