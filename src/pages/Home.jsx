import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import LedgerDetails from '../components/LedgerDetails';

const Home = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-[57px] lg:pl-64 min-h-screen">
        <div className="p-6">
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`cursor-pointer px-4 py-2 rounded-lg transition-colors ${
                currentView === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('ledger')}
              className={`cursor-pointer px-4 py-2 rounded-lg transition-colors ${
                currentView === 'ledger' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Ledger Details
            </button>
          </div>
          
          {currentView === 'dashboard' ? <Dashboard /> : <LedgerDetails />}
        </div>
      </main>
    </div>
  );
};

export default Home;