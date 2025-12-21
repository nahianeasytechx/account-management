import React, { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, User, Settings, Shield, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const { getTotals } = useTransactions();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
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

  const totals = getTotals();

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
                <p className="text-sm font-semibold text-green-400">৳{totals.balance.toFixed(2)}</p>
              </div>
              <div className="h-6 w-px bg-gray-600" />
              <div className="text-right">
                <p className="text-xs text-gray-400">Income</p>
                <p className="text-sm font-semibold text-blue-300">৳{totals.totalIn.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Expenses</p>
                <p className="text-sm font-semibold text-red-300">৳{totals.totalOut.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Mobile Balance Summary */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="text-sm font-semibold text-green-400">৳{totals.balance.toFixed(2)}</p>
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

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/help');
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-750 rounded-lg flex items-center gap-3 cursor-pointer transition-colors"
                  >
                    <HelpCircle size={16} />
                    <span>Help & Support</span>
                  </button>
                  
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