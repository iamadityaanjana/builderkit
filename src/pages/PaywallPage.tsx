import React from 'react';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import Paywall from '../components/Paywall';

export const PaywallPage: React.FC = () => {
  const { data: account } = useAbstraxionAccount();
  const walletAddress = account?.bech32Address;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">XION Paywall Demo</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">What is this?</h2>
          
        </div>
        
        {walletAddress ? (
          <div className="mb-3 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              Connected as: <span className="font-mono">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
            </p>
          </div>
        ) : (
          <div className="mb-3 p-3 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-800">
              Please connect your wallet to interact with the paywall.
            </p>
          </div>
        )}
        
        <div className="mb-10 space-y-8">
          {/* Example 1: Article */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-semibold">Example 1: Premium Article</h3>
            </div>
            
            <div className="p-4">
              <Paywall 
                contentId="article-123"
                contentPrice="0.1"
                contentTitle="Premium Article: Web3 in 2025"
                contentDescription="Get access to this in-depth analysis of Web3 trends"
              >
                <div className="prose">
                  <h3 className="text-xl font-bold">Web3 Market Trends in 2025</h3>
                  <p>The landscape of Web3 has evolved dramatically over the past few years. With the mainstream adoption of blockchain technology across various industries, we're seeing unprecedented growth in:</p>
                  
                  <ul className="list-disc pl-5 my-3">
                    <li>Decentralized finance protocols handling trillions in total value locked</li>
                    <li>Web3 identity solutions becoming standard across both decentralized and traditional applications</li>
                    <li>Consumer-facing applications abstracting complexity with seamless UX</li>
                    <li>Regulatory frameworks that support innovation while providing consumer protections</li>
                  </ul>
                  
                  <p>The rapid adoption of Web3 technologies can be attributed to several key innovations:</p>
                  
                  <h4 className="font-bold mt-4">1. The Rise of Account Abstraction</h4>
                  <p>Account abstraction has revolutionized how users interact with blockchain technology, removing the complexity of managing private keys and gas fees. This has opened the door to mainstream users who previously found crypto too complicated.</p>
                  
                  <h4 className="font-bold mt-4">2. Interoperability as Standard</h4>
                  <p>The ability for different chains to seamlessly communicate and transfer assets has created a truly connected ecosystem where users can move between platforms without friction.</p>
                </div>
              </Paywall>
            </div>
          </div>
          
          {/* Example 2: Video Course */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-semibold">Example 2: Video Course</h3>
            </div>
            
            <div className="p-4">
              <Paywall 
                contentId="course-456"
                contentPrice="0.5"
                contentTitle="Blockchain Development Masterclass"
                contentDescription="Get lifetime access to our comprehensive video course"
              >
                <div>
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-center p-8">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" className="mx-auto text-gray-400 mb-2" viewBox="0 0 16 16">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
                      </svg>
                      <p className="text-gray-600">Video Player Placeholder</p>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">Blockchain Development Masterclass</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="border rounded p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-900">Module 1: Introduction</h4>
                      <p className="text-sm text-gray-600">Foundation concepts and environment setup</p>
                    </div>
                    <div className="border rounded p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-900">Module 2: Smart Contracts</h4>
                      <p className="text-sm text-gray-600">Writing and deploying your first contract</p>
                    </div>
                    <div className="border rounded p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-900">Module 3: Frontend Integration</h4>
                      <p className="text-sm text-gray-600">Connecting your dApp to web interfaces</p>
                    </div>
                    <div className="border rounded p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-900">Module 4: Security Best Practices</h4>
                      <p className="text-sm text-gray-600">Protecting your applications from vulnerabilities</p>
                    </div>
                  </div>
                </div>
              </Paywall>
            </div>
          </div>
        </div>
        
       
          
          
       
      </div>
    </div>
  );
};

export default PaywallPage;
