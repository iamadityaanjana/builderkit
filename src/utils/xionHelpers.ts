/**
 * XION Blockchain Helper Functions
 * 
 * Utility functions for working with XION transactions and token conversions
 */

/**
 * Converts XION tokens to the base unit (uxion)
 * 1 XION = 1,000,000 uxion (6 decimal places)
 * 
 * @param amount The amount in XION
 * @returns The amount in uxion as a string
 */
export function xionToBaseUnits(amount: string | number): string {
  // Handle string or number input
  const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Convert to base units (multiply by 10^6)
  const baseUnits = Math.round(parsedAmount * 1_000_000);
  
  // Return as string to avoid BigInt serialization issues
  return baseUnits.toString();
}

/**
 * Converts uxion (base units) to XION tokens
 * 
 * @param baseUnits The amount in uxion
 * @returns The amount in XION
 */
export function baseUnitsToXion(baseUnits: string | number): number {
  // Handle string or number input
  const parsedBaseUnits = typeof baseUnits === 'string' ? parseInt(baseUnits, 10) : baseUnits;
  
  // Convert to XION (divide by 10^6)
  return parsedBaseUnits / 1_000_000;
}

/**
 * Creates a standard XION token transfer message
 * 
 * @param fromAddress The sender address
 * @param toAddress The recipient address
 * @param amount Amount in XION
 * @returns Properly formatted MsgSend message for the cosmos-sdk bank module
 */
export function createTransferMessage(fromAddress: string, toAddress: string, amount: string | number) {
  const baseUnitAmount = xionToBaseUnits(amount);
  
  return {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress,
      toAddress,
      amount: [
        {
          denom: "uxion", // Testnet denomination
          amount: baseUnitAmount
        }
      ]
    }
  };
}