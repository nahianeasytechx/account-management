import React from 'react';
import { Wallet } from 'lucide-react';

const PreLoader = ({ isLoggedIn = false }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        {/* Outer rotating ring - Blue */}
        <div className="absolute w-32 h-32 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
        
        {/* Middle rotating ring - Purple */}
        <div className="absolute w-28 h-28 border-4 border-transparent border-t-purple-500 border-l-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        
        {/* Inner pulsing circle - Gradient blue to purple */}
        <div className="absolute w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse flex items-center justify-center shadow-2xl">
          <Wallet className="text-white" size={40} strokeWidth={2.5} />
        </div>
        
        {/* Glow effect */}
        <div className="absolute w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
      </div>
    </div>
  );
};

export default PreLoader;