import React, { type ReactNode } from 'react';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { useNFTAccess } from '../hooks/useNFTAccess';

interface NFTAccessProps {
  nftContractAddress: string;
  tokenId?: string;
  children: ReactNode;
  nftPurchaseLink?: string;
  loadingComponent?: ReactNode;
  loginPromptComponent?: ReactNode;
}

/**
 * NFTAccess - A component to gate content based on NFT ownership
 * 
 * This component restricts access to its children based on whether the user
 * owns a specified NFT or an NFT from a specified collection.
 */
export const NFTAccess: React.FC<NFTAccessProps> = ({
  nftContractAddress,
  tokenId,
  children,
  nftPurchaseLink = "https://marketplace.burnt.com/collections",
  loadingComponent,
  loginPromptComponent
}) => {
  const { data: account } = useAbstraxionAccount();
  
  const { hasAccess, isLoading } = useNFTAccess(
    nftContractAddress,
    tokenId,
    account?.bech32Address
  );

  // Add CSS keyframes for spinner animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Default loading component - refined and compact
  const defaultLoadingComponent = (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid black',
          width: '320px',
          textAlign: 'center'
        }}
      >
        <div 
          style={{
            width: '32px',
            height: '32px',
            border: '2px solid #e5e7eb',
            borderTopColor: 'black',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <p 
          style={{
            color: 'black',
            fontSize: '14px',
            margin: 0
          }}
        >
          Checking NFT ownership...
        </p>
      </div>
    </div>
  );

  // Default login prompt - refined and compact
  const defaultLoginPrompt = (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid black',
          width: '320px',
          textAlign: 'center'
        }}
      >
        <p 
          style={{
            color: 'black',
            fontSize: '14px',
            marginBottom: '24px',
            margin: '0 0 24px 0'
          }}
        >
          Please connect your wallet to verify NFT ownership
        </p>
        <button 
          style={{
            width: '100%',
            backgroundColor: 'black',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            const event = new CustomEvent('abstraxion:open');
            window.dispatchEvent(event);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'black';
          }}
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );

  // If not connected to wallet
  if (!account) {
    return <>{loginPromptComponent || defaultLoginPrompt}</>;
  }

  // While checking ownership
  if (isLoading) {
    return <>{loadingComponent || defaultLoadingComponent}</>;
  }

  // If user has NFT access - show congratulations message
  if (hasAccess) {
    return (
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb'
        }}
      >
        <div 
          style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            border: '1px solid black',
            width: '320px',
            textAlign: 'center'
          }}
        >
          <div 
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <svg 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{
                width: '24px',
                height: '24px',
                color: '#16a34a'
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'black',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}
          >
            Congratulations!
          </h2>
          <p 
            style={{
              color: 'black',
              fontSize: '14px',
              marginBottom: '24px',
              margin: '0 0 24px 0'
            }}
          >
            You have access to the content
          </p>
          <div style={{ width: '100%' }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // If user doesn't have access - show the clean access denied design matching the image
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '32px',
          borderRadius: '8px',
          border: '1px solid black',
          width: '320px',
          textAlign: 'center'
        }}
      >
        {/* Lock Icon */}
        <div 
          style={{
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}
        >
          <svg 
            fill="currentColor" 
            viewBox="0 0 24 24"
            style={{
              width: '48px',
              height: '48px',
              color: 'black'
            }}
          >
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </div>
        
        {/* Access Denied Text */}
        <h2 
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'black',
            marginBottom: '16px',
            margin: '0 0 16px 0'
          }}
        >
          Access denied
        </h2>
        <p 
          style={{
            color: 'black',
            fontSize: '14px',
            marginBottom: '12px',
            margin: '0 0 12px 0'
          }}
        >
          NFT ownership required to view this content.
        </p>
        
        {/* Get the NFT Button */}
        <a
          href={nftPurchaseLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            width: '100%',
            backgroundColor: 'black',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'black';
          }}
        >
          Get the NFT
        </a>
      </div>
    </div>
  );
};
