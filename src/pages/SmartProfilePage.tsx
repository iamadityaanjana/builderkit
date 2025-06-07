import React from 'react';
import SmartProfile from '../components/SmartProfile';

const SmartProfilePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">XION User Map Profile</h1>
        <p className="text-gray-600">
          Your on-chain identity powered by XION User Map
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto">
        
        
        <SmartProfile />
      </div>
    </div>
  );
};

export default SmartProfilePage;
