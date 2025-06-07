import React from 'react';
import { useAbstraxionAccount, useModal } from '@burnt-labs/abstraxion';
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import XionLogo from '../assets/Xion-Logo-Black.svg';

export const XionLogin: React.FC = () => {
  const { data: account, logout, isConnected } = useAbstraxionAccount();
  const [, setShowModal] = useModal();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        
        {/* Logo & Title Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <img src={XionLogo} alt="XION" className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Create an account
          </h1>
          <p className="text-gray-500 text-sm text-center">
            Please enter your details to create an account.
          </p>
        </div>
        
        {!isConnected ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Continue with XION
            </button>
            
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <span className="font-medium text-gray-800 underline cursor-pointer hover:text-gray-600">
                Sign in
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Connected Wallet</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              
              <p className="font-mono text-xs break-all bg-white p-3 rounded-md border border-gray-200 text-gray-600">
                {account?.bech32Address}
              </p>
              
              <div className="mt-3 flex items-center gap-2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm">Gasless transactions enabled</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" />
              </svg>
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


  

  