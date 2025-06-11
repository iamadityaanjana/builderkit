import React, { useState } from 'react';
import { useAbstraxionAccount, useAbstraxionSigningClient, useModal } from '@burnt-labs/abstraxion';
import { toast } from 'react-toastify';
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import { savePaymentSession } from '../utils/payment';
import { xionToBaseUnits, createTransferMessage } from '../utils/xionHelpers';

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CheckoutPageProps {
  products?: Product[];
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ 
  products = [
    { id: "xion1-3ab", name: "Premium Service", price: 0.1, quantity: 2 },
  { id: "xion2-def", name: "Basic Plan", price: 0.05, quantity: 1 },
  { id: "xion3-ghi", name: "Add-on Feature", price: 0.02, quantity: 3 }
  ] 
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { client } = useAbstraxionSigningClient();
  const { data: account, isConnected } = useAbstraxionAccount();
  const [, setShowModal] = useModal();

  // Calculate totals
  const subtotal = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  const otherCharges = 0; // No additional charges
  const totalAmount = subtotal + otherCharges;

  const handlePayNow = async () => {
    if (!isConnected) {
      setShowModal(true);
      return;
    }
    if (!client || !account?.bech32Address) {
      toast.error('Please connect your wallet first');
      return;
    }
    setShowConfirmation(true);
  };

  const confirmPayment = async () => {
    setIsProcessing(true);
    setShowConfirmation(false);
    
    try {
      toast.info('Processing payment...', { autoClose: 2000 });
      
      // Save payment session data
      const paymentData = {
        products,
        totalAmount: totalAmount.toString(),
        currency: "Xion",
        timestamp: new Date().toISOString()
      };
      
      await savePaymentSession(paymentData);
      
      // Create transfer message
      const recipientAddress = "xion1h4nh5ntx0cf5qrp0gny3qhqjw5jnqjdqgqx8tj"; // Demo recipient
      const amountInBaseUnits = xionToBaseUnits(totalAmount.toString());
      
      const transferMsg = createTransferMessage(
        account!.bech32Address,
        recipientAddress,
        amountInBaseUnits,
        "uxion"
      );

      const fee = {
        amount: [{ denom: "uxion", amount: "200" }],
        gas: "200000",
      };

      // Execute transaction
      const result = await client!.signAndBroadcast(
        account!.bech32Address,
        [transferMsg],
        fee
      );

      console.log('Payment successful! Transaction hash:', result.transactionHash);
      toast.success(`Payment successful! Tx: ${result.transactionHash.slice(0, 8)}...`, {
        autoClose: 5000
      });
      
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelPayment = () => {
    setShowConfirmation(false);
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        padding: '24px'
      }}
    >
      <div 
        className="w-full max-w-sm bg-white p-6 rounded-xl border border-black shadow-sm"
        style={{
          width: '100%',
          maxWidth: '360px',
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid black',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        
        {!isConnected ? (
          // Login Required State
          <div 
            className="text-center"
            style={{
              textAlign: 'center'
            }}
          >
            <h1 
              className="text-2xl font-bold text-black mb-6"
              style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'black',
                marginBottom: '24px',
                margin: 0,
                lineHeight: '1.2'
              }}
            >
              Checkout
            </h1>
            
            <p 
              className="text-base text-gray-700 mb-6"
              style={{
                fontSize: '16px',
                color: '#374151',
                marginBottom: '24px',
                margin: 0,
                lineHeight: '1.5'
              }}
            >
              Please log in to continue with your purchase
            </p>
            
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-black text-white py-3 px-6 rounded-lg text-base font-medium transition-all duration-200 hover:bg-gray-800"
              style={{
                width: '100%',
                backgroundColor: 'black',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'black';
              }}
            >
              Login with Xion
            </button>
          </div>
        ) : (
          // Checkout Receipt State
          <>
            {/* Receipt Header */}
            <div 
              className="text-center mb-6"
              style={{
                textAlign: 'center',
                marginBottom: '24px'
              }}
            >
              <h1 
                className="text-2xl font-bold text-black mb-3"
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: 'black',
                  marginBottom: '12px',
                  margin: 0,
                  lineHeight: '1.2'
                }}
              >
                Checkout
              </h1>
              <div 
                className="w-full h-px bg-gray-300"
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#d1d5db'
                }}
              />
            </div>
            
            {/* Product List */}
            <div 
              className="mb-6"
              style={{
                marginBottom: '24px'
              }}
            >
              {products.map((product, index) => (
                <div 
                  key={product.id}
                  className="mb-3"
                  style={{
                    marginBottom: index === products.length - 1 ? '0' : '12px'
                  }}
                >
                  <div 
                    className="flex justify-between items-start"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div 
                      className="flex-1 mr-3"
                      style={{
                        flex: 1,
                        marginRight: '12px'
                      }}
                    >
                      <div 
                        className="text-sm font-medium text-black leading-tight"
                        style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: 'black',
                          lineHeight: '1.3'
                        }}
                      >
                        {product.name}
                      </div>
                      <div 
                        className="text-xs text-gray-500 mt-1"
                        style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px'
                        }}
                      >
                        {product.id} • Qty: {product.quantity}
                      </div>
                    </div>
                    
                    <div 
                      className="text-sm font-medium text-black"
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: 'black',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {Number(product.price * product.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Divider */}
              <div 
                className="w-full h-px bg-gray-300 my-4"
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: '#d1d5db',
                  margin: '16px 0'
                }}
              />
              
              {/* Subtotal */}
              <div 
                className="flex justify-between items-center mb-2"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <span 
                  className="text-sm text-gray-600"
                  style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}
                >
                  Subtotal
                </span>
                <span 
                  className="text-sm text-gray-600"
                  style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}
                >
                  {subtotal.toFixed(2)}
                </span>
              </div>
              
              {/* Other Charges */}
              <div 
                className="flex justify-between items-center mb-3"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}
              >
                <span 
                  className="text-sm text-gray-600"
                  style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}
                >
                  Fees
                </span>
                <span 
                  className="text-sm text-gray-600"
                  style={{
                    fontSize: '14px',
                    color: '#6b7280'
                  }}
                >
                  {otherCharges === 0 ? '0.00' : otherCharges.toFixed(2)}
                </span>
              </div>
              
              {/* Total */}
              <div 
                className="w-full h-px bg-black mb-3"
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: 'black',
                  marginBottom: '12px'
                }}
              />
              
              <div 
                className="flex justify-between items-center"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span 
                  className="text-lg font-bold text-black"
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'black'
                  }}
                >
                  Total
                </span>
                <span 
                  className="text-lg font-bold text-black"
                  style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: 'black'
                  }}
                >
                  {totalAmount.toFixed(2)} XION
                </span>
              </div>
            </div>
            
            {/* Pay Now Button */}
            <div 
              className="space-y-4"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className="w-full bg-black text-white py-3 px-6 rounded-lg text-base font-medium transition-all duration-200 hover:bg-gray-800 active:bg-gray-900 disabled:bg-gray-400"
                style={{
                  width: '100%',
                  backgroundColor: isProcessing ? '#9ca3af' : 'black',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.backgroundColor = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.backgroundColor = 'black';
                  }
                }}
              >
                {isProcessing ? 'Processing...' : 'Pay now'}
              </button>
              
              <p 
                className="text-center text-gray-500 text-xs"
                style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: '12px',
                  margin: 0
                }}
              >
                Powered by Xion
              </p>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px'
          }}
        >
          <div 
            className="bg-white p-6 rounded-xl border border-black max-w-xs w-full"
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid black',
              maxWidth: '320px',
              width: '100%'
            }}
          >
            <h2 
              className="text-lg font-bold text-black mb-4 text-center"
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: 'black',
                marginBottom: '16px',
                textAlign: 'center',
                margin: 0,
                lineHeight: '1.3'
              }}
            >
              Confirm Payment
            </h2>
            
            <p 
              className="text-sm text-gray-700 mb-6 text-center"
              style={{
                fontSize: '14px',
                color: '#374151',
                marginBottom: '24px',
                textAlign: 'center',
                margin: 0,
                lineHeight: '1.4'
              }}
            >
              Proceed with payment of <strong>{Number(totalAmount).toFixed(2)} XION</strong>?
            </p>
            
            <div 
              className="flex gap-3"
              style={{
                display: 'flex',
                gap: '12px'
              }}
            >
              <button
                onClick={cancelPayment}
                className="flex-1 bg-white text-black py-2 px-4 rounded-lg text-sm font-medium border border-gray-300 transition-all duration-200 hover:bg-gray-50"
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  color: 'black',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmPayment}
                className="flex-1 bg-black text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-800"
                style={{
                  flex: 1,
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'black';
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
