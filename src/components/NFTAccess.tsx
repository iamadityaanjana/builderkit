import React, { ReactNode } from 'react';
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
    <div className="p-8 rounded-xl bg-slate-900 border border-slate-700 text-center">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
      <p className="text-slate-200">Verifying NFT ownership...</p>
    </div>
  );

  const defaultLoginPrompt = (
    <div className="p-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">Authentication Required</h3>
      <p className="text-slate-300 mb-4">
        Please connect your wallet to verify ownership of required NFTs.
      </p>
      <button 
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        onClick={() => {
          // This is a placeholder - the actual implementation would depend on
          // how you've set up the Abstraxion modal trigger
          const event = new CustomEvent('abstraxion:open');
          window.dispatchEvent(event);
        }}
      >
        Connect Wallet
      </button>
    </div>
  );

  const defaultFallback = (
    <div className="p-8 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-red-800">
      <h3 className="text-xl font-bold text-white mb-4">Access Restricted</h3>
      <p className="text-slate-300 mb-4">
        This content is only available to owners of the required NFT.
      </p>
      
      <div className="bg-slate-800 p-3 rounded-lg mb-4">
        <p className="text-slate-300 text-sm">
          <strong>Contract Address:</strong> 
          <span className="text-xs font-mono text-slate-400 block mt-1">{nftContractAddress}</span>
        </p>
        {tokenId && (
          <p className="text-slate-300 text-sm mt-2">
            <strong>Token ID Required:</strong> 
            <span className="text-xs font-mono text-slate-400 block mt-1">{tokenId}</span>
          </p>
        )}
        <p className="text-slate-300 text-sm mt-2">
          <strong>Your Address:</strong> 
          <span className="text-xs font-mono text-slate-400 block mt-1">{account?.bech32Address || 'Not connected'}</span>
        </p>
      </div>
      
      {error && (
        <div className="bg-red-900/30 p-3 rounded-lg mb-4">
          <p className="text-red-300 text-sm">Error: {error}</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <a
          href={`https://explorer.burnt.com/xion-testnet-2/contract/${nftContractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white inline-block text-center"
        >
          View Contract
        </a>
        
        <a
          href="https://marketplace.burnt.com/collections"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white inline-block text-center"
        >
          Get Required NFT
        </a>
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
