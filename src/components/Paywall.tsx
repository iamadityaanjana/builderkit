import React, { useEffect, useState } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient } from '@burnt-labs/abstraxion';
import config from '../config';
import { toast } from 'react-toastify';

interface PaywallProps {
  contentId: string;
  contentPrice: string; // in XION
  children: React.ReactNode;
  contentTitle?: string;
  contentDescription?: string;
}

interface UserMapData {
  purchased?: {
    [key: string]: boolean;
  };
  [key: string]: any;
}

export const Paywall: React.FC<PaywallProps> = ({ 
  contentId, 
  contentPrice, 
  children,
  contentTitle = 'Premium Content',
  contentDescription = 'Unlock this premium content with a one-time payment'
}) => {
  const { data: account } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userMapData, setUserMapData] = useState<UserMapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = account?.bech32Address || '';
  const contractAddress = config.contractAddress;
  const treasuryAddress = config.treasuryAddress;

  // Add CSS keyframes for spinner animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Debug logging
  useEffect(() => {
    console.log('Paywall component mounted with:', {
      contentId,
      contentPrice,
      walletAddress,
      contractAddress,
      treasuryAddress,
      signingClient: !!signingClient
    });
  }, [contentId, contentPrice, walletAddress, contractAddress, treasuryAddress, signingClient]);

  // Check if user has already purchased this content
  useEffect(() => {
    const checkAccess = async () => {
      if (!walletAddress || !signingClient) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Query the contract for this user's data
        const response = await signingClient.queryContractSmart(contractAddress, {
          get_value_by_user: { address: walletAddress }
        });
        
        console.log('User Map data:', response);
        
        // Parse the response if available
        if (response) {
          try {
            const data: UserMapData = JSON.parse(response);
            setUserMapData(data);
            
            // Check if user has access to this content
            if (data.purchased && data.purchased[contentId]) {
              console.log(`User has access to content: ${contentId}`);
              setHasAccess(true);
            } else {
              console.log(`User does not have access to content: ${contentId}`);
              setHasAccess(false);
            }
          } catch (e) {
            console.error('Failed to parse user map data:', e);
            setUserMapData({});
          }
        } else {
          // No user map data found
          setUserMapData({});
        }
      } catch (e) {
        console.error('Error checking access:', e);
        setError('Failed to check access status');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [walletAddress, signingClient, contractAddress, contentId]);

  // Function to unlock content by making payment and updating user map
  const unlockContent = async () => {
    if (!walletAddress || !signingClient) {
      toast.error('Wallet not connected. Please connect first.');
      return;
    }
    
    if (hasAccess) {
      toast.info('You already have access to this content!');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      setShowConfirmation(false);
      
      // Convert price from XION to uxion (micro XION)
      const priceInMicroXion = String(parseFloat(contentPrice) * 1_000_000);
      
      toast.info('Processing payment...');
      
      // Step 1: Pay the required XION amount
      const paymentResult = await signingClient.sendTokens(
        walletAddress,
        treasuryAddress,
        [{ denom: 'uxion', amount: priceInMicroXion }],
        {
          amount: [{ denom: 'uxion', amount: '5000' }],
          gas: '200000'
        }
      );
      
      console.log('Payment transaction:', paymentResult);
      
      // Step 2: Update User Map with contentId
      // First get the existing data
      const currentData = userMapData || {};
      
      // Update the purchased field
      const updatedData: UserMapData = {
        ...currentData,
        purchased: {
          ...(currentData.purchased || {}),
          [contentId]: true
        }
      };
      
      console.log('Updating user map with:', updatedData);
      
      // Execute the update
      const updateResult = await signingClient.execute(
        walletAddress,
        contractAddress,
        {
          update: { value: JSON.stringify(updatedData) }
        },
        'auto'
      );
      
      console.log('User map update transaction:', updateResult);
      
      // Update local state
      setUserMapData(updatedData);
      setHasAccess(true);
      toast.success('Content unlocked successfully!');
    } catch (err) {
      console.error('Payment or update failed:', err);
      setError(`Failed to unlock content: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Payment failed: ${err instanceof Error ? err.message : 'Transaction error'}`);
    } finally {
      setProcessing(false);
    }
  };

  // Show login prompt if wallet not connected
  if (!walletAddress) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            border: '1px solid black',
            width: '320px',
            textAlign: 'center'
          }}
        >
          <p 
            style={{
              color: 'black',
              fontSize: '14px',
              margin: 0
            }}
          >
            Please connect your wallet to access this content.
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            border: '1px solid black',
            width: '320px',
            textAlign: 'center'
          }}
        >
          <div 
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid #e5e7eb',
              borderTopColor: 'black',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite'
            }}
          ></div>
          <p 
            style={{
              color: 'black',
              fontSize: '14px',
              margin: 0
            }}
          >
            Checking access status...
          </p>
        </div>
      </div>
    );
  }

  // If user has access, show the content
  if (hasAccess) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            border: '1px solid black',
            width: '320px',
            textAlign: 'center'
          }}
        >
          <div 
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                width: '24px',
                height: '24px',
                color: '#16a34a'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'black',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}
          >
            Content Unlocked!
          </h2>
          <p 
            style={{
              color: 'black',
              fontSize: '14px',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}
          >
            You now have permanent access
          </p>
          <div style={{ width: '100%' }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Payment confirmation dialog
  if (showConfirmation) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            border: '1px solid black',
            width: '320px',
            textAlign: 'center'
          }}
        >
          <h2 
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'black',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}
          >
            Confirm Payment
          </h2>
          <p 
            style={{
              color: 'black',
              fontSize: '14px',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}
          >
            You are about to purchase:
          </p>
          <p 
            style={{
              color: 'black',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}
          >
            {contentTitle}
          </p>
          <p 
            style={{
              color: 'black',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}
          >
            {contentPrice} XION
          </p>
          
          {error && (
            <div 
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                padding: '8px',
                marginBottom: '16px',
                color: '#dc2626',
                fontSize: '12px'
              }}
            >
              {error}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                flex: 1,
                backgroundColor: '#f3f4f6',
                color: 'black',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setShowConfirmation(false)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
            >
              Cancel
            </button>
            <button
              style={{
                flex: 1,
                backgroundColor: 'black',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.5 : 1,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={unlockContent}
              disabled={processing}
              onMouseEnter={(e) => {
                if (!processing) {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!processing) {
                  e.currentTarget.style.backgroundColor = 'black';
                }
              }}
            >
              {processing ? (
                <>
                  <div 
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      marginRight: '8px',
                      animation: 'spin 1s linear infinite'
                    }}
                  ></div>
                  Processing...
                </>
              ) : (
                'Confirm Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise show the paywall
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid black',
          width: '320px',
          textAlign: 'center'
        }}
      >
        {/* Lock Icon */}
        <div 
          style={{
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}
        >
          <svg 
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{
              width: '48px',
              height: '48px',
              color: 'black'
            }}
          >
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
        
        {/* Content Title */}
        <h2 
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'black',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}
        >
          {contentTitle}
        </h2>
        
        {/* Content Description */}
        <p 
          style={{
            color: 'black',
            fontSize: '14px',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}
        >
          {contentDescription}
        </p>
        
        {/* Status Badge */}
        <div 
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '4px',
            padding: '8px 12px',
            marginBottom: '16px',
            fontSize: '12px',
            fontWeight: '500',
            color: '#92400e'
          }}
        >
          🔒 Content Locked
        </div>
        
        {/* Price */}
        <p 
          style={{
            color: 'black',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}
        >
          One-time payment: {contentPrice} XION
        </p>
        
        {error && (
          <div 
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '4px',
              padding: '8px',
              marginBottom: '16px',
              color: '#dc2626',
              fontSize: '12px'
            }}
          >
            {error}
          </div>
        )}
        
        {/* Unlock Button */}
        <button
          style={{
            display: 'inline-block',
            width: '100%',
            backgroundColor: 'black',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => setShowConfirmation(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'black';
          }}
        >
          Unlock Content
        </button>
        
        <p 
          style={{
            color: '#6b7280',
            fontSize: '12px',
            marginTop: '12px',
            margin: '12px 0 0 0'
          }}
        >
          You'll only pay once for permanent access
        </p>
      </div>
    </div>
  );
};

export default Paywall;
