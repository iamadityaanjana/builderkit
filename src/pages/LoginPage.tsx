import React from 'react';
import { XionLogin } from '../components/XionLogin';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <XionLogin />
      </div>
    </div>
  );
};
