import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAbstraxionAccount, useAbstraxionSigningClient } from '@burnt-labs/abstraxion';
import { toast } from 'react-toastify';
import { TransactionToast } from '../components/TransactionToast';
import { getTransactionExplorerLink } from '../utils/transactionUtils';

export const TransactionToastPage: React.FC = () => {
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  
  // Function to simulate a blockchain transaction
  const simulateTransaction = async () => {
    if (!account?.bech32Address) {
      toast.error("Please connect your wallet first");
      throw new Error("Wallet not connected");
    }
    
    // Simulate a delay to mimic transaction processing
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    // Simulate success or failure randomly
    const isSuccess = Math.random() > 0.3;
    
    if (isSuccess) {
      const mockTxHash = `TX${Math.random().toString(36).substring(2, 15)}`;
      setTransactionHash(mockTxHash);
      return { txHash: mockTxHash };
    } else {
      throw new Error("Transaction simulation failed");
    }
  };
  
  // Function to execute a real blockchain transaction (if client is available)
  const executeRealTransaction = async () => {
    if (!account?.bech32Address || !client) {
      toast.error("Please connect your wallet first");
      throw new Error("Wallet not connected");
    }
    
    try {
      // This is just an example - replace with your actual transaction logic
      // For example, sending a minimal amount of tokens to yourself
      const tx = await client.sendTokens(
        account.bech32Address, 
        account.bech32Address,
        [{ denom: 'uxion', amount: '1' }],
        {
          amount: [{ denom: 'uxion', amount: '500' }],
          gas: '200000',
        }
      );
      
      setTransactionHash(tx.transactionHash);
      return tx;
    } catch (error) {
      console.error("Transaction error:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="p-4 border-b border-slate-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-lg">Xion Builder Kit Demo</div>
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
                <Link to="/nft-access" className="text-slate-300 hover:text-white transition-colors">
                  NFT Access
                </Link>
              </li>
              <li>
                <Link to="/transaction-toast" className="text-white font-medium">
                  Transaction Toast
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto py-16 px-4">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Transaction Toast Demo</h1>
        
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-slate-900 p-8 rounded-xl border border-slate-700 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Real-time Transaction Notifications</h2>
            
            <p className="text-slate-300 mb-8">
              This demo showcases real-time toast notifications for blockchain transactions,
              enhancing the user experience by providing immediate feedback on transaction status.
            </p>
            
            <div className="space-y-8">
              {/* Simulated transaction example */}
              <div className="bg-slate-800 p-6 rounded-lg">
                <h3 className="text-xl text-white mb-4">Simulate Transaction</h3>
                <p className="text-slate-400 mb-6">
                  Click the button below to simulate a blockchain transaction with a 70% success rate.
                </p>
                
                <TransactionToast
                  onTransaction={simulateTransaction}
                  pendingMessage="Simulating transaction..."
                  successMessage="Transaction simulation successful!"
                  errorMessage="Transaction simulation failed:"
                >
                  <button 
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
                  >
                    Simulate Transaction
                  </button>
                </TransactionToast>
              </div>

              {/* Real transaction example */}
              <div className="bg-slate-800 p-6 rounded-lg">
                <h3 className="text-xl text-white mb-4">Real Transaction (requires wallet)</h3>
                <p className="text-slate-400 mb-6">
                  Execute a minimal self-transfer transaction on the XION blockchain.
                </p>
                
                <TransactionToast
                  onTransaction={executeRealTransaction}
                  pendingMessage="Processing transaction on XION..."
                  successMessage="Transaction completed successfully!"
                  errorMessage="Transaction failed:"
                >
                  <button 
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium"
                    disabled={!account?.bech32Address}
                  >
                    {account?.bech32Address ? "Execute Real Transaction" : "Connect Wallet First"}
                  </button>
                </TransactionToast>
              </div>
            </div>

            {transactionHash && (
              <div className="mt-8 p-4 bg-slate-700/40 rounded-lg">
                <h4 className="text-lg text-white mb-2">Latest Transaction Hash</h4>
                <p className="text-sm font-mono text-slate-300 break-all">{transactionHash}</p>
                <div className="mt-4">
                  <a 
                    href={getTransactionExplorerLink(transactionHash, true)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
