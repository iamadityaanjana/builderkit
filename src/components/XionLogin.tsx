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
      className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '24px'
      }}
    >
      <div 
        className="w-full max-w-sm bg-white p-6 rounded-xl border border-black shadow-sm"
        style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid black',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        
        {/* Logo & Title Section */}
        <div 
          className="flex flex-col items-center mb-8"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '32px'
          }}
        >
          <img 
            src={XionLogo} 
            alt="XION" 
            className="w-16 h-8 mb-4"
            style={{
              width: '120px',
              height: '60px',
              marginBottom: '16px'
            }}
          />
          <h1 
            className="text-xl font-bold text-black text-center leading-tight"
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'black',
              textAlign: 'center',
              lineHeight: '1.3',
              margin: 0
            }}
          >
            Welcome to XionBuilder Kit
          </h1>
        </div>
        
        {!isConnected ? (
          <div 
            className="space-y-6"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-black text-white py-3 px-6 rounded-lg text-base font-medium transition-all duration-200 hover:bg-gray-800"
              style={{
                width: '100%',
                backgroundColor: 'black',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'black';
              }}
            >
              Login with Xion
            </button>
            
            <p 
              className="text-center text-gray-500 text-xs"
              style={{
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '12px',
                margin: 0,
                lineHeight: '1.4'
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
          <div 
            className="space-y-4"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div 
              className="p-4 rounded-lg bg-gray-50 border border-gray-200"
              style={{
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb'
              }}
            >
              <div 
                className="flex items-center justify-between mb-3"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <h3 
                  className="text-sm font-medium text-gray-700"
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    margin: 0
                  }}
                >
                  Connected Wallet
                </h3>
                <div 
                  className="w-2 h-2 bg-green-500 rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#10b981',
                    borderRadius: '50%'
                  }}
                ></div>
              </div>
              
              <p 
                className="font-mono text-xs break-all bg-white p-2 rounded border border-gray-200 text-gray-600"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  wordBreak: 'break-all',
                  backgroundColor: 'white',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  color: '#6b7280',
                  margin: 0
                }}
              >
                {account?.bech32Address}
              </p>
              
              <div 
                className="mt-2 flex items-center gap-2 text-gray-600"
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#6b7280'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p 
                  className="text-xs"
                  style={{
                    fontSize: '12px',
                    margin: 0
                  }}
                >
                  Gasless transactions enabled
                </p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 flex items-center justify-center gap-2"
              style={{
                width: '100%',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-3 h-3">
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




