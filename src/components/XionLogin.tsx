import React from 'react';
import { useAbstraxionAccount, useModal } from '@burnt-labs/abstraxion';
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import XionLogo from '../assets/Xion-Logo-Black.svg';

export const XionLogin: React.FC = () => {
  const { data: account, logout, isConnected } = useAbstraxionAccount();
  const [, setShowModal] = useModal();

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-white p-4"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'white',
        padding: '16px'
      }}
    >
      <div 
        className="w-full max-w-lg bg-white p-12 rounded-3xl border-4 border-black"
        style={{
          width: '100%',
          maxWidth: '32rem',
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '24px',
          border: '4px solid black'
        }}
      >
        
        {/* Logo & Title Section */}
        <div 
          className="flex flex-col items-center mb-12"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '48px'
          }}
        >
          <img 
            src={XionLogo} 
            alt="XION" 
            className="w-20 h-20 mb-8"
            style={{
              width: '160px',
              height: '80px',
              marginBottom: '10px'
            }}
          />
          <h1 
            className="text-4xl font-bold text-black text-center leading-tight"
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'black',
              textAlign: 'center',
              lineHeight: '1.25',
              margin: 0
            }}
          >
            Welcome to XionBuilder Kit
          </h1>
        </div>
        
        {!isConnected ? (
          <div 
            className="space-y-8"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '32px'
            }}
          >
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-black text-white py-4 px-8 rounded-xl text-xl font-medium transition-all duration-200 hover:bg-gray-900"
              style={{
                width: '100%',
                backgroundColor: 'black',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '20px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Login with Xion
            </button>
            
            <p 
              className="text-center text-gray-600 text-base"
              style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '16px',
                margin: 0
              }}
            >
              By using this service, you consent to<br />
              our <span 
                className="underline cursor-pointer"
                style={{
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >Terms and Conditions</span>.
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




