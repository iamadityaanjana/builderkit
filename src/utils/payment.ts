// utils/payment.ts
// Utility functions for XION payment sessions

export const PAYMENT_SESSION_KEY = 'xion_payment_session';

/**
 * Save payment session data to local storage
 */
export function savePaymentSession(session: any) {
  localStorage.setItem(PAYMENT_SESSION_KEY, JSON.stringify(session));
}

/**
 * Load the current payment session from local storage
 */
export function loadPaymentSession(): any | null {
  const data = localStorage.getItem(PAYMENT_SESSION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Clear the current payment session from local storage
 */
export function clearPaymentSession() {
  localStorage.removeItem(PAYMENT_SESSION_KEY);
}

/**
 * Create a payment session with the XION Pay API
 * Note: This is a placeholder for the actual API integration
 */
export async function createPaymentSession(params: {
  productId: string;
  amount: string;
  currency: string;
}) {
  // In a real implementation, you would call the XION Pay API here
  // This is a placeholder that returns a mock payment session
  return {
    id: `session_${Math.random().toString(36).substring(2, 15)}`,
    productId: params.productId,
    amount: params.amount,
    currency: params.currency,
    status: 'created',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Check the status of a payment session
 * Note: This is a placeholder for the actual API integration
 */
export async function checkPaymentStatus(sessionId: string) {
  // In a real implementation, you would call the XION Pay API here
  // This is a placeholder that returns a mock payment status
  return {
    id: sessionId,
    status: Math.random() > 0.2 ? 'completed' : 'pending',
    txHash: Math.random() > 0.2 ? `xion-${Math.random().toString(36).substring(2, 15)}` : null,
  };
}
