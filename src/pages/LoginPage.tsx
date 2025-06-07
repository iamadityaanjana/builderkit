import React from 'react';
import { Link } from 'react-router-dom';
import { XionLogin } from '../components/XionLogin';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-gray-800 font-bold text-lg">Xion Builder Kit Demo</div>
          <nav>
            <ul className="flex gap-6">
              <li>
                <Link to="/" className="text-gray-800 font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="text-gray-600 hover:text-gray-800 transition-colors">
                  Checkout
                </Link>
              </li>
              <li>
                <Link to="/nft-access" className="text-gray-600 hover:text-gray-800 transition-colors">
                  NFT Access
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto py-8">
        <XionLogin />
      </div>
    </div>
  );
};
