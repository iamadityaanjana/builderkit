/**
 * SmartProfile Component
 * 
 * A minimal, customizable user profile component that stores data on-chain using XION User Map.
 * Features pure CSS styling and supports unlimited custom fields.
 * 
 * Props:
 * - customFields: Array of field configurations to add to the profile
 * - loginPromptComponent: Custom component to show when wallet is not connected
 * 
 * Custom Field Types:
 * - text: Regular text input
 * - textarea: Multi-line text input  
 * - url: URL input with validation
 * - email: Email input with validation
 * 
 * Example Usage:
 * ```tsx
 * const customFields = [
 *   { key: 'bio', label: 'Bio', type: 'textarea', placeholder: 'Tell us about yourself...', required: false },
 *   { key: 'age', label: 'Age', type: 'text', placeholder: 'Your age', required: false },
 *   { key: 'website', label: 'Website', type: 'url', placeholder: 'https://yoursite.com', required: false }
 * ];
 * 
 * <SmartProfile customFields={customFields} />
 * ```
 */
import React, { useEffect, useState } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient, useAbstraxionClient } from '@burnt-labs/abstraxion';
import { toast } from 'react-toastify';
import config from '../config';

// Types for custom field configuration
interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'url' | 'email' | 'textarea';
  placeholder?: string;
  required?: boolean;
}

// Types for user profile data
type UserProfile = {
  avatarUrl: string;
  name: string;
  socials: {
    [key: string]: string | undefined;
  };
  [key: string]: any; // Allow custom fields
};

// Default profile when no data is available
const DEFAULT_PROFILE: UserProfile = {
  avatarUrl: 'https://via.placeholder.com/150',
  name: 'Anonymous User',
  socials: {}
};

interface SmartProfileProps {
  customFields?: CustomField[];
  loginPromptComponent?: React.ReactNode;
}

