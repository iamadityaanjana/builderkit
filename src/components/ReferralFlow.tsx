import React, { useEffect, useState } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient, useAbstraxionClient } from '@burnt-labs/abstraxion';
import config from '../config';
import { toast } from 'react-toastify';

// Types for referral data stored in User Map
interface ReferralData {
  referralCode?: string;
  referredBy?: string;
  referrals?: string[];
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
  const [referralUrl, setReferralUrl] = useState<string>('');
  const [referralCount, setReferralCount] = useState<number>(0);
  const [referredBy, setReferredBy] = useState<string>('');

  // State for UI management
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [referralInput, setReferralInput] = useState<string>('');
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);
  const [showReferredUsers, setShowReferredUsers] = useState<boolean>(false);
  const [referredUsersDetails, setReferredUsersDetails] = useState<any[]>([]);
  
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
            setReferralUrl(`${window.location.origin}?ref=${data.referralCode}`);
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
      setReferralUrl(`${window.location.origin}?ref=${newCode}`);
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
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      setCopiedToClipboard(true);
      toast.info("Referral link copied to clipboard!");
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

  // Function to get detailed information about referred users
  const getReferredUsersDetails = async () => {
    if (!walletAddress || !queryClient) return [];
    
    try {
      // First, get the list of referred user addresses
      const referredUserAddresses = await findReferredUsers();
      
      if (referredUserAddresses.length === 0) {
        return [];
      }
      
      console.log(`Getting details for ${referredUserAddresses.length} referred users`);
      
      // For each referred user, get their data
      const referredUsersDetails = await Promise.all(
        referredUserAddresses.map(async (address) => {
          try {
            // Get user data
            const response = await queryClient.queryContractSmart(contractAddress, {
              get_value_by_user: { address }
            });
            
            // Parse the response
            let userData = {};
            
            if (typeof response === 'string') {
              userData = JSON.parse(response);
            } else if (response?.value) {
              userData = JSON.parse(response.value);
            } else if (response?.data) {
              userData = JSON.parse(response.data);
            }
            
            return {
              address,
              referralAppliedAt: userData.referralAppliedAt || null,
              ...userData
            };
          } catch (e) {
            console.error(`Error getting details for user ${address}:`, e);
            return {
              address,
              error: "Failed to load user data"
            };
          }
        })
      );
      
      console.log("Retrieved details for referred users:", referredUsersDetails);
      return referredUsersDetails;
    } catch (e) {
      console.error("Error getting referred users details:", e);
      return [];
    }
  };

  // Default login prompt
  const defaultLoginPrompt = (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600 text-center mb-6">
          Please connect your wallet to access the referral system
        </p>
      </div>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center mb-5">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">XION Referral System</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* User's Referral Code Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Referral Code</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : referralCode ? (
              <div>
                <div className="flex items-center mb-3">
                  <div className="bg-gray-100 rounded-lg p-3 flex-grow">
                    <p className="text-sm font-mono select-all">{referralUrl}</p>
                  </div>
                  <button
                    className="ml-2 p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                    onClick={copyToClipboard}
                  >
                    {copiedToClipboard ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mb-3">
                  <div className="flex items-center mb-2">
                    <div className="px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold inline-block">
                      {referralCount} referrals
                    </div>
                    <button 
                      className="ml-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                      onClick={async () => {
                        toast.info("Refreshing referral data...");
                        const referredUsers = await findReferredUsers();
                        setReferralCount(referredUsers.length);
                        toast.success(`You have ${referredUsers.length} referrals`);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    
                    {referralCount > 0 && (
                      <button 
                        className="ml-2 text-xs text-gray-600 hover:text-gray-800 flex items-center"
                        onClick={async () => {
                          const showDetails = !showReferredUsers;
                          setShowReferredUsers(showDetails);
                          
                          if (showDetails) {
                            toast.info("Loading referral details...");
                            const details = await getReferredUsersDetails();
                            setReferredUsersDetails(details);
                          }
                        }}
                      >
                        {showReferredUsers ? 'Hide Details' : 'Show Details'}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showReferredUsers ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Referred Users Details */}
                  {showReferredUsers && referredUsersDetails.length > 0 && (
                    <div className="mt-2 bg-gray-50 p-2 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                      <h4 className="text-xs font-semibold text-gray-600 mb-2">Users who applied your referral code:</h4>
                      <ul className="space-y-2">
                        {referredUsersDetails.map((user, index) => (
                          <li key={index} className="text-xs p-2 bg-white rounded border border-gray-100">
                            <p className="font-mono text-gray-800 break-all">{user.address}</p>
                            {user.referralAppliedAt && (
                              <p className="text-gray-500 mt-1">
                                Applied: {new Date(user.referralAppliedAt).toLocaleString()}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  You don't have a referral code yet. Generate one to start inviting friends.
                </p>
                <button
                  onClick={generateReferralCode}
                  disabled={generating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Referral Code'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Apply Referral Code Section */}
          {!referredBy ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Enter a Referral Code</h3>
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <input
                    type="text"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value)}
                    placeholder="Enter referral code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={applyReferralCode}
                  disabled={loading || !referralInput || Boolean(referralCode && referralInput === referralCode)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              <div className="mt-2">
                <ul className="text-xs text-gray-500 space-y-1">
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    You can apply a referral code only once
                  </li>
                  <li className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    You cannot use your own referral code
                  </li>
                </ul>
              </div>
            </div>
          ) : null /* When a user has a referrer, we don't show this section */}

          {/* Referred By Section */}
          {referredBy && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  You Were Referred By
                </div>
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg border border-green-100">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-mono break-all">{referredBy}</p>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your account is permanently linked to this referrer on the XION blockchain.
                </p>
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-indigo-700">Referral successfully applied to your account</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Referred Users Details Section */}
          {showReferredUsers && referredUsersDetails.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Referred Users Details</h3>
              <div className="space-y-4">
                {referredUsersDetails.map((user) => (
                  <div key={user.address} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-mono break-all">{user.address}</p>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Referred</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Referred on: {new Date(user.referralAppliedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Section */}
          <div className="flex justify-between items-center border-t border-gray-200 pt-4 mt-4">
            <button
              onClick={() => setShowReferredUsers(!showReferredUsers)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {showReferredUsers ? 'Hide' : 'Show'} Referred Users
            </button>
            <button
              onClick={fetchUserData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralFlow;
