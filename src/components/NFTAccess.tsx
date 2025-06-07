import React, { ReactNode, useState } from 'react';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { useNFTAccess } from '../hooks/useNFTAccess';

interface NFTAccessProps {
  nftContractAddress: string;
  tokenId?: string;
  children: ReactNode;
  loadingComponent?: ReactNode;
  fallbackComponent?: ReactNode;
  loginPromptComponent?: ReactNode;
}

/**
 * NFTAccess - A component to gate content based on NFT ownership
 * 
 * This component restricts access to its children based on whether the user
 * owns a specified NFT or an NFT from a specified collection.
 */
export const NFTAccess: React.FC<NFTAccessProps> = ({
  nftContractAddress,
  tokenId,
  children,
  loadingComponent,
  fallbackComponent,
  loginPromptComponent
}) => {
  const { data: account } = useAbstraxionAccount();
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
  console.log("NFTAccess component - account data:", account);
  console.log("NFTAccess component - checking contract:", nftContractAddress);
  console.log("NFTAccess component - checking token ID:", tokenId);
  
  const { hasAccess, isLoading, error } = useNFTAccess(
    nftContractAddress,
    tokenId,
    account?.bech32Address
  );

  // Default components if none provided
  const defaultLoadingComponent = (
    <div className="p-8 rounded-xl bg-white border border-gray-200 text-center shadow-sm">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-gray-600">🔍 Checking your collectibles...</p>
      <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
    </div>
  );

  const defaultLoginPrompt = (
    <div className="p-8 rounded-xl bg-white border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-4">👋 Let's Get You Connected</h3>
      <p className="text-gray-600 mb-4">
        To access this exclusive content, please connect your digital wallet so we can verify your collectibles.
      </p>
      <button 
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
        onClick={() => {
          // This is a placeholder - the actual implementation would depend on
          // how you've set up the Abstraxion modal trigger
          const event = new CustomEvent('abstraxion:open');
          window.dispatchEvent(event);
        }}
      >
        Connect My Wallet
      </button>
    </div>
  );

  const defaultFallback = (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="p-8 rounded-xl bg-white border border-gray-200 shadow-sm filter blur-sm pointer-events-none">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
      
      {/* Overlay with access message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-xl border border-gray-200 shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔒 Exclusive Access Required
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            This special content is reserved for members who own a specific digital collectible. To unlock this area, you'll need to have the required collectible in your digital wallet.
          </p>
          
          <div className="space-y-3 m-4">
            <button
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showMoreInfo ? 'Hide Details' : 'More Info'}
            </button>
            
            <a
              href="https://marketplace.burnt.com/collections"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors inline-block mt-4"
            >
              🛒 Browse Digital Collectibles
            </a>
          </div>
          
          {showMoreInfo && (
            <div className="mt-6 pt-4 border-t border-gray-200 text-left">
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-700">Contract Address:</p>
                  <p className="text-xs font-mono text-gray-500 break-all">{nftContractAddress}</p>
                </div>
                
                {tokenId && (
                  <div>
                    <p className="text-xs font-medium text-gray-700">Token ID Required:</p>
                    <p className="text-xs font-mono text-gray-500">{tokenId}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs font-medium text-gray-700">Your Address:</p>
                  <p className="text-xs font-mono text-gray-500 break-all">{account?.bech32Address || 'Not connected'}</p>
                </div>
                
                {error && (
                  <div className="bg-red-50 p-2 rounded border border-red-200">
                    <p className="text-red-600 text-xs">Error: {error}</p>
                  </div>
                )}
                
                <div className="pt-2">
                  <a
                    href={`https://explorer.burnt.com/xion-testnet-2/contract/${nftContractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    View Contract on Explorer
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // If not connected to wallet
  if (!account) {
    return <>{loginPromptComponent || defaultLoginPrompt}</>;
  }

  // While checking ownership
  if (isLoading) {
    return <>{loadingComponent || defaultLoadingComponent}</>;
  }

  // If ownership check failed or user doesn't own the NFT
  if (!hasAccess) {
    return <>{fallbackComponent || defaultFallback}</>;
  }

  // User has access - show the protected content
  return <>{children}</>;
};
