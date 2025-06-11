import './App.css';
import { AbstraxionProvider, Abstraxion } from '@burnt-labs/abstraxion';
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from './config';
import Navigation from './components/Navigation';
import { LoginPage } from './pages/LoginPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { NFTGatedPage } from './pages/NFTGatedPage';
import { TransactionToastPage } from './pages/TransactionToastPage';
import SmartProfilePage from './pages/SmartProfilePage';
import PaywallPage from './pages/PaywallPage';
import ReferralFlowPage from './pages/ReferralFlowPage';

function App() {

  // Define your AbstraxionConfig object here
  const abstraxionConfig = {
    rpcUrl: config.rpcUrl,
    restUrl: config.restUrl,
    treasury: config.treasuryAddress
  };

  // Handle successful payment
  const handlePaymentSuccess = (transactionHash: string) => {
    console.log('Payment completed successfully:', transactionHash);
    // Add any custom success logic here
  };

  // Handle back to home navigation
  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <AbstraxionProvider config={abstraxionConfig}>
      <Abstraxion onClose={() => {}} />
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route 
            path="/checkout" 
            element={
              <CheckoutPage 
                recipientAddress="xion1rglsd95g5dyh2jdl4q7eug858tcpm9j7svfqq8dah702ckyq6rnqx5w487"
                onPaymentSuccess={handlePaymentSuccess}
                onBackToHome={handleBackToHome}
              />
            } 
          />
          <Route path="/nft-access" element={<NFTGatedPage />} />
          <Route path="/transaction-toast" element={<TransactionToastPage />} />
          <Route path="/smart-profile" element={<SmartProfilePage />} />
          <Route path="/paywall" element={<PaywallPage />} />
          <Route path="/referral" element={<ReferralFlowPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AbstraxionProvider>
  );
}

export default App
