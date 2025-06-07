import React from 'react';
import { toast, type ToastOptions } from 'react-toastify';

export interface TransactionToastProps {
  children: React.ReactNode;
  onTransaction: () => Promise<any>;
  pendingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  toastOptions?: ToastOptions;
}

/**
 * TransactionToast - A reusable component for blockchain transactions with toast notifications
 * 
 * This component wraps a button or any clickable element and shows toast notifications
 * for the pending, success, and error states of a blockchain transaction.
 * 
 * @example
 * <TransactionToast
 *   onTransaction={executePayment}
 *   pendingMessage="Processing payment..."
 *   successMessage="Payment successful!"
 *   errorMessage="Payment failed:"
 * >
 *   <button className="btn-primary">Pay Now</button>
 * </TransactionToast>
 */
export const TransactionToast: React.FC<TransactionToastProps> = ({
  children,
  onTransaction,
  pendingMessage = 'Transaction is pending...',
  successMessage = 'Transaction completed successfully!',
  errorMessage = 'Transaction failed. Please try again.',
  toastOptions = {}
}) => {
  const handleClick = async () => {
    const transactionPromise = onTransaction();

    // Show toast notifications for different transaction states
    toast.promise(
      transactionPromise,
      {
        pending: {
          render: () => pendingMessage,
          icon: "🔄" ,
          ...(toastOptions || {})
        },
        success: {
          render: () => successMessage,
          icon: "✅",
          ...(toastOptions || {})
        },
        error: {
          render: (error: any) => `${errorMessage} ${error instanceof Error ? error.message : ''}`,
          icon: "❌",
          ...(toastOptions || {})
        }
      }
    );

    try {
      const result = await transactionPromise;
      return result;
    } catch (error) {
      console.error('Transaction error:', error);
      // Re-throw to let the caller handle it
      throw error;
    }
  };

  // Clone the child element and add the onClick handler
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onClick: async (e: React.MouseEvent) => {
              // Call the original onClick if it exists
              if (child.props.onClick) {
                child.props.onClick(e);
              }
              // Call our handler
              await handleClick();
            }
          });
        }
        return child;
      })}
    </>
  );
};
