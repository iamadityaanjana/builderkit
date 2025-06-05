import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NFTAccess } from '../components/NFTAccess';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';

export const NFTGatedPage: React.FC = () => {
  // Example NFT contract address on XION testnet
  const demoNftContractAddress = "xion1ygnm3h37mjcamvz4zw3gyqh2t30svyxz6lj94xdm0kfjqa7c0e5sgxs9ax";
  const demoTokenId = "hehe69"; // Updated to use a more standard token ID format
  
  // State to track debugging info from the NFT ownership check
  const [debugInfo, setDebugInfo] = useState<{
    address?: string;
    contractInfo?: any;
    error?: string;
  }>({});
  
  const { data: account } = useAbstraxionAccount();
  
  // Function to manually test NFT ownership
  const checkNFTOwnership = async () => {
    if (!account?.bech32Address) {
      setDebugInfo({ error: "Please connect your wallet first" });
      return;
    }
    
    try {
      const apiUrl = "https://api.xion-testnet-2.burnt.com";
      
      // Get contract info to verify it exists
      const contractInfoResponse = await fetch(
        `${apiUrl}/cosmwasm/wasm/v1/contract/${demoNftContractAddress}`
      );
      const contractInfo = await contractInfoResponse.json();
      
      setDebugInfo({
        address: account.bech32Address,
        contractInfo: contractInfo
      });
      
    } catch (error) {
      setDebugInfo({
        error: `Error fetching contract info: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="p-4 border-b border-slate-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-lg">XION Demo</div>
          <nav>
            <ul className="flex gap-6">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="text-slate-300 hover:text-white transition-colors">
                  Checkout
                </Link>
              </li>
              <li>
                <Link to="/nft-access" className="text-white font-medium">
                  NFT Access
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">NFT-Gated Content Demo</h1>
        
        <div className="max-w-3xl mx-auto mt-12">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-300 mb-4">
              This page demonstrates token-gated content using NFTs on the XION blockchain. 
              Only users who own a specific NFT will be able to see the protected content below.
            </p>
            
            <div className="bg-slate-800 p-4 rounded-lg mb-6">
              <p className="text-sm text-slate-300 mb-1"><strong>Contract Address:</strong></p>
              <p className="text-sm text-slate-400 font-mono break-all mb-3">{demoNftContractAddress}</p>
              
              <p className="text-sm text-slate-300 mb-1"><strong>Token ID Required:</strong></p>
              <p className="text-sm text-slate-400 font-mono">{demoTokenId}</p>
            </div>
            
            <div className="flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                onClick={checkNFTOwnership}
              >
                Verify NFT Contract
              </button>
            </div>
            
            {debugInfo.contractInfo && (
              <div className="mt-4 p-3 rounded-lg bg-green-900/30 border border-green-800">
                <p className="text-green-300 text-sm">✅ Contract found on XION testnet</p>
              </div>
            )}
            
            {debugInfo.error && (
              <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-800">
                <p className="text-red-300 text-sm">{debugInfo.error}</p>
              </div>
            )}
          </div>
          
          {/* NFT-gated content */}
          <NFTAccess nftContractAddress={demoNftContractAddress} tokenId={demoTokenId}>
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-8 rounded-xl border border-blue-500">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white text-center mb-4">Exclusive NFT Holder Content</h3>
              <p className="text-blue-200 mb-6 text-center">
                Congratulations! You've successfully accessed this content because you own an NFT from our collection.
              </p>
              <div className="bg-blue-900/50 p-6 rounded-lg">
                <h4 className="text-lg font-bold text-white mb-3">Premium Benefits</h4>
                <ul className="list-disc pl-6 text-blue-200 space-y-2">
                  <li>Access to members-only events</li>
                  <li>Exclusive discounts on products</li>
                  <li>Early access to new features</li>
                  <li>Community voting rights</li>
                </ul>
              </div>
            </div>
          </NFTAccess>
        </div>
      </div>
    </div>
  );
};
