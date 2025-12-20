import React from "react";
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Trash2,
  Edit2,
  Eye,
  Download,
  Paperclip
} from "lucide-react";
import { useAccounts } from "../context/AccountsContext";

const TransactionTable = ({ transactions, accountId, onDelete }) => {
  const { getAccountById } = useAccounts();
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
    return currencySymbols[account.currency_code || account.currency] || account.currency_symbol || "$";
  };

  const currencySymbol = getCurrencySymbol();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center border border-gray-200">
        <p className="text-gray-500">No transactions yet. Add your first transaction above.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          {account && (
            <span className="text-sm text-gray-600">
              Currency:{" "}
              <span className="font-medium">
                {account.currency_code || account.currency} ({currencySymbol})
              </span>
            </span>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source/Paid To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attachments
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(transaction.transaction_date || transaction.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                  {transaction.type === "in" 
                    ? (transaction.source || 'N/A')
                    : (transaction.paid_to || transaction.paidTo || 'N/A')
                  }
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {transaction.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={`font-semibold ${
                    transaction.type === "in" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "in" ? "+" : "-"}
                    {currencySymbol}
                    {parseFloat(transaction.amount || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={`font-semibold ${
                    (transaction.balance || 0) >= 0
                      ? "text-gray-900"
                      : "text-red-600"
                  }`}>
                    {currencySymbol}
                    {Math.abs(transaction.balance || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {transaction.attachments?.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <Paperclip className="text-blue-500" size={14} />
                      <span className="text-xs text-blue-600">
                        {transaction.attachments.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDelete && onDelete(transaction.id)}
                      className="p-1 hover:bg-red-50 rounded text-red-600 cursor-pointer"
                      title="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className="p-1 hover:bg-blue-50 rounded text-blue-600 cursor-pointer"
                      title="Edit transaction"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-100 rounded text-gray-600 cursor-pointer"
                      title="View details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
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