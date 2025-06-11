import React, { useEffect, useState } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient, useAbstraxionClient } from '@burnt-labs/abstraxion';
import config from '../config';
import { toast } from 'react-toastify';

// Types for referral data stored in User Map
interface ReferralData {
  referralCode?: string;
  referredBy?: string;
  referrals?: string[];
  referralAppliedAt?: string;
  rewards?: {
    pending?: number;
    claimed?: number;
  };
  [key: string]: any;
}

interface ReferralFlowProps {
  rewardAmount?: number; // Amount of XION tokens to reward per referral
  loginPromptComponent?: React.ReactNode; // Custom component to show when not logged in
}

export const ReferralFlow: React.FC<ReferralFlowProps> = ({
  rewardAmount = 0.5, // Default of 5 XION tokens per referral
  loginPromptComponent,
}) => {
  // Get wallet data and clients from XION hooks
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // State for referral data
  const [userMapData, setUserMapData] = useState<ReferralData>({});
  const [referralCode, setReferralCode] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [referredBy, setReferredBy] = useState<string>('');

  // State for UI management
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [referralInput, setReferralInput] = useState<string>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const walletAddress = account?.bech32Address || '';
  const contractAddress = config.contractAddress;
  
  // Debug logging
  useEffect(() => {
    console.log('ReferralFlow component mounted with:', {
      walletAddress,
      contractAddress,
      client: !!client,
      queryClient: !!queryClient
    });
  }, [walletAddress, contractAddress, client, queryClient]);

  // Debug logging for referral state
  useEffect(() => {
    console.log("Referral state updated:", {
      hasReferralCode: !!referralCode,
      referredBy: referredBy || "none",
      referralCount,
    });
  }, [referralCode, referredBy, referralCount]);

  // Check for referral code in URL when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if (refParam) {
      console.log('Referral code found in URL:', refParam);
      setReferralInput(refParam);
      
      // Check if user is logged in, has no existing referral, and could auto-apply
      if (walletAddress && queryClient && !userMapData?.referredBy) {
        toast.info("Referral code detected in URL. You can apply it below.");
      }
    }
  }, [walletAddress, queryClient, userMapData]);
  
  // Function to fetch user's data from User Map using built-in queries
  const fetchUserData = async () => {
    if (!walletAddress || !queryClient) return;
    
    try {
      setLoading(true);
      
      // Use the built-in GetValueByUser query with correct field name
      const response = await queryClient.queryContractSmart(contractAddress, {
        get_value_by_user: { 
          address: walletAddress 
        }
      });
      
      console.log("User Map data response:", response);
      
      if (response) {
        // The response can be in multiple formats depending on the contract implementation:
        // 1. A direct string containing JSON
        // 2. An object with a value property containing the JSON string
        // 3. For newer versions: { data: jsonString }
        let responseValue;
        if (typeof response === 'string') {
          responseValue = response;
        } else if (response?.value) {
          responseValue = response.value;
        } else if (response?.data) {
          // Handle the format where the value is in a data property
          responseValue = response.data;
        } else {
          console.log("No data found for user:", walletAddress);
          setUserMapData({});
          return;
        }
        
        // Parse the response value
        try {
          const data = JSON.parse(responseValue);
          setUserMapData(data);
          
          // Extract referral data
          if (data.referralCode) {
            setReferralCode(data.referralCode);
          }
          
          // Instead of relying on the referrals field which might not be updated correctly,
          // we'll get the actual referred users by searching all user maps
          console.log("Getting accurate referral count by searching all user maps...");
          
          // Start with the local referrals data just for initial display
          let initialReferralCount = 0;
          if (data.referrals) {
            if (Array.isArray(data.referrals)) {
              initialReferralCount = data.referrals.length;
            } else if (typeof data.referrals === 'object') {
              initialReferralCount = Object.keys(data.referrals).length;
            }
          }
          
          // Set the initial count while we fetch the accurate count
          setReferralCount(initialReferralCount);
          
          // Asynchronously find all users who have been referred by this user
          findReferredUsers().then(referredUsers => {
            if (referredUsers.length !== initialReferralCount) {
              console.log(`Updated referral count from ${initialReferralCount} to ${referredUsers.length} based on blockchain data`);
            }
            setReferralCount(referredUsers.length);
          });
          
          // Check if the user has been referred by someone else
          if (data.referredBy) {
            console.log("User was referred by:", data.referredBy);
            setReferredBy(data.referredBy);
          } else {
            // Reset referredBy if it was removed
            console.log("User has no referrer");
            setReferredBy('');
          }
          
        } catch (e) {
          console.error("Failed to parse User Map data:", e);
          setError("Invalid data format in User Map");
        }
      } else {
        // No data found
        setUserMapData({});
      }
    } catch (e) {
      console.error("Error fetching user data:", e);
      setError(`Failed to fetch user data: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate and store a new referral code
  const generateReferralCode = async () => {
    if (!walletAddress || !client) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    try {
      setGenerating(true);
      setError(null);
      
      // Generate a random code with the user's address prefix for uniqueness
      const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const newCode = `${walletAddress.substring(0, 5)}-${randomCode}`;
      
      // Prepare the updated data to store
      const currentData = userMapData || {};
      const updatedData: ReferralData = {
        ...currentData,
        referralCode: newCode,
        referrals: currentData.referrals || []
      };
      
      console.log("Storing referral code in User Map:", updatedData);
      
      // Store the data in User Map contract
      const updateResult = await client.execute(
        walletAddress,
        contractAddress,
        {
          update: { value: JSON.stringify(updatedData) }
        },
        'auto'
      );
      
      console.log("Referral code update result:", updateResult);
      
      // Update local state
      setReferralCode(newCode);
      setUserMapData(updatedData);
      
      toast.success("Referral code generated successfully!");
    } catch (e) {
      console.error("Failed to generate referral code:", e);
      setError(`Failed to generate referral code: ${e instanceof Error ? e.message : String(e)}`);
      toast.error("Failed to generate referral code");
    } finally {
      setGenerating(false);
    }
  };

  // Function to apply a referral code
  const applyReferralCode = async () => {
    if (!walletAddress || !client || !queryClient) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!referralInput) {
      toast.error("Please enter a referral code");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First, check if the user has already been referred
      // Make a fresh query to ensure we have the latest data
      const latestUserData = await queryClient.queryContractSmart(contractAddress, {
        get_value_by_user: { 
          address: walletAddress 
        }
      });
      
      let latestUserDataParsed = null;
      
      // Parse the user data with proper format handling
      if (latestUserData) {
        let dataValue;
        if (typeof latestUserData === 'string') {
          dataValue = latestUserData;
        } else if (latestUserData?.value) {
          dataValue = latestUserData.value;
        } else if (latestUserData?.data) {
          dataValue = latestUserData.data;
        }
        
        if (dataValue) {
          try {
            latestUserDataParsed = JSON.parse(dataValue);
          } catch (e) {
            console.error("Failed to parse user data", e);
          }
        }
      }
      
      // Check if the user is already referred
      if (latestUserDataParsed?.referredBy) {
        console.log("User is already referred by:", latestUserDataParsed.referredBy);
        toast.error("You have already been referred by someone");
        // Update our local state to reflect this
        setReferredBy(latestUserDataParsed.referredBy);
        setUserMapData(latestUserDataParsed);
        setLoading(false);
        return;
      }
      
      // Check if the user is trying to use their own referral code
      if (referralCode && referralInput === referralCode) {
        toast.error("You cannot use your own referral code");
        setLoading(false);
        return;
      }
      
      console.log("Searching for referrer with code:", referralInput);
      
      // Get all user data from User Map using the GetMap query
      const mapResponse = await queryClient.queryContractSmart(contractAddress, {
        get_map: {}
      });
      
      console.log("GetMap response structure:", JSON.stringify(mapResponse, null, 2));
      
      // Check the format of the response
      // Format #1: Direct array of [address, jsonString] pairs
      // Format #2: { data: [[address, jsonString], ...] }
      let userData = null;
      
      if (Array.isArray(mapResponse)) {
        console.log("Direct array format detected");
        userData = mapResponse;
      } else if (mapResponse?.data && Array.isArray(mapResponse.data)) {
        console.log("Wrapped data array format detected");
        userData = mapResponse.data;
      }
      
      if (!userData) {
        console.error("Invalid response format:", mapResponse);
        toast.error("Failed to retrieve user data. Please try again.");
        setLoading(false);
        return;
      }
      
      console.log(`Processing ${userData.length} user entries`);
      
      // Search for the referral code directly
      let foundReferrer = false;
      let referrerAddress = '';
      let referrerData = null;
      
      // Iterate through all users to find the matching referral code
      for (const entry of userData) {
        try {
          // Extract address and data based on format
          const userAddress = entry[0];
          const userDataString = entry[1];
          
          console.log(`Processing user ${userAddress}`);
          
          try {
            const userData = JSON.parse(userDataString);
            console.log(`Checking user ${userAddress} for code: ${userData.referralCode}`);
            
            if (userData.referralCode === referralInput) {
              // Check if the user is trying to use their own code
              if (userAddress === walletAddress) {
                toast.error("You cannot use your own referral code");
                setLoading(false);
                return;
              }
              
              // Found the referrer
              foundReferrer = true;
              referrerAddress = userAddress;
              referrerData = userData;
              break;
            }
          } catch (e) {
            console.error(`Error parsing data for user ${userAddress}:`, e);
          }
        } catch (e) {
          console.error(`Error processing user entry:`, e);
        }
      }
      
      if (!foundReferrer) {
        toast.error("Invalid referral code. Please try again.");
        setLoading(false);
        return;
      }
      
      console.log("Found referrer with matching code:", {
        referrerAddress,
        referrerCode: referralInput
      });
      
      // Update the current user's data to include who referred them
      const currentData = userMapData || {};
      const updatedUserData: ReferralData = {
        ...currentData,
        referredBy: referrerAddress,
        referralAppliedAt: new Date().toISOString() // Track when the code was applied
      };
      
      console.log("Updating current user data with referrer:", updatedUserData);
      
      // Store the updated user data
      const userUpdateResult = await client.execute(
        walletAddress,
        contractAddress,
        {
          update: { value: JSON.stringify(updatedUserData) }
        },
        'auto'
      );
      
      console.log("User update transaction:", userUpdateResult);
      
      // Update the referrer's data to include this user in their referrals
      // Handle different referral data formats
      let currentReferrals: string[] = [];
      
      if (referrerData.referrals) {
        if (Array.isArray(referrerData.referrals)) {
          // Format 1: array of addresses
          currentReferrals = [...referrerData.referrals];
        } else if (typeof referrerData.referrals === 'object') {
          // Format 2: object with addresses as keys
          currentReferrals = Object.keys(referrerData.referrals);
        }
      }
      
      // Check if user is already in referrals
      if (!currentReferrals.includes(walletAddress)) {
        // Add the new referral and update rewards
        const updatedReferrerData = {
          ...referrerData,
          referrals: [...currentReferrals, walletAddress],
          // Include reward data if needed
          rewards: {
            pending: (referrerData.rewards?.pending || 0) + rewardAmount,
            claimed: referrerData.rewards?.claimed || 0
          }
        };
        
        console.log("Updating referrer data with new referral:", updatedReferrerData);
        
        // Store the updated referrer data - Use a separate call from the referrer's wallet
        // Note: We can't update another user's data directly, we need admin rights
        // Let's use update instead and notify the user
        console.log("Can't directly update referrer's data - would need admin rights");
        toast.info("Referral applied! The referrer will need to refresh their account to see you.");
        
        // For a proper implementation in production, you would need:
        // 1. Either admin rights to update other users' data
        // 2. Or a backend service that can handle this update
        // 3. Or a specific contract method that accepts updates from referred users
        
        console.log("Skipping referrer update - requires admin rights or contract modification");
      }
      
      // Update local state immediately for responsive UI
      setReferredBy(referrerAddress);
      setUserMapData(updatedUserData);
      setError(null); // Clear any existing errors
      toast.success(`Referral code applied successfully! You've been referred by ${referrerAddress.substring(0, 10)}...`);
      
      // Verify the referral was actually recorded in the blockchain
      // Add a small delay to ensure blockchain state is updated
      setTimeout(async () => {
        console.log("Verifying referral application in blockchain...");
        const confirmedReferrer = await checkReferralStatus();
        
        if (confirmedReferrer) {
          console.log("Referral confirmed in blockchain:", confirmedReferrer);
          // Update UI with confirmed data
          setReferredBy(confirmedReferrer);
          
          // Also refresh all user data
          await fetchUserData();
        } else {
          console.warn("Referral not found in blockchain after application. Retrying...");
          // Try once more after a longer delay
          setTimeout(fetchUserData, 2000);
        }
      }, 1500);
      
    } catch (e) {
      console.error("Failed to apply referral code:", e);
      
      // Extract a more user-friendly error message
      let errorMessage = "Failed to apply referral code";
      let isFatalError = true;
      
      if (e instanceof Error) {
        const errorStr = e.message;
        
        // Check for known errors related to the contract limitations
        if (errorStr.includes("unknown variant `update_for`")) {
          // This is an expected limitation - the contract doesn't support updating other users directly
          errorMessage = "Note: The referrer will see you as a referral after they refresh their account";
          isFatalError = false;
          // Don't treat this as an error since we expect this behavior and handle it gracefully
          console.log("This is an expected limitation, not displaying as error");
        } else if (errorStr.includes("insufficient funds")) {
          errorMessage = "Insufficient funds to complete the transaction";
        } else if (errorStr.includes("unauthorized")) {
          errorMessage = "You don't have permission to perform this action";
        } else if (errorStr.includes("already referred")) {
          errorMessage = "You have already been referred by someone";
        }
      }
      
      if (isFatalError) {
        setError(`${errorMessage}`);
        toast.error(errorMessage);
      } else {
        // For non-fatal errors, just log them but don't show error messages to users
        console.log("Non-fatal error:", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Copy referral code to clipboard
  const copyToClipboard = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopiedToClipboard(true);
      toast.info("Referral code copied to clipboard!");
      setTimeout(() => setCopiedToClipboard(false), 3000);
    }
  };

  // Fetch user data when wallet is connected
  useEffect(() => {
    if (walletAddress && queryClient) {
      fetchUserData();
    }
  }, [walletAddress, queryClient]);

  // Function to check if a user has been referred
  const checkReferralStatus = async () => {
    if (!walletAddress || !queryClient) return null;
    
    try {
      console.log("Checking referral status for:", walletAddress);
      
      // Query user data from blockchain
      const response = await queryClient.queryContractSmart(contractAddress, {
        get_value_by_user: { address: walletAddress }
      });
      
      let userData = null;
      // Parse the response 
      if (typeof response === 'string') {
        userData = JSON.parse(response);
      } else if (response?.value) {
        userData = JSON.parse(response.value);
      } else if (response?.data) {
        userData = JSON.parse(response.data);
      }
      
      return userData?.referredBy || null;
    } catch (e) {
      console.error("Error checking referral status:", e);
      return null;
    }
  };

  // Function to find all users who have been referred by the current user
  const findReferredUsers = async () => {
    if (!walletAddress || !queryClient) return [];
    
    try {
      console.log("Finding users referred by:", walletAddress);
      
      // Get all user data from User Map using the GetMap query
      const mapResponse = await queryClient.queryContractSmart(contractAddress, {
        get_map: {}
      });
      
      // Check the format of the response and extract user data
      let userData = null;
      
      if (Array.isArray(mapResponse)) {
        userData = mapResponse;
      } else if (mapResponse?.data && Array.isArray(mapResponse.data)) {
        userData = mapResponse.data;
      }
      
      if (!userData) {
        console.error("Invalid GetMap response format:", mapResponse);
        return [];
      }
      
      console.log(`Searching ${userData.length} user entries for referrals to ${walletAddress}`);
      
      // Array to store addresses of referred users
      const referredUsers = [];
      
      // Iterate through all users
      for (const entry of userData) {
        try {
          // Extract address and data
          const userAddress = entry[0];
          const userDataString = entry[1];
          
          // Skip if this is our own address
          if (userAddress === walletAddress) continue;
          
          try {
            const userData = JSON.parse(userDataString);
            
            // Check if this user was referred by the current wallet address
            if (userData.referredBy === walletAddress) {
              console.log(`Found user ${userAddress} was referred by current user`);
              referredUsers.push(userAddress);
            }
          } catch (e) {
            console.error(`Error parsing data for user ${userAddress}:`, e);
          }
        } catch (e) {
          console.error(`Error processing user entry:`, e);
        }
      }
      
      console.log(`Found ${referredUsers.length} users referred by current address`);
      return referredUsers;
    } catch (e) {
      console.error("Error finding referred users:", e);
      return [];
    }
  };

  // Default login prompt with minimal design
  const defaultLoginPrompt = (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      maxWidth: '320px',
      margin: '0 auto',
      textAlign: 'center' as const,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        backgroundColor: '#000000',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 12px'
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="#ffffff">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 style={{
        fontSize: '16px',
        fontWeight: '600',
        color: '#000000',
        margin: '0 0 8px'
      }}>Connect Wallet</h2>
      <p style={{
        fontSize: '14px',
        color: '#666666',
        margin: '0',
        lineHeight: '1.4'
      }}>
        Connect your wallet to access referrals
      </p>
    </div>
  );

  // If not connected to wallet
  if (!account) {
    return <>{loginPromptComponent || defaultLoginPrompt}</>;
  }

  // Set up an interval to refresh referral data 
  useEffect(() => {
    if (!walletAddress || !queryClient || !referralCode) {
      return;
    }
    
    console.log("Starting periodic referral data refresh");
    
    // Do an initial check for referred users
    findReferredUsers().then(referredUsers => {
      setReferralCount(referredUsers.length);
    });
    
    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(async () => {
      console.log("Refreshing referral data...");
      const referredUsers = await findReferredUsers();
      
      if (referredUsers.length !== referralCount) {
        console.log(`Referral count changed from ${referralCount} to ${referredUsers.length}`);
        setReferralCount(referredUsers.length);
        
        // If there are new referrals, show a notification
        if (referredUsers.length > referralCount) {
          toast.info(`You have ${referredUsers.length} referrals now!`);
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(intervalId);
      console.log("Stopped periodic referral data refresh");
    };
  }, [walletAddress, queryClient, referralCode, referralCount]);

  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      maxWidth: '320px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f3f4f6'
      }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#000000',
          margin: '0',
          textAlign: 'center' as const
        }}>Referral System</h2>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            <p style={{
              color: '#dc2626',
              fontSize: '12px',
              margin: '0'
            }}>{error}</p>
          </div>
        )}

        {/* User Name */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '12px',
            color: '#666666',
            marginBottom: '4px'
          }}>Connected Account</div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: '#000000',
            backgroundColor: '#f8f9fa',
            padding: '8px',
            borderRadius: '4px',
            wordBreak: 'break-all' as const
          }}>
            {walletAddress}
          </div>
        </div>

        {/* Referral Code Section */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '12px',
            color: '#666666',
            marginBottom: '8px'
          }}>Your Referral Code</div>
          
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '20px 0'
            }}>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #f3f4f6',
                borderTop: '2px solid #000000',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : referralCode ? (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#000000',
                  backgroundColor: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '4px',
                  flex: '1',
                  marginRight: '8px',
                  wordBreak: 'break-all' as const
                }}>
                  {referralCode}
                </div>
                <button
                  onClick={copyToClipboard}
                  style={{
                    padding: '8px',
                    backgroundColor: copiedToClipboard ? '#22c55e' : '#f3f4f6',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!copiedToClipboard) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!copiedToClipboard) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                >
                  {copiedToClipboard ? (
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="#ffffff">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                    </svg>
                  )}
                </button>
              </div>
              
              <div style={{
                fontSize: '10px',
                color: '#999999',
                marginBottom: '8px'
              }}>
                Share this code: {referralCode}
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 8px',
                  borderRadius: '12px'
                }}>
                  {referralCount} referrals
                </div>
                <button
                  onClick={async () => {
                    setRefreshing(true);
                    const referredUsers = await findReferredUsers();
                    setReferralCount(referredUsers.length);
                    setRefreshing(false);
                  }}
                  disabled={refreshing}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: refreshing ? '#999999' : '#666666',
                    fontSize: '11px',
                    cursor: refreshing ? 'not-allowed' : 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!refreshing) {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!refreshing) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {refreshing ? (
                    <>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        border: '1px solid #cccccc',
                        borderTop: '1px solid #666666',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginRight: '4px'
                      }}></div>
                      Searching...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{
                fontSize: '12px',
                color: '#666666',
                margin: '0 0 12px'
              }}>
                Generate a code to start inviting friends
              </p>
              <button
                onClick={generateReferralCode}
                disabled={generating}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: generating ? '#f3f4f6' : '#000000',
                  color: generating ? '#666666' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!generating) {
                    e.currentTarget.style.backgroundColor = '#333333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!generating) {
                    e.currentTarget.style.backgroundColor = '#000000';
                  }
                }}
              >
                {generating ? (
                  <>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid #cccccc',
                      borderTop: '2px solid #666666',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    Generating...
                  </>
                ) : (
                  'Generate Code'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Number of Referrals */}
        {referralCode && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '12px',
              color: '#666666',
              marginBottom: '4px'
            }}>Total Referrals</div>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#000000'
            }}>
              {referralCount}
            </div>
          </div>
        )}

        {/* Submit Referral Code Area */}
        {!referredBy && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '12px',
              color: '#666666',
              marginBottom: '8px'
            }}>Enter Referral Code</div>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value)}
                placeholder="Enter code"
                style={{
                  flex: '1',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#000000';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
              <button
                onClick={applyReferralCode}
                disabled={loading || !referralInput || Boolean(referralCode && referralInput === referralCode)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: (loading || !referralInput || Boolean(referralCode && referralInput === referralCode)) ? '#f3f4f6' : '#000000',
                  color: (loading || !referralInput || Boolean(referralCode && referralInput === referralCode)) ? '#666666' : '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: (loading || !referralInput || Boolean(referralCode && referralInput === referralCode)) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading && referralInput && !(referralCode && referralInput === referralCode)) {
                    e.currentTarget.style.backgroundColor = '#333333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && referralInput && !(referralCode && referralInput === referralCode)) {
                    e.currentTarget.style.backgroundColor = '#000000';
                  }
                }}
              >
                {loading ? 'Applying...' : 'Apply'}
              </button>
            </div>
          </div>
        )}

        {/* Referred By Status */}
        {referredBy && (
          <div>
            <div style={{
              fontSize: '12px',
              color: '#666666',
              marginBottom: '8px'
            }}>Referred By</div>
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="#22c55e" style={{ marginRight: '6px' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#16a34a'
                }}>Active</span>
              </div>
              <div style={{
                fontFamily: 'monospace',
                fontSize: '10px',
                color: '#000000',
                wordBreak: 'break-all' as const
              }}>
                {referredBy}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferralFlow;
