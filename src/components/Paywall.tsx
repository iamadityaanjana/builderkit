import React, { useEffect, useState } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient } from '@burnt-labs/abstraxion';
import config from '../config';
import { toast } from 'react-toastify';

interface PaywallProps {
  contentId: string;
  price: string; // in XION
  children: React.ReactNode;
  title?: string;
  description?: string;
}

interface UserMapData {
  purchased?: {
    [key: string]: boolean;
  };
  [key: string]: any;
}

export const Paywall: React.FC<PaywallProps> = ({ 
  contentId, 
  price, 
  children,
  title = 'Premium Content',
  description = 'Unlock this premium content with a one-time payment'
}) => {
  const { data: account } = useAbstraxionAccount();
  const { client: signingClient } = useAbstraxionSigningClient();
  
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [userMapData, setUserMapData] = useState<UserMapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = account?.bech32Address || '';
  const contractAddress = config.contractAddress;
  const treasuryAddress = config.treasuryAddress;
  
  // Debug logging
  useEffect(() => {
    console.log('Paywall component mounted with:', {
      contentId,
      price,
      walletAddress,
      contractAddress,
      treasuryAddress,
      signingClient: !!signingClient
    });
  }, [contentId, price, walletAddress, contractAddress, treasuryAddress, signingClient]);

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
      
      // Convert price from XION to uxion (micro XION)
      const priceInMicroXion = String(parseFloat(price) * 1_000_000);
      
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
      <div className="border rounded-lg p-6 text-center bg-gray-50">
        <p className="mb-3 text-gray-700">Please connect your wallet to access this content.</p>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="border rounded-lg p-6 text-center bg-gray-50">
        <p className="text-gray-700">Checking access status...</p>
        <div className="mt-3 mx-auto w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user has access, show the content
  if (hasAccess) {
    return (
      <div className="border rounded-lg p-6 bg-green-50">
        <div className="mb-3 flex items-center justify-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-green-700 font-medium">Content Unlocked</p>
        </div>
        <div className="bg-white border rounded p-4">{children}</div>
      </div>
    );
  }

  // Otherwise show the paywall
  return (
    <div className="border rounded-lg p-6 text-center bg-yellow-50">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 mb-4 text-gray-700">{description}</p>
      
      <div className="bg-white/50 border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z" clipRule="evenodd" />
          </svg>
          <p className="text-gray-500">Content is locked</p>
        </div>
      </div>
      
      <p className="font-medium text-gray-900">One-time payment: <span className="text-blue-600">{price} XION</span></p>
      
      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-700 text-sm rounded">
          {error}
        </div>
      )}
      
      <button
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={unlockContent}
        disabled={processing}
      >
        {processing ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
            Processing...
          </>
        ) : (
          'Unlock Now'
        )}
      </button>
      
      <p className="mt-3 text-xs text-gray-500">You'll only pay once for permanent access</p>
    </div>
  );
};

export default Paywall;
