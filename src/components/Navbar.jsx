import React, { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, User, Settings, Shield, Bell, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const { formatFileSize, calculateTotalStorageUsed, TOTAL_STORAGE_LIMIT, getTotals } = useTransactions();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [storagePercentage, setStoragePercentage] = useState(0);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  // Calculate storage usage
  useEffect(() => {
    const used = calculateTotalStorageUsed();
    const percentage = (used / TOTAL_STORAGE_LIMIT) * 100;
    setStoragePercentage(percentage);
  }, [calculateTotalStorageUsed, TOTAL_STORAGE_LIMIT]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const totals = getTotals();
  const usedStorage = calculateTotalStorageUsed();
  const availableStorage = TOTAL_STORAGE_LIMIT - usedStorage;

  // Mock notifications
  const notifications = [
    { id: 1, title: 'Storage Warning', message: `You've used ${storagePercentage.toFixed(1)}% of storage`, type: 'warning', time: '2 hours ago' },
    { id: 2, title: 'New Transaction', message: 'Added $500 to Main Account', type: 'info', time: 'Yesterday' },
    { id: 3, title: 'Backup Available', message: 'Weekly backup completed', type: 'success', time: '3 days ago' },
  ];

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 px-4 py-3 fixed top-0 left-0 right-0 z-50 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer text-gray-300"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <h1 className="text-xl font-bold text-white">Ledger Accounts</h1>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30 hidden sm:inline-block">
              {currentUser?.name?.split(' ')[0] || 'User'}'s Workspace
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Balance Summary - Responsive */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-400">Total Balance</p>
                <p className="text-sm font-semibold text-green-400">${totals.balance.toFixed(2)}</p>
              </div>
              <div className="h-6 w-px bg-gray-600" />
              <div className="text-right">
                <p className="text-xs text-gray-400">Income</p>
                <p className="text-sm font-semibold text-blue-300">${totals.totalIn.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Expenses</p>
                <p className="text-sm font-semibold text-red-300">${totals.totalOut.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Mobile Balance Summary */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="text-sm font-semibold text-green-400">${totals.balance.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              aria-label="User menu"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-white">{currentUser?.name?.split(' ')[0] || 'User'}</p>
                <p className="text-xs text-gray-300 truncate max-w-[100px]">{currentUser?.email?.split('@')[0]}</p>
              </div>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-md">
                      {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{currentUser?.name}</p>
                      <p className="text-sm text-gray-300 truncate">{currentUser?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Member since {new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/profile');
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-750 rounded-lg flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/settings');
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-750 rounded-lg flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/security');
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-750 rounded-lg flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <Shield size={16} />
                    <span>Security</span>
                  </button>

                  {/* Storage info in menu */}
                  <div className="px-3 py-2 mt-2 border-t border-gray-700">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Storage</span>
                      <span className="text-gray-300">{formatFileSize(availableStorage)} available</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${getStorageColor(storagePercentage)}`}
                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg flex items-center gap-3 cursor-pointer transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign out</span>
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