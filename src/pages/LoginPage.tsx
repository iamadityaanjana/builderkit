import React from 'react';
import { Link } from 'react-router-dom';
import { XionLogin } from '../components/XionLogin';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="p-4 border-b border-slate-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-lg">XION Demo</div>
          <nav>
            <ul className="flex gap-6">
              <li>
                <Link to="/" className="text-white font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="text-slate-300 hover:text-white transition-colors">
                  Checkout
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
