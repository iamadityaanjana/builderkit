import React from 'react';
import { ReferralFlow } from '../components/ReferralFlow';
import { useAbstraxionAccount, useAbstraxionSigningClient } from '@burnt-labs/abstraxion';

const ReferralFlowPage: React.FC = () => {
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Referral Program</h1>
          <p className="text-gray-600">Invite friends to XION and earn rewards</p>
        </div>
        
        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Referral Flow Component */}
          <div className="md:col-span-2">
            <ReferralFlow rewardAmount={5} />
          </div>
          
          {/* Sidebar Section */}
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">How It Works</h2>
              <ol className="space-y-4">
                <li className="flex items-start">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mr-2 mt-0.5">1</span>
                  <span className="text-gray-600 text-sm">Generate your unique referral code</span>
                </li>
                <li className="flex items-start">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mr-2 mt-0.5">2</span>
                  <span className="text-gray-600 text-sm">Share your referral link with friends</span>
                </li>
                <li className="flex items-start">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mr-2 mt-0.5">3</span>
                  <span className="text-gray-600 text-sm">Friends create an account using your link</span>
                </li>
                <li className="flex items-start">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mr-2 mt-0.5">4</span>
                  <span className="text-gray-600 text-sm">You earn 5 XION tokens for each successful referral</span>
                </li>
                <li className="flex items-start">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold mr-2 mt-0.5">5</span>
                  <span className="text-gray-600 text-sm">Claim your rewards anytime</span>
                </li>
              </ol>
            </div>
            
            {/* Connection Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Connection Status</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Wallet</p>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${account ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-sm">{account ? 'Connected' : 'Not Connected'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
                    {account?.bech32Address || 'Not connected'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Signing Client</p>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${client ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-sm">{client ? 'Ready' : 'Not Ready'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* About On-Chain Referrals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">About On-Chain Referrals</h2>
              <p className="text-sm text-gray-600 mb-3">
                This referral system is fully on-chain, leveraging XION's User Map contract for storing and retrieving referral relationships.
              </p>
              <p className="text-sm text-gray-600 mb-3">
                All data is stored in a decentralized manner, ensuring transparency and persistence of your referral history and rewards.
              </p>
              <p className="text-sm text-gray-600">
                Rewards are also processed on-chain through XION's token transfer mechanism.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralFlowPage;
