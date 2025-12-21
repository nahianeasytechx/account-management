// pages/Home.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import LedgerDetails from '../components/LedgerDetails';

const Home = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const { currentUser, logout } = useAuth();

  // Add keyboard shortcut to close sidebar (Escape key)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
<Navbar 
  onMenuClick={() => {
    console.log('Menu button clicked, setting sidebarOpen to true');
    setSidebarOpen(true);
  }} 
  userName={currentUser.name}
  onLogout={logout}
/>
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        setCurrentView={setCurrentView}
        userName={currentUser.name}
        userEmail={currentUser.email}
      />
      
      <main className="pt-[57px] lg:pl-64 container mx-auto min-h-screen transition-all duration-200">
        <div className="p-4 md:p-6">
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`cursor-pointer px-4 py-2 rounded-lg transition-all duration-200 ${
                currentView === 'dashboard' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('ledger')}
              className={`cursor-pointer px-4 py-2 rounded-lg transition-all duration-200 ${
                currentView === 'ledger' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow'
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