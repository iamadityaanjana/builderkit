import './App.css';
import { AbstraxionProvider, Abstraxion } from '@burnt-labs/abstraxion';
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LoginPage } from './pages/LoginPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { NFTGatedPage } from './pages/NFTGatedPage';
import { TransactionToastPage } from './pages/TransactionToastPage';

function App() {

  // Define your AbstraxionConfig object here
  const config = {
   rpcUrl: "https://rpc.xion-testnet-2.burnt.com:443",
    restUrl: "https://api.xion-testnet-2.burnt.com",
    treasury: "xion1sg8jwhl26l3flsa6w84w5eq3dttvd676tcqgrv0kjkmuyaplnkyqsg7lf2", // Added treasury address
     // Added contract address for user grants
  };

  return (
    <AbstraxionProvider config={config}>
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
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/nft-access" element={<NFTGatedPage />} />
          <Route path="/transaction-toast" element={<TransactionToastPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AbstraxionProvider>
  );
}

export default App
