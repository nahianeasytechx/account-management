import React, { useState, useMemo, useRef } from "react";
import { X, Download, Printer, Calendar } from "lucide-react";

const PrintStatementModal = ({
  isOpen,
  onClose,
  transactions,
  accountName,
  accountId,
}) => {
  const [statementType, setStatementType] = useState("all"); // all, in, out
  const [filterMode, setFilterMode] = useState("all"); // all, dateRange, monthly
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const printRef = useRef();

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  // Filter transactions based on selected criteria
  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) {
      console.warn("No transactions provided to PrintStatementModal");
      return [];
    }

    let filtered = transactions.filter((t) => {
      // Filter by account if not "all accounts"
      if (accountId !== "all" && t.accountId !== accountId) {
        return false;
      }
      return true;
    });

    // Filter by transaction type
    if (statementType !== "all") {
      filtered = filtered.filter((t) => t.type === statementType);
    }

    // Filter by date mode
    if (filterMode === "dateRange" && (dateFrom || dateTo)) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        transactionDate.setHours(0, 0, 0, 0);

        let matchesFrom = true;
        let matchesTo = true;

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          matchesFrom = transactionDate >= fromDate;
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesTo = transactionDate <= toDate;
        }

        return matchesFrom && matchesTo;
      });
    } else if (filterMode === "monthly" && selectedMonth) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.date);
        const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, "0")}`;
        return transactionMonth === selectedMonth;
      });
    }

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [
    transactions,
    accountId,
    statementType,
    filterMode,
    dateFrom,
    dateTo,
    selectedMonth,
  ]);

  // Calculate summary
  const summary = useMemo(() => {
    const totalIn = filteredTransactions
      .filter((t) => t.type === "in")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    const totalOut = filteredTransactions
      .filter((t) => t.type === "out")
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return {
      totalIn,
      totalOut,
      netBalance: totalIn - totalOut,
      inCount: filteredTransactions.filter((t) => t.type === "in").length,
      outCount: filteredTransactions.filter((t) => t.type === "out").length,
      totalCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get statement title
  const getStatementTitle = () => {
    let title = "Transaction Statement";

    if (statementType === "in") title = "Cash In Statement";
    else if (statementType === "out") title = "Cash Out Statement";

    if (filterMode === "monthly" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString(
        "en-US",
        { month: "long", year: "numeric" },
      );
      title += ` - ${monthName}`;
    } else if (filterMode === "dateRange" && (dateFrom || dateTo)) {
      if (dateFrom && dateTo) {
        title += ` (${formatDate(dateFrom)} - ${formatDate(dateTo)})`;
      } else if (dateFrom) {
        title += ` (From ${formatDate(dateFrom)})`;
      } else {
        title += ` (Until ${formatDate(dateTo)})`;
      }
    }

    return title;
  };

  // Get period text
  const getPeriodText = () => {
    if (filterMode === "monthly" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      return new Date(year, parseInt(month) - 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } else if (filterMode === "dateRange" && (dateFrom || dateTo)) {
      if (dateFrom && dateTo) {
        return `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;
      } else if (dateFrom) {
        return `From ${formatDate(dateFrom)}`;
      } else {
        return `Until ${formatDate(dateTo)}`;
      }
    }
    return "All Time";
  };

  // Generate PDF
  const generatePDF = async () => {
    try {
      // Dynamic import of jsPDF
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text(getStatementTitle(), pageWidth / 2, 20, { align: "center" });

      // Account name
      doc.setFontSize(12);
      doc.setFont(undefined, "normal");
      doc.text(`Account: ${accountName || "All Accounts"}`, pageWidth / 2, 28, {
        align: "center",
      });

      // Date generated
      doc.setFontSize(10);
      doc.text(
        `Generated: ${new Date().toLocaleDateString("en-GB")}`,
        pageWidth / 2,
        34,
        { align: "center" },
      );

      // Summary box
      doc.setFontSize(10);
      doc.setFont(undefined, "bold");
      let yPos = 45;

      if (statementType === "all" || statementType === "in") {
        doc.setTextColor(0, 128, 0);
        doc.text(
          `Total Cash In: ৳${summary.totalIn.toFixed(2)} (${summary.inCount} transactions)`,
          14,
          yPos,
        );
        yPos += 6;
      }

      if (statementType === "all" || statementType === "out") {
        doc.setTextColor(220, 38, 38);
        doc.text(
          `Total Cash Out: ৳${summary.totalOut.toFixed(2)} (${summary.outCount} transactions)`,
          14,
          yPos,
        );
        yPos += 6;
      }

      if (statementType === "all") {
        doc.setTextColor(0, 0, 0);
        doc.text(`Net Balance: ৳${summary.netBalance.toFixed(2)}`, 14, yPos);
        yPos += 6;
      }

      doc.setTextColor(0, 0, 0);
      doc.text(`Total Transactions: ${summary.totalCount}`, 14, yPos);
      yPos += 10;

      // Table
      const tableData = filteredTransactions.map((t) => [
        formatDate(t.date),
        t.type === "in" ? t.source || "N/A" : t.paidTo || "N/A",
        t.description || "N/A",
        accountId === "all" ? t.accountName || "N/A" : "",
        t.type === "in" ? `৳${parseFloat(t.amount).toFixed(2)}` : "",
        t.type === "out" ? `৳${parseFloat(t.amount).toFixed(2)}` : "",
      ]);

      const columns =
        accountId === "all"
          ? [
              "Date",
              statementType === "in"
                ? "Source"
                : statementType === "out"
                  ? "Paid To"
                  : "Source/Paid To",
              "Description",
              "Account",
              "Cash In",
              "Cash Out",
            ]
          : [
              "Date",
              statementType === "in"
                ? "Source"
                : statementType === "out"
                  ? "Paid To"
                  : "Source/Paid To",
              "Description",
              "Cash In",
              "Cash Out",
            ];

      // Filter out empty columns based on statement type
      const filteredColumns = columns.filter((col, index) => {
        if (statementType === "in" && col === "Cash Out") return false;
        if (statementType === "out" && col === "Cash In") return false;
        return true;
      });

      const filteredTableData = tableData.map((row) => {
        return row.filter((cell, index) => {
          if (statementType === "in" && columns[index] === "Cash Out")
            return false;
          if (statementType === "out" && columns[index] === "Cash In")
            return false;
          if (accountId !== "all" && columns[index] === "Account") return false;
          return true;
        });
      });

      doc.autoTable({
        head: [filteredColumns],
        body: filteredTableData,
        startY: yPos,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles:
          accountId === "all"
            ? {
                0: { cellWidth: 22 },
                1: { cellWidth: 30 },
                2: { cellWidth: 50 },
                3: { cellWidth: 30 },
                4: { cellWidth: 25, halign: "right" },
                5: { cellWidth: 25, halign: "right" },
              }
            : {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 65 },
                3: { cellWidth: 30, halign: "right" },
                4: { cellWidth: 30, halign: "right" },
              },
        didDrawPage: (data) => {
          // Footer
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          doc.setFontSize(8);
          doc.text(
            `Page ${currentPage} of ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" },
          );
        },
      });

      // Save PDF
      const fileName = `${accountName || "All-Accounts"}_${statementType}_statement_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        "Failed to generate PDF. Please make sure jspdf is installed: npm install jspdf jspdf-autotable",
      );
    }
  };

  // Print statement

// Print statement - simplest solution
// Print statement - with Tailwind CSS support
const handlePrint = () => {
  const printContent = printRef.current.cloneNode(true);

  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map(tag => tag.outerHTML)
    .join('');

  // 🔥 OPEN IN NEW TAB (no window features)
  const printWindow = window.open('', '_blank');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Statement</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${styles}
        <style>
          @media print {
            body {
              margin: 0;
              padding: 20px;
              font-size: 12px;
            }
            @page {
              margin: 15mm;
              size: A4;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
          }
        </style>
      </head>
      <body class="bg-white">
        <div class="print-content p-4">
          ${printContent.innerHTML}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.print();
  };
};

  // Early return after all hooks
  if (!isOpen) return null;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-800">
              Print Transaction Statement
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 space-y-4 bg-gray-50">
            {/* Statement Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statement Type
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setStatementType("all")}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    statementType === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Transactions
                </button>
                <button
                  onClick={() => setStatementType("in")}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    statementType === "in"
                      ? "bg-green-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Cash In Only
                </button>
                <button
                  onClick={() => setStatementType("out")}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    statementType === "out"
                      ? "bg-red-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Cash Out Only
                </button>
              </div>
            </div>

            {/* Date Filter Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Filter
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    filterMode === "all"
                      ? "bg-gray-800 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => {
                    setFilterMode("monthly");
                    if (!selectedMonth) setSelectedMonth(getCurrentMonth());
                  }}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    filterMode === "monthly"
                      ? "bg-gray-800 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setFilterMode("dateRange")}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    filterMode === "dateRange"
                      ? "bg-gray-800 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Date Range
                </button>
              </div>
            </div>

            {/* Monthly Filter */}
            {filterMode === "monthly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Date Range Filter */}
            {filterMode === "dateRange" && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className=" print-content" ref={printRef}>
              {/* Professional Bank Statement Header */}
              <div className="border-b-4 border-gray-900 pb-6 mb-6">
                {/* Bank/Company Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
                      CASH BOOK
                    </h1>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">
                      Account Statement
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                      Statement Date
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Account Information Box */}
                <div className="bg-gray-50 border border-gray-300 rounded p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Account Name
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {accountName || "All Accounts"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Statement Period
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {getPeriodText()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Statement Type
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {statementType === "all"
                          ? "Complete Statement"
                          : statementType === "in"
                            ? "Credit Only"
                            : "Debit Only"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Total Transactions
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {summary.totalCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="mb-6 bg-linear-to-r from-gray-50 to-gray-100 border-l-4 border-blue-600 p-5">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Account Summary
                </h4>
                <div className="grid grid-cols-4 gap-4">
                  {(statementType === "all" || statementType === "in") && (
                    <div className="bg-white p-3 rounded border border-gray-200 w-full">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Total Credits
                      </p>
                      <p className="text-lg font-bold text-green-700">
                        ৳
                        {summary.totalIn.toLocaleString("en-BD", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {summary.inCount} transaction
                        {summary.inCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                  {(statementType === "all" || statementType === "out") && (
                    <div className="bg-white p-3 rounded border border-gray-200 w-full">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Total Debits
                      </p>
                      <p className="text-lg font-bold text-red-700">
                        ৳
                        {summary.totalOut.toLocaleString("en-BD", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {summary.outCount} transaction
                        {summary.outCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                  {statementType === "all" && (
                    <>
                      <div className="bg-white p-3 rounded border border-gray-200 w-full">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Net Balance
                        </p>
                        <p
                          className={`text-lg font-bold ${summary.netBalance >= 0 ? "text-gray-900" : "text-red-700"}`}
                        >
                          ৳
                          {summary.netBalance.toLocaleString("en-BD", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {summary.netBalance >= 0 ? "Positive" : "Negative"}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 w-full">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                          Total Transactions
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {summary.totalCount}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">All types</p>
                      </div>
                    </>
                  )}
                  {statementType === "in" && (
                    <div className="bg-white p-3 rounded border border-gray-200 w-full">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Total Transactions
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {summary.totalCount}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Credit only</p>
                    </div>
                  )}
                  {statementType === "out" && (
                    <div className="bg-white p-3 rounded border border-gray-200 w-full">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                        Total Transactions
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {summary.totalCount}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Debit only</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transactions Table */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b-2 border-gray-300">
                  Transaction Details
                </h4>

                {filteredTransactions.length > 0 ? (
                  <div className="border border-gray-300">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800 text-white">
                          <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">
                            {statementType === "in"
                              ? "Source"
                              : statementType === "out"
                                ? "Paid To"
                                : "Particulars"}
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">
                            Description
                          </th>
                          {accountId === "all" && (
                            <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider">
                              Account
                            </th>
                          )}
                          {statementType !== "out" && (
                            <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider">
                              Credit (৳)
                            </th>
                          )}
                          {statementType !== "in" && (
                            <th className="px-3 py-3 text-right text-xs font-bold uppercase tracking-wider">
                              Debit (৳)
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction, index) => (
                          <tr
                            key={transaction.id}
                            className={`border-b border-gray-200 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}
                          >
                            <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap font-mono text-xs">
                              {formatDate(transaction.date)}
                            </td>
                            <td className="px-3 py-2.5 text-gray-900 font-medium">
                              {transaction.type === "in"
                                ? transaction.source || "N/A"
                                : transaction.paidTo || "N/A"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600">
                              {transaction.description || "-"}
                            </td>
                            {accountId === "all" && (
                              <td className="px-3 py-2.5 text-gray-700">
                                {transaction.accountName || "N/A"}
                              </td>
                            )}
                            {statementType !== "out" && (
                              <td className="px-3 py-2.5 text-right font-mono">
                                {transaction.type === "in" ? (
                                  <span className="text-green-700 font-semibold">
                                    {parseFloat(
                                      transaction.amount,
                                    ).toLocaleString("en-BD", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            )}
                            {statementType !== "in" && (
                              <td className="px-3 py-2.5 text-right font-mono">
                                {transaction.type === "out" ? (
                                  <span className="text-red-700 font-semibold">
                                    {parseFloat(
                                      transaction.amount,
                                    ).toLocaleString("en-BD", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}

                        {/* Totals Row */}
                        <tr className="bg-gray-800 text-white font-bold">
                          <td className="px-3 py-3" colSpan={2}></td>
                          {accountId === "all" && (
                            <td className="px-3 py-3"></td>
                          )}
                          <td className="px-3 py-3 text-right text-xs uppercase tracking-wider">
                            Total:
                          </td>
                          {statementType !== "out" && (
                            <td className="px-3 py-3 text-right font-mono text-base">
                              {summary.totalIn.toLocaleString("en-BD", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          )}
                          {statementType !== "in" && (
                            <td className="px-3 py-3 text-right font-mono text-base">
                              {summary.totalOut.toLocaleString("en-BD", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-300 rounded">
                    <p className="text-gray-500 text-sm">
                      No transactions found for the selected criteria.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Notice */}
              <div className="mt-8 pt-4 border-t border-gray-300">
                <p className="text-xs text-gray-500 text-center">
                  This is a computer-generated statement and does not require a
                  signature.
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  For any discrepancies, please contact your account manager.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} />
              Print
            </button>
            {/* <button
              onClick={generatePDF}
              disabled={filteredTransactions.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Download PDF
            </button> */}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except print content */
          body * {
            visibility: hidden;
          }
          
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          .print-content{
            position: fixed !important;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
          }
          
          /* Force black and white colors */
          .print-content * {
            color: black !important;
            background-color: white !important;
            border-color: black !important;
          }
          
          /* Table specific styling for print */
          .print-content table {
            border: 2px solid black !important;
            border-collapse: collapse !important;
            page-break-inside: auto;
          }
          
          .print-content table th,
          .print-content table td {
            border: 1px solid black !important;
            color: black !important;
            background-color: white !important;
          }
          
          .print-content table thead tr {
            background-color: black !important;
          }
          
          .print-content table thead tr th {
            color: white !important;
            background-color: black !important;
            border: 1px solid black !important;
          }
          
          .print-content table tbody tr:last-child {
            background-color: black !important;
          }
          
          .print-content table tbody tr:last-child td {
            color: white !important;
            background-color: black !important;
            font-weight: bold !important;
          }
          
          /* Override gradient backgrounds */
          .print-content [class*="bg-gradient"],
          .print-content [class*="bg-gray"],
          .print-content [class*="bg-blue"] {
            background: white !important;
          }
          
          /* Borders */
          .print-content [class*="border-blue"],
          .print-content [class*="border-gray"],
          .print-content [class*="border-l"] {
            border-color: black !important;
          }
          
          /* Print-specific page settings */
          @page {
            margin: 15mm;
            size: A4;
          }
          
          .print-content tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          .print-content thead {
            display: table-header-group;
          }
          
          .print-content tfoot {
            display: table-footer-group;
          }
        }
      `}</style>
    </>
  );
};

export default PrintStatementModal;
