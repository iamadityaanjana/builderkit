import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MagicCheckout } from '../components/MagicCheckout';

export const CheckoutPage: React.FC = () => {
  // Enhanced product information
  const productInfo = {
    productId: "product_demo123",
    name: "Premium Membership",
    description: "1-Month XION Premium Membership Subscription",
    amount: "0.01",
    currency: "XION",  // Changed from usdc to XION to match the actual transaction
    imageUrl: "https://placehold.co/400x300/2d3748/white?text=XION+Premium"
  };

  const handlePaymentSuccess = (txHash: string) => {
    console.log('Payment successful with tx hash:', txHash);
    // You can implement additional logic here, like redirecting to a receipt page
  };

  const handlePaymentError = (error: Error) => {
    console.error('Payment failed:', error);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="p-4 border-b border-slate-800">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-white font-bold text-lg">XION Demo</div>
          <nav>
            <ul className="flex gap-6">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="text-white font-medium">
                  Checkout
                </Link>
              </li>
              <li>
                <Link to="/nft-access" className="text-slate-300 hover:text-white transition-colors">
                  NFT Access
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Product Info Column */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h2 className="text-2xl text-white font-bold mb-4">{productInfo.name}</h2>
            <div className="mb-6 rounded-xl overflow-hidden">
              <img src={productInfo.imageUrl} alt={productInfo.name} className="w-full h-auto" />
            </div>
            <div className="mb-4">
              <h3 className="text-lg text-white mb-2">Description</h3>
              <p className="text-slate-300">{productInfo.description}</p>
            </div>
            <div className="pt-4 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Price:</span>
                <span className="text-white font-bold text-xl">{productInfo.amount} {productInfo.currency}</span>
              </div>
            </div>
          </div>
          
          {/* Checkout Column */}
          <div>
            <MagicCheckout 
              productId={productInfo.productId} 
              amount={productInfo.amount}
              currency={productInfo.currency}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
