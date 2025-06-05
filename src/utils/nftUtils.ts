/**
 * NFT Utility Functions for XION
 * 
 * This file contains utility functions for interacting with CW721 NFT contracts on XION.
 */

// Cache for NFT ownership checks to reduce API calls
interface OwnershipCache {
  [key: string]: {
    result: boolean;
    timestamp: number;
    expiresAt: number;
  };
}

// Cache expiration time: 5 minutes (in milliseconds)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// In-memory cache
const ownershipCache: OwnershipCache = {};

/**
 * Check if an address owns a specific NFT
 * 
 * @param contractAddress The address of the CW721 contract
 * @param tokenId The ID of the specific NFT to check
 * @param ownerAddress The address to check ownership against
 * @param apiUrl The XION API endpoint (defaults to testnet)
 * @returns Promise resolving to a boolean indicating ownership
 */
export async function checkNFTOwnership(
  contractAddress: string,
  tokenId: string,
  ownerAddress: string,
  apiUrl = 'https://api.xion-testnet-2.burnt.com',
  bypassCache = false
): Promise<boolean> {
  try {
    // Create a cache key based on the parameters
    const cacheKey = `${contractAddress}:${tokenId}:${ownerAddress}`;
    
    // Check if we have a valid cached result
    if (!bypassCache && ownershipCache[cacheKey]) {
      const cachedData = ownershipCache[cacheKey];
      const now = Date.now();
      
      // If the cache hasn't expired, return the cached result
      if (now < cachedData.expiresAt) {
        console.log(`Using cached NFT ownership result for ${cacheKey} (valid for ${Math.round((cachedData.expiresAt - now) / 1000)}s)`);
        return cachedData.result;
      } else {
        // Cache expired, delete it
        console.log(`Cache expired for ${cacheKey}`);
        delete ownershipCache[cacheKey];
      }
    }
    
    console.log(`Checking if ${ownerAddress} owns token ${tokenId} in contract ${contractAddress}`);

    // Create the query object for CW721 owner_of query
    const queryMsg = {
      owner_of: {
        token_id: tokenId
      }
    };
    
    // Encode to Base64 in browser-compatible way
    const encodedQuery = btoa(JSON.stringify(queryMsg));
    
    const url = `${apiUrl}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${encodedQuery}`;
    console.log("Fetch URL:", url);
    
    const response = await fetch(url);
    
    // Check for HTTP error status
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log("NFT ownership response:", data);
    
    // CW721 owner_of returns data.data.owner as the owner address
    const owner = data?.data?.owner;
    const isOwner = owner === ownerAddress;
    
    console.log(`Owner from API: ${owner}, User address: ${ownerAddress}, Is owner: ${isOwner}`);
    
    // Cache the result
    const now = Date.now();
    ownershipCache[cacheKey] = {
      result: isOwner,
      timestamp: now,
      expiresAt: now + CACHE_EXPIRATION
    };
    
    return isOwner;
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    return false;
  }
}

/**
 * Check if an address owns any NFT from a specific collection
 * 
 * @param contractAddress The address of the CW721 contract
 * @param ownerAddress The address to check ownership against
 * @param apiUrl The XION API endpoint (defaults to testnet)
 * @returns Promise resolving to a boolean indicating ownership of any NFT in the collection
 */
export async function checkCollectionOwnership(
  contractAddress: string,
  ownerAddress: string,
  apiUrl = 'https://api.xion-testnet-2.burnt.com'
): Promise<boolean> {
  try {
    console.log(`Checking if ${ownerAddress} owns any NFTs in contract ${contractAddress}`);

    // Create the query object for CW721 tokens query
    const queryMsg = {
      tokens: {
        owner: ownerAddress,
        limit: 1
      }
    };
    
    // Encode to Base64 in browser-compatible way
    const encodedQuery = btoa(JSON.stringify(queryMsg));
    
    const url = `${apiUrl}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${encodedQuery}`;
    console.log("Fetch URL:", url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("Collection ownership response:", data);
    
    // CW721 tokens query returns data.data.tokens as an array of token IDs
    const tokens = data?.data?.tokens || [];
    const hasTokens = tokens.length > 0;
    
    console.log(`Tokens owned in collection: ${tokens.join(', ')}, Has tokens: ${hasTokens}`);
    
    return hasTokens;
  } catch (error) {
    console.error('Error checking collection ownership:', error);
    return false;
  }
}

/**
 * Get all NFTs owned by an address in a collection
 * 
 * @param contractAddress The address of the CW721 contract
 * @param ownerAddress The address to check ownership for
 * @param limit Maximum number of tokens to return (optional)
 * @param apiUrl The XION API endpoint (defaults to testnet)
 * @returns Promise resolving to an array of token IDs
 */
export async function getOwnedNFTs(
  contractAddress: string,
  ownerAddress: string,
  limit?: number,
  apiUrl = 'https://api.xion-testnet-2.burnt.com'
): Promise<string[]> {
  try {
    console.log(`Getting NFTs owned by ${ownerAddress} in contract ${contractAddress}`);

    // Create the query object for CW721 tokens query
    const queryObj = {
      tokens: {
        owner: ownerAddress,
        ...(limit ? { limit } : {})
      }
    };
    
    // Encode to Base64 in browser-compatible way
    const encodedQuery = btoa(JSON.stringify(queryObj));
    
    const url = `${apiUrl}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${encodedQuery}`;
    console.log("Fetch URL:", url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log("Owned NFTs response:", data);
    
    // CW721 tokens query returns data.data.tokens as an array of token IDs
    const tokens = data?.data?.tokens || [];
    
    console.log(`Tokens owned: ${tokens.join(', ')}`);
    
    return tokens;
  } catch (error) {
    console.error('Error getting owned NFTs:', error);
    return [];
  }
}
