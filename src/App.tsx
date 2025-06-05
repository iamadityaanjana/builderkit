import './App.css';
import { AbstraxionProvider, Abstraxion } from '@burnt-labs/abstraxion';
import "@burnt-labs/abstraxion/dist/index.css";
import "@burnt-labs/ui/dist/index.css";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { NFTGatedPage } from './pages/NFTGatedPage';

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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/nft-access" element={<NFTGatedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AbstraxionProvider>
  );
}

export default App
