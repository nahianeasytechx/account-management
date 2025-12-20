import React, { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, User, Settings, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const { transactions, getTotals, formatFileSize } = useTransactions();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Only read totals from state, do NOT call any fetch functions
  const totals = getTotals ? getTotals() : { totalIn: 0, totalOut: 0, balance: 0 };

  // Simple storage calculation based on a fixed limit
  const TOTAL_STORAGE_LIMIT = 1024 * 1024 * 500; // 500MB
  const usedStorage = transactions.reduce((sum, txn) => sum + (txn.size || 0), 0);
  const availableStorage = TOTAL_STORAGE_LIMIT - usedStorage;
  const storagePercentage = Math.min((usedStorage / TOTAL_STORAGE_LIMIT) * 100, 100);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/login');
  };

  const getStorageColor = (percentage) => {
    if (percentage < 70) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-4 py-3 fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-gray-700 rounded-lg cursor-pointer text-gray-300">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <h1 className="text-xl font-bold text-white">Ledger Accounts</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-white">
            <div>Total: ${totals.balance.toFixed(2)}</div>
            <div>Income: ${totals.totalIn.toFixed(2)}</div>
            <div>Expenses: ${totals.totalOut.toFixed(2)}</div>
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded-lg cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-gray-700">
                  <p className="font-medium text-white">{currentUser?.name}</p>
                  <p className="text-sm text-gray-300">{currentUser?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-750 rounded-lg flex items-center gap-3"
                  >
                    <User size={16} /> My Profile
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-750 rounded-lg flex items-center gap-3"
                  >
                    <Settings size={16} /> Settings
                  </button>

                  {/* Storage */}
                  <div className="px-3 py-2 mt-2 border-t border-gray-700">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Storage</span>
                      <span className="text-gray-300">{formatFileSize(availableStorage)} available</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${getStorageColor(storagePercentage)}`} style={{ width: `${storagePercentage}%` }} />
                    </div>
                  </div>

                  <div className="border-t border-gray-700 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center gap-3"
                    >
                      <LogOut size={16} /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
