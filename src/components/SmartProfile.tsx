import React, { useEffect, useState, useRef } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient, useAbstraxionClient } from '@burnt-labs/abstraxion';
import config from '../config';

// Types for user profile data
type UserProfile = {
  avatarUrl: string;
  name: string;
  socials: {
    twitter?: string;
    github?: string;
    [key: string]: string | undefined;
  };
};

// Default profile when no data is available
const DEFAULT_PROFILE: UserProfile = {
  avatarUrl: 'https://via.placeholder.com/150',
  name: 'Anonymous User',
  socials: {}
};

export const SmartProfile: React.FC = () => {
  // Get wallet address and client from XION hooks
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();
  
  // State for profile data and UI
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editableProfile, setEditableProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = config.contractAddress;
  const walletAddress = account?.bech32Address || '';
  
  // Debug logs
  useEffect(() => {
    console.log("SmartProfile mounted with config:", { 
      contractAddress,
      account: account?.bech32Address,
      client: !!client,
      queryClient: !!queryClient 
    });
  }, [contractAddress, account, client, queryClient]);

  // Fetch user profile data from XION User Map
  useEffect(() => {
    if (!walletAddress || !queryClient) return;

    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Query the contract for this user's data
        const response = await queryClient.queryContractSmart(contractAddress, {
          get_value_by_user: { address: walletAddress }
        });

        if (response) {
          try {
            // Parse the JSON response
            const parsedProfile = JSON.parse(response);
            setProfile(parsedProfile);
            setEditableProfile(parsedProfile);
          } catch (e) {
            console.error("Failed to parse profile JSON:", e);
            setProfile(DEFAULT_PROFILE);
            setEditableProfile(DEFAULT_PROFILE);
          }
        } else {
          // No profile found, use default
          setProfile(DEFAULT_PROFILE);
          setEditableProfile(DEFAULT_PROFILE);
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
        setError("Failed to load profile data");
        setProfile(DEFAULT_PROFILE);
        setEditableProfile(DEFAULT_PROFILE);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [walletAddress, queryClient, contractAddress]);
  
  // Reset editable profile when entering edit mode
  useEffect(() => {
    if (isEditing && profile) {
      setEditableProfile(profile);
    }
  }, [isEditing, profile]);

  // Update profile data on the blockchain
  const saveProfile = async () => {
    console.log("saveProfile called", {walletAddress, clientExists: !!client});
    
    // Validate the profile data first
    if (!validateProfile()) {
      // Error is already set by validateProfile
      return;
    }
    
    if (!walletAddress || !client) {
      console.error("Cannot save profile: wallet not connected or client not available");
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert profile to JSON string for storage
      const jsonValue = JSON.stringify(editableProfile);
      console.log("Saving JSON to contract:", jsonValue);
      
      // Create message to update value in the contract
      const msg = { update: { value: jsonValue } };
      
      // Execute contract transaction
      console.log("Executing contract with params:", {
        walletAddress,
        contractAddress,
        msg
      });
      
      const result = await client.execute(
        walletAddress,
        contractAddress,
        msg,
        "auto"
      );

      if (result) {
        setProfile(editableProfile);
        setIsEditing(false);
        console.log("Profile updated successfully:", result);
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
      setError("Failed to save profile data: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  };

  // Validate profile data
  const validateProfile = (): boolean => {
    // Reset any previous errors
    setError(null);
    
    // Check required fields
    if (!editableProfile.name?.trim()) {
      setError("Please enter a display name");
      return false;
    }
    
    if (!editableProfile.avatarUrl?.trim()) {
      setError("Please enter a profile image URL");
      return false;
    }
    
    // Validate social links - make sure all have platform names and URLs
    const socials = editableProfile.socials || {};
    for (const [platform, url] of Object.entries(socials)) {
      if (!platform?.trim()) {
        setError("All social links must have a platform name");
        return false;
      }
      
      if (!url?.trim()) {
        setError(`Please enter a URL for ${platform} or remove it`);
        return false;
      }
      
      // Simple URL validation
      try {
        new URL(url);
      } catch (e) {
        setError(`The URL for ${platform} is not valid`);
        return false;
      }
    }
    
    return true;
  };

  if (!walletAddress) {
    return (
      <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
        <p className="text-center text-gray-600">Please connect your wallet to view your profile</p>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
        <p className="text-center text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md p-6 mx-auto bg-white rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {!isEditing ? (
        // Read-only profile view
        <div className="profile-view-container bg-white p-4 rounded-lg">
          <div className="flex flex-col items-center">
            <img 
              src={profile?.avatarUrl || DEFAULT_PROFILE.avatarUrl} 
              alt="Profile" 
              className="w-24 h-24 rounded-full mb-4 object-cover border-2 border-gray-200"
            />
            <h2 className="text-xl font-semibold mb-2">
              {profile?.name || DEFAULT_PROFILE.name}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
            </p>
          </div>

          {profile?.socials && Object.keys(profile.socials).length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-700 mb-2">Social Links</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.entries(profile.socials).map(([platform, link], index) => (
                  link ? (
                    <a 
                      key={index} 
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
                    >
                      {platform}
                    </a>
                  ) : null
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => {
                console.log("Edit Profile button clicked");
                setIsEditing(true);
                // The useEffect will update the textarea content
              }}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      ) : (
        // User-friendly form with input fields
        <div className="edit-profile-form space-y-5 bg-white p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Edit Your Profile</h3>
          
          {/* Basic Profile Info */}
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={editableProfile.name}
                onChange={(e) => setEditableProfile({...editableProfile, name: e.target.value})}
                className="w-full p-2 border rounded focus:ring focus:ring-opacity-50 focus:ring-blue-500"
                placeholder="Your Name"
              />
            </div>
            
            {/* Avatar URL */}
            <div>
              <label htmlFor="profile-avatar" className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image URL
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <img 
                    src={editableProfile.avatarUrl || 'https://via.placeholder.com/40'} 
                    alt="Avatar Preview"
                    className="w-10 h-10 rounded-full object-cover border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40';
                    }}
                  />
                </div>
                <input
                  id="profile-avatar"
                  type="text"
                  value={editableProfile.avatarUrl}
                  onChange={(e) => setEditableProfile({...editableProfile, avatarUrl: e.target.value})}
                  className="flex-grow p-2 border rounded focus:ring focus:ring-opacity-50 focus:ring-blue-500"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the URL to your profile image. Preview shown to the left.
              </p>
            </div>
          </div>
          
          {/* Social Links Section */}
          <div className="pt-2">
            <h4 className="font-medium text-gray-700 mb-3">Social Links</h4>
            
            {/* Existing Social Links */}
            {Object.entries(editableProfile.socials || {}).map(([platform, url], index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => {
                    const newSocials = {...editableProfile.socials};
                    delete newSocials[platform];
                    newSocials[e.target.value] = url;
                    setEditableProfile({...editableProfile, socials: newSocials});
                  }}
                  className="w-1/3 p-2 border rounded focus:ring focus:ring-blue-500"
                  placeholder="Platform name"
                />
                <input
                  type="text"
                  value={url as string}
                  onChange={(e) => {
                    const newSocials = {...editableProfile.socials};
                    newSocials[platform] = e.target.value;
                    setEditableProfile({...editableProfile, socials: newSocials});
                  }}
                  className="flex-grow p-2 border rounded focus:ring focus:ring-blue-500"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSocials = {...editableProfile.socials};
                    delete newSocials[platform];
                    setEditableProfile({...editableProfile, socials: newSocials});
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Remove social link"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ))}
            
            {/* Add New Social Link Button */}
            <button
              type="button"
              onClick={() => {
                const newSocials = {...editableProfile.socials};
                newSocials[`platform${Object.keys(newSocials).length + 1}`] = '';
                setEditableProfile({...editableProfile, socials: newSocials});
              }}
              className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Social Link
            </button>
          </div>
          
          <div className="bg-blue-50 p-3 rounded text-sm">
            <h4 className="font-medium text-blue-800">Profile Tips</h4>
            <ul className="list-disc list-inside text-blue-600 space-y-1 mt-1">
              <li>Add a clear profile picture for better recognition</li>
              <li>Use your preferred display name</li>
              <li>Add social links where people can find you</li>
            </ul>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => {
                console.log("Cancel button clicked");
                setIsEditing(false);
                setEditableProfile(profile || DEFAULT_PROFILE);
                setError(null); // Clear any errors when canceling
              }}
              className="w-1/2 border border-gray-300 bg-white text-gray-700 py-2 px-4 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                console.log("Save Profile button clicked");
                saveProfile();
              }}
              className="w-1/2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartProfile;
