// components/MainLayout.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Outlet } from 'react-router-dom';

// Beautiful Preloader Component
const LedgerPreloader = () => {
  const [dots, setDots] = useState('');
  const [loadingText, setLoadingText] = useState('Initializing');

  useEffect(() => {
    // Animated dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);

    // Text progression
    const texts = [
      'Initializing',
      'Loading accounts',
      'Fetching transactions',
      'Almost ready'
    ];
    let textIndex = 0;
    
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % texts.length;
      setLoadingText(texts[textIndex]);
    }, 500);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(textInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        {/* Animated Icon Container */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Outer rotating ring */}
          <div className="absolute w-32 h-32 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
          
          {/* Middle pulsing ring */}
          <div className="absolute w-24 h-24 rounded-full bg-blue-100 animate-pulse"></div>
          
          {/* Inner icon */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <svg 
              className="w-8 h-8 text-white animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
              />
            </svg>
          </div>
        </div>

        {/* Loading Text with animation */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-gray-800 h-8 flex items-center justify-center">
            <span className="inline-block min-w-[200px] text-center">
              {loadingText}{dots}
            </span>
          </h2>
          <p className="text-gray-600 max-w-md mx-auto px-4">
            Preparing your financial dashboard
          </p>
          
          {/* Progress Bar */}
          <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto mt-6">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-[loading_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>

        {/* Bouncing Dots */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>

      {/* Custom animation for progress bar */}
      <style>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const { currentUser } = useAuth();
  const { loading: accountsLoading } = useTransactions();

  // Wait for both user AND accounts to load, with minimum display time
  useEffect(() => {
    if (currentUser && !accountsLoading) {
      // Add a minimum delay so preloader doesn't flash too quickly
      const timer = setTimeout(() => {
        setShowPreloader(false);
      }, 800); // Minimum 0.8 seconds display

      return () => clearTimeout(timer);
    } else {
      setShowPreloader(true);
    }
  }, [currentUser, accountsLoading]);

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

  // Show preloader if no user, accounts are loading, or during minimum display time
  if (!currentUser || accountsLoading || showPreloader) {
    return <LedgerPreloader />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onMenuClick={() => setSidebarOpen(true)} 
      />
      
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
      />
      
      <Outlet />
    </div>
  );
};

export default MainLayout;