export const SmartProfile: React.FC<SmartProfileProps> = ({
  customFields = [],
  loginPromptComponent
}) => {
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
            // Handle different response formats
            let responseValue;
            if (typeof response === 'string') {
              responseValue = response;
            } else if (response?.value) {
              responseValue = response.value;
            } else if (response?.data) {
              responseValue = response.data;
            }

            if (responseValue) {
              const parsedProfile = JSON.parse(responseValue);
              setProfile(parsedProfile);
              setEditableProfile(parsedProfile);
            } else {
              setProfile(DEFAULT_PROFILE);
              setEditableProfile(DEFAULT_PROFILE);
            }
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
        toast.success("Profile updated successfully!");
      }
    } catch (e) {
      console.error("Failed to update profile:", e);
      const errorMessage = "Failed to save profile data: " + (e instanceof Error ? e.message : String(e));
      setError(errorMessage);
      toast.error(errorMessage);
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
    
    // Validate custom fields
    for (const field of customFields) {
      if (field.required && !editableProfile[field.key]?.trim()) {
        setError(`${field.label} is required`);
        return false;
      }
      
      // Validate URL fields
      if (field.type === 'url' && editableProfile[field.key]?.trim()) {
        try {
          new URL(editableProfile[field.key]);
        } catch (e) {
          setError(`${field.label} must be a valid URL`);
          return false;
        }
      }
      
      // Validate email fields
      if (field.type === 'email' && editableProfile[field.key]?.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editableProfile[field.key])) {
          setError(`${field.label} must be a valid email address`);
          return false;
        }
      }
    }
    
    // Validate social links
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
        Connect your wallet to view your profile
      </p>
    </div>
  );

  if (!walletAddress) {
    return <>{loginPromptComponent || defaultLoginPrompt}</>;
  }

  if (loading && !profile) {
    return (
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        maxWidth: '320px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center' as const,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid #f3f4f6',
          borderTop: '2px solid #000000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{
          color: '#666666',
          fontSize: '14px',
          margin: '0'
        }}>Loading profile...</p>
      </div>
    );
  }

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
        }}>User Profile</h2>
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

        {!isEditing ? (
          // Profile View
          <div>
            {/* Avatar and Basic Info */}
            <div style={{
              textAlign: 'center' as const,
              marginBottom: '16px'
            }}>
              <img 
                src={profile?.avatarUrl || DEFAULT_PROFILE.avatarUrl} 
                alt="Profile" 
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  objectFit: 'cover' as const,
                  border: '2px solid #e5e7eb',
                  marginBottom: '8px',
                  display: 'block',
                  margin: '0 auto 8px auto'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_PROFILE.avatarUrl;
                }}
              />
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#000000',
                marginBottom: '4px'
              }}>
                {profile?.name || DEFAULT_PROFILE.name}
              </div>
              <div style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#666666'
              }}>
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              </div>
            </div>

            {/* Custom Fields */}
            {customFields.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                {customFields.map((field) => {
                  const value = profile?.[field.key];
                  if (!value) return null;
                  
                  return (
                    <div key={field.key} style={{ marginBottom: '8px' }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#666666',
                        marginBottom: '2px'
                      }}>
                        {field.label}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#000000',
                        backgroundColor: '#f8f9fa',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        wordBreak: field.type === 'textarea' ? 'break-word' as const : 'break-all' as const
                      }}>
                        {field.type === 'url' ? (
                          <a 
                            href={value} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{
                              color: '#000000',
                              textDecoration: 'none'
                            }}
                          >
                            {value}
                          </a>
                        ) : field.type === 'email' ? (
                          <a 
                            href={`mailto:${value}`}
                            style={{
                              color: '#000000',
                              textDecoration: 'none'
                            }}
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Social Links */}
            {profile?.socials && Object.keys(profile.socials).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '12px',
                  color: '#666666',
                  marginBottom: '8px'
                }}>Social Links</div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap' as const,
                  gap: '6px'
                }}>
                  {Object.entries(profile.socials).map(([platform, link], index) => (
                    link ? (
                      <a 
                        key={index} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f3f4f6',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#000000',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                      >
                        {platform}
                      </a>
                    ) : null
                  ))}
                </div>
              </div>
            )}

            {/* Edit Button */}
            <button 
              onClick={() => {
                console.log("Edit Profile button clicked");
                setIsEditing(true);
                if (profile) {
                  setEditableProfile(profile);
                }
              }}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#333333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000000';
              }}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          // Edit Form
          <div>
            {/* Name Field */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '12px',
                color: '#666666',
                marginBottom: '4px'
              }}>Display Name</div>
              <input
                type="text"
                value={editableProfile.name}
                onChange={(e) => setEditableProfile({...editableProfile, name: e.target.value})}
                placeholder="Your Name"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box' as const
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#000000';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
            </div>

            {/* Avatar URL */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '12px',
                color: '#666666',
                marginBottom: '4px'
              }}>Profile Image URL</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <img 
                  src={editableProfile.avatarUrl || DEFAULT_PROFILE.avatarUrl} 
                  alt="Avatar Preview"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    objectFit: 'cover' as const,
                    border: '1px solid #d1d5db',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_PROFILE.avatarUrl;
                  }}
                />
                <input
                  type="text"
                  value={editableProfile.avatarUrl}
                  onChange={(e) => setEditableProfile({...editableProfile, avatarUrl: e.target.value})}
                  placeholder="https://example.com/avatar.jpg"
                  style={{
                    flex: 1,
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
              </div>
            </div>

            {/* Custom Fields */}
            {customFields.map((field) => (
              <div key={field.key} style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '12px',
                  color: '#666666',
                  marginBottom: '4px'
                }}>
                  {field.label}{field.required && ' *'}
                </div>
                {field.type === 'textarea' ? (
                  <textarea
                    value={editableProfile[field.key] || ''}
                    onChange={(e) => setEditableProfile({...editableProfile, [field.key]: e.target.value})}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'vertical' as const,
                      boxSizing: 'border-box' as const
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#000000';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={editableProfile[field.key] || ''}
                    onChange={(e) => setEditableProfile({...editableProfile, [field.key]: e.target.value})}
                    placeholder={field.placeholder}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      outline: 'none',
                      boxSizing: 'border-box' as const
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#000000';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                )}
              </div>
            ))}

            {/* Social Links */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '12px',
                color: '#666666',
                marginBottom: '8px'
              }}>Social Links</div>
              
              {/* Existing Social Links */}
              {Object.entries(editableProfile.socials || {}).map(([platform, url], index) => (
                <div key={index} style={{
                  display: 'flex',
                  gap: '6px',
                  marginBottom: '6px'
                }}>
                  <input
                    type="text"
                    value={platform}
                    onChange={(e) => {
                      const newSocials = {...editableProfile.socials};
                      delete newSocials[platform];
                      newSocials[e.target.value] = url;
                      setEditableProfile({...editableProfile, socials: newSocials});
                    }}
                    placeholder="Platform"
                    style={{
                      flex: '0 0 80px',
                      padding: '6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '11px',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#000000';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  />
                  <input
                    type="text"
                    value={url as string}
                    onChange={(e) => {
                      const newSocials = {...editableProfile.socials};
                      newSocials[platform] = e.target.value;
                      setEditableProfile({...editableProfile, socials: newSocials});
                    }}
                    placeholder="https://..."
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '11px',
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
                    onClick={() => {
                      const newSocials = {...editableProfile.socials};
                      delete newSocials[platform];
                      setEditableProfile({...editableProfile, socials: newSocials});
                    }}
                    style={{
                      padding: '6px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              {/* Add Social Link */}
              <button
                onClick={() => {
                  const newSocials = {...editableProfile.socials};
                  const newKey = `platform${Object.keys(newSocials).length + 1}`;
                  newSocials[newKey] = '';
                  setEditableProfile({...editableProfile, socials: newSocials});
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  color: '#666666',
                  cursor: 'pointer',
                  fontSize: '11px',
                  marginTop: '4px'
                }}
              >
                + Add Social
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '16px'
            }}>
              <button
                onClick={() => {
                  console.log("Cancel button clicked");
                  setIsEditing(false);
                  setEditableProfile(profile || DEFAULT_PROFILE);
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#f3f4f6',
                  color: '#666666',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log("Save Profile button clicked");
                  saveProfile();
                }}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: loading ? '#f3f4f6' : '#000000',
                  color: loading ? '#666666' : '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#333333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#000000';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid #cccccc',
                      borderTop: '2px solid #666666',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '6px'
                    }}></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartProfile;
