import { useState, useEffect } from 'react';
import { checkNFTOwnership, checkCollectionOwnership } from '../utils/nftUtils';

interface NFTAccessState {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook to check if a user has access to NFT-gated content
 * 
 * @param contractAddress The address of the CW721 NFT contract
 * @param tokenId Optional specific token ID (if not provided, checks if user owns any NFT in the collection)
 * @param userAddress The address of the user to check
 * @returns Object containing access state, loading state, and any error
 */
export function useNFTAccess(
  contractAddress: string,
  tokenId?: string,
  userAddress?: string
): NFTAccessState {
  const [state, setState] = useState<NFTAccessState>({
    hasAccess: false,
    isLoading: false,
    error: null
  });

  useEffect(() => {
    // Reset state when inputs change
    setState({
      hasAccess: false,
      isLoading: true,
      error: null
    });

    // If no user address is provided, can't check ownership
    if (!userAddress) {
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
      return;
    }

    // If no contract address provided, can't check ownership
    if (!contractAddress) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'NFT contract address is required'
      }));
      return;
    }

    async function checkAccess() {
      try {
        let hasAccess = false;
        
        // Check specific token ownership if token ID is provided,
        // otherwise check if user owns any token in the collection
        if (tokenId) {
          // @ts-ignore
          hasAccess = await checkNFTOwnership(contractAddress, tokenId, userAddress);
        } else {
          // @ts-ignore
          hasAccess = await checkCollectionOwnership(contractAddress, userAddress);
        }

        setState({
          hasAccess,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setState({
          hasAccess: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Error checking NFT ownership'
        });
      }
    }

    checkAccess();
  }, [contractAddress, tokenId, userAddress]);

  return state;
}
