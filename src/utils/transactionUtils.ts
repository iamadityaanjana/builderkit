import { toast } from 'react-toastify';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
// @ts-ignore
import { baseUnitsToXion, xionToBaseUnits } from './xionHelpers';

interface TransactionResponse {
  txHash: string;
  success: boolean;
  error?: string;
  blockHeight?: number;
}

/**
 * Execute a token transfer transaction on the XION blockchain
 * @param client - The SigningCosmWasmClient instance
 * @param senderAddress - The sender's address
 * @param recipientAddress - The recipient's address
 * @param amount - The amount to send in XION (will be converted to base units)
 * @returns A promise that resolves to a transaction response object
 */
export async function executeTokenTransfer(
  client: SigningCosmWasmClient,
  senderAddress: string,
  recipientAddress: string,
  amount: string // In XION, not base units
): Promise<TransactionResponse> {
  try {
    // Convert XION to base units (uxion)
    const amountInBaseUnits = xionToBaseUnits(amount);
    
    // Execute the token transfer
    const tx = await client.sendTokens(
      senderAddress,
      recipientAddress,
      [{ denom: 'uxion', amount: amountInBaseUnits }],
      {
        amount: [{ denom: 'uxion', amount: '500' }], // Fee
        gas: '200000',
      }
    );
    
    return {
      txHash: tx.transactionHash,
      success: true,
      blockHeight: tx.height
    };
  } catch (error) {
    console.error('Transaction error:', error);
    return {
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown transaction error'
    };
  }
}

/**
 * Execute a smart contract transaction on the XION blockchain
 * @param client - The SigningCosmWasmClient instance
 * @param senderAddress - The sender's address
 * @param contractAddress - The smart contract address
 * @param msg - The message to send to the contract
 * @param funds - Optional funds to send with the message
 * @returns A promise that resolves to a transaction response object
 */
export async function executeContractTransaction(
  client: SigningCosmWasmClient,
  senderAddress: string,
  contractAddress: string,
  msg: Record<string, unknown>,
  funds: { amount: string; denom: string }[] = []
): Promise<TransactionResponse> {
  try {
    // Execute the contract transaction
    const tx = await client.execute(
      senderAddress,
      contractAddress,
      msg,
      'auto',
      '',
      funds
    );
    
    return {
      txHash: tx.transactionHash,
      success: true,
      blockHeight: tx.height
    };
  } catch (error) {
    console.error('Contract transaction error:', error);
    return {
      txHash: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown contract transaction error'
    };
  }
}

/**
 * Get a link to the transaction in the XION explorer
 * @param txHash - The transaction hash
 * @param isTestnet - Whether to use the testnet explorer (defaults to true)
 * @returns A URL string for the transaction in the explorer
 */
export function getTransactionExplorerLink(txHash: string, isTestnet = true): string {
  const baseUrl = isTestnet 
    ? 'https://explorer.xion-testnet-2.burnt.com/tx' 
    : 'https://explorer.burnt.com/tx';
  
  return `${baseUrl}/${txHash}`;
}

/**
 * Execute a transaction with toast notifications
 * @param transaction - A function that returns a promise resolving to the transaction result
 * @param options - Configuration options for the toast notifications
 * @returns A promise resolving to the transaction result
 */
export async function executeTransactionWithToast<T>(
  transaction: () => Promise<T>,
  options: {
    pendingMessage?: string;
    successMessage?: string;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const {
    pendingMessage = 'Transaction is pending...',
    successMessage = 'Transaction completed successfully!',
    errorMessage = 'Transaction failed. Please try again.',
  } = options;
  
  const transactionPromise = transaction();
  
  toast.promise(
    transactionPromise,
    {
      pending: {
        render: () => pendingMessage,
        icon: ()=>"🔄",
      },
      success: {
        render: () => successMessage,
        icon: ()=>"✅",
      },
      error: {
        render: (error: any) => `${errorMessage} ${error instanceof Error ? error.message : ''}`,
        icon: ()=>"❌",
      }
    }
  );
  
  return transactionPromise;
}
