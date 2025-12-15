import React from 'react';
import { Menu } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';

const Navbar = ({ onMenuClick }) => {
  const { currentUser } = useTransactions();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 fixed top-0 left-0 right-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="cursor-pointer lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Ledger Manager</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.role}</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {currentUser.name.charAt(0)}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;