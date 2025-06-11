import React from 'react';
import { ReferralFlow } from '../components/ReferralFlow';
import { useAbstraxionAccount, useAbstraxionSigningClient } from '@burnt-labs/abstraxion';

const ReferralFlowPage: React.FC = () => {
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center' as const,
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#000000',
            margin: '0 0 8px'
          }}>Referral Program</h1>
          <p style={{
            fontSize: '14px',
            color: '#666666',
            margin: '0'
          }}>Invite friends to XION and earn rewards</p>
        </div>
        
        {/* Main Referral Flow Component */}
        <div style={{ marginBottom: '32px' }}>
          <ReferralFlow rewardAmount={5} />
        </div>
        
        {/* Connection Status (Minimal) */}
        {account && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center' as const
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: account && client ? '#22c55e' : '#ef4444',
                marginRight: '8px'
              }}></div>
              <span style={{
                fontSize: '12px',
                color: '#666666'
              }}>
                {account && client ? 'Connected & Ready' : 'Connection Issues'}
              </span>
            </div>
          </div>
        )}
        
        {/* Simple How It Works */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center' as const
        }}>
          <h2 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#000000',
            margin: '0 0 12px'
          }}>How It Works</h2>
          <p style={{
            fontSize: '12px',
            color: '#666666',
            lineHeight: '1.5',
            margin: '0'
          }}>
            Generate your referral code, share it with friends, and earn 5 XION tokens for each person who signs up using your code. All referral data is stored securely on the XION blockchain.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReferralFlowPage;
