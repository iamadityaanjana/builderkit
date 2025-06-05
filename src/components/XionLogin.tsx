import React, { useState } from 'react';
import { useAbstraxionAccount, useModal } from '@burnt-labs/abstraxion';
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";



export const XionLogin: React.FC = () => {
  const { data: account, login, logout, isConnected } = useAbstraxionAccount();
  const [, setShowModal] = useModal();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700">
        
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-black border-2 border-white rounded-full flex items-center justify-center mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">
            XION Authentication
          </h1>
          <p className="text-white text-sm mt-2 text-center">
            {!isConnected ? 'Connect to access your XION smart wallet' : 'Your XION smart wallet is connected'}
          </p>
        </div>
        
        {!isConnected ? (
          <div className="space-y-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white">Secure & Gasless</h3>
              </div>
              <p className="text-xs text-slate-400">
                Enjoy a Web2-like experience with full Web3 capabilities and no gas fees
              </p>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-black text-white py-3.5 px-4 rounded-xl font-medium border border-white transition-all duration-300 shadow-md hover:shadow-lg hover:bg-slate-900 active:translate-y-[1px]"
            >
              Connect with XION
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-white">
            <div className="p-4 rounded-xl bg-black border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Wallet Address</h3>
                <div className="w-6 h-6 bg-black border border-gray-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              </div>
              
              <p className="font-mono text-xs break-all bg-slate-900 p-3 rounded-lg border border-slate-700 text-white">
                {account?.bech32Address}
              </p>
              
              <div className="mt-3 flex items-center gap-2">
                <div className="w-10 h-10 bg-black border border-gray-600 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-white">Gasless transactions enabled</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full bg-black hover:bg-slate-900  py-3 px-4 rounded-xl font-medium border border-white transition-colors duration-300 flex items-center justify-center gap-2 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


  

  