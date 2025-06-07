// Configuration for XION User Map and other contract interactions
export const config = {
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || 
                  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 
                  "xion16086amc9nh5dz6p5pm7at067df8hl6q2raae87z75w0a86ahwhmste4e6e",
  treasuryAddress: import.meta.env.VITE_TREASURY_ADDRESS || 
                  process.env.NEXT_PUBLIC_TREASURY_ADDRESS || 
                  "xion1sg8jwhl26l3flsa6w84w5eq3dttvd676tcqgrv0kjkmuyaplnkyqsg7lf2",
  rpcUrl: import.meta.env.VITE_RPC_URL || 
          process.env.NEXT_PUBLIC_RPC_URL || 
          "https://rpc.xion-testnet-2.burnt.com:443",
  restUrl: import.meta.env.VITE_REST_URL || 
           process.env.NEXT_PUBLIC_REST_URL || 
           "https://api.xion-testnet-2.burnt.com"
};

export default config;
