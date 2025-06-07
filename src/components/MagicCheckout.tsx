import React, { useState } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient } from '@burnt-labs/abstraxion';
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import { savePaymentSession } from '../utils/payment';
import { xionToBaseUnits, createTransferMessage } from '../utils/xionHelpers';
import { TransactionToast } from './TransactionToast';
import { getTransactionExplorerLink } from '../utils/transactionUtils';

interface MagicCheckoutProps {
  productId: string;
  amount: string;
  currency?: string;
  onSuccess?: (txHash: string) => void;
  onError?: (error: Error) => void;
}

export const MagicCheckout: React.FC<MagicCheckoutProps> = ({
  productId,
  amount,
  currency = 'usdc',
  onSuccess,
  onError
}) => {
  const { client, signArb } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Function to execute the payment transaction
  const handleCheckout = async () => {
    if (!client) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    if (!account?.bech32Address) {
      throw new Error('Account not available. Please connect your wallet first.');
    }
    
    try {
      // Create payment session data
      const paymentData = {
        productId,
        amount,
        currency,
        timestamp: new Date().toISOString()
      };

      // Save session data
      savePaymentSession(paymentData);

      // Recipient address - for demonstration purposes
      const recipientAddress = "xion1edjlrc4jvldkpypfaevsvc5vt5xz6mkcl0hf7u";
      
      // For this example, we'll send a small amount of XION tokens (0.01)
      const sendAmount = "0.01";
      
      // Convert to base units using our helper function (prevents BigInt serialization issues)
      const amountInBaseUnits = xionToBaseUnits(sendAmount);
      
      console.log("Preparing transaction from:", account.bech32Address);
      console.log("Sending to:", recipientAddress);
      console.log("Amount:", sendAmount, "XION =", amountInBaseUnits, "uxion");
      
      // Create the transfer message using our helper function
      const msg = createTransferMessage(
        account.bech32Address,
        recipientAddress,
        sendAmount
      );

      console.log("Sending transaction with payload:", JSON.stringify(msg, null, 2));
      
      // Execute the send transaction
      const result = await client.signAndBroadcast(
        account.bech32Address,
        [msg],
        "auto" // Fee calculation - will be sponsored by treasury
      );
      
      // Check if transaction was successful (code 0 means success)
      if (result.code !== 0) {
        throw new Error(`Transaction failed: ${result.rawLog || 'Unknown error'}`);
      }
      
      // Get transaction hash from the result
      const txHash = result.transactionHash;
      
      console.log("Transaction successful!");
      console.log("Transaction hash:", txHash);
      console.log("Block height:", result.height);
      
      // Update component state with transaction hash
      setTxHash(txHash);
      setStatus('success');
      
      // Call the onSuccess callback if provided
      onSuccess && onSuccess(txHash);
      
      return { txHash, success: true, blockHeight: result.height };
    } catch (err: any) {
      console.error('Checkout failed:', err);
      
      // Handle different types of errors with more specific messages
      let errorMessage = 'Payment processing failed';
      
      if (err.message?.includes('BigInt')) {
        errorMessage = 'Transaction formatting error. Please try again.';
      } else if (err.message?.includes('rejected')) {
        errorMessage = 'Transaction was rejected by the wallet.';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in your wallet.';
      } else if (err.message?.includes('account sequence mismatch')) {
        errorMessage = 'Transaction sequence error. Please refresh and try again.';
      } else if (err.message?.includes('cannot be broadcasted')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Transaction timed out. The network might be congested.';
      } else if (err.message?.includes('out of gas')) {
        errorMessage = 'Transaction ran out of gas. Try a smaller transaction.';
      } else if (err.message?.includes('unauthorized')) {
        errorMessage = 'Authorization failed. Please reconnect your wallet.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Update component state
      setError(errorMessage);
      setStatus('error');
      
      // Call the onError callback if provided
      onError && onError(err instanceof Error ? err : new Error(errorMessage));
      
      // Re-throw with improved message for the toast notification
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Magic Checkout
          </h1>
          <p className="text-gray-600 text-sm mt-2 text-center">
            Complete your payment seamlessly with XION
          </p>
        </div>

        {/* Product Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Product ID:</span>
            <span className="text-gray-800 font-mono">{productId}</span>
          </div>
          <div className="flex justify-between mb-3">
            <span className="text-gray-600">Amount:</span>
            <span className="text-gray-800 font-bold">{amount} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Network Fee:</span>
            <span className="text-green-600">Sponsored</span>
          </div>
        </div>

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-800 text-center font-medium">Payment successful!</p>
              <p className="text-xs text-center text-gray-600 mt-1">Transaction has been confirmed on XION</p>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-gray-600">Transaction Hash:</p>
                <p className="text-xs text-green-600 font-mono break-all">{txHash}</p>
                {txHash && (
                  <a 
                    href={getTransactionExplorerLink(txHash, true)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
                  >
                    <span>View on Explorer</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
            <button 
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-xl font-medium border border-gray-300 transition-colors duration-300"
              onClick={() => setStatus('idle')}
            >
              New Payment
            </button>
          </div>
        ) : (
          <TransactionToast 
            onTransaction={handleCheckout}
            pendingMessage="Processing your payment on XION..."
            successMessage="Payment completed successfully!"
            errorMessage="Payment failed:"
          >
            <button
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3.5 px-4 rounded-xl font-medium transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              disabled={!client || !account?.bech32Address}
            >
              {!client || !account?.bech32Address ? "Connect Wallet First" : "Pay Now"}
            </button>
          </TransactionToast>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-2 h-2 text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-gray-500">Powered by XION • Gasless transactions</p>
        </div>
      </div>
    </div>
  );
};
