import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Navigation: React.FC = () => {
  const location = useLocation();
  
  // Function to check if a link is active
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="text-gray-800 font-bold text-lg">Xion Builder Kit Demo</div>
          <div className="flex space-x-6">
            <Link
              to="/"
              className={`${
                isActive('/') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              } transition-colors py-2 px-1`}
            >
              Home
            </Link>
            <Link
              to="/checkout"
              className={`${
                isActive('/checkout') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              } transition-colors py-2 px-1`}
            >
              Checkout
            </Link>
            <Link
              to="/nft-access"
              className={`${
                isActive('/nft-access') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              } transition-colors py-2 px-1`}
            >
              NFT Access
            </Link>
            <Link
              to="/smart-profile"
              className={`${
                isActive('/smart-profile') 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              } transition-colors py-2 px-1`}
            >
              Smart Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
