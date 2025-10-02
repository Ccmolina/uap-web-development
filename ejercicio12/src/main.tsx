import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

import { createWeb3Modal } from "@web3modal/wagmi/react";
import { WagmiConfig, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const projectId = "TU_PROJECT_ID";

const metadata = {
  name: "Faucet Token dApp",
  description: "React + Wagmi + Web3Modal",
  url: "http://localhost:5173",
  icons: ["https://avatars.githubusercontent.com/u/37784886"]
};


const wagmiConfig = createConfig({
  chains: [sepolia],
  transports: {
    [sepolia.id]: http("https://ethereum-sepolia-rpc.publicnode.com"),
  },
  connectors: [
    injected({ shimDisconnect: true }),                        // MetaMask / Brave / etc
    walletConnect({ projectId, showQrModal: true, metadata }), // QR universal
    coinbaseWallet({ appName: metadata.name })                 // Opcional
  ],
  multiInjectedProviderDiscovery: true,
});


createWeb3Modal({
  wagmiConfig,
  projectId,
  metadata,
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <App />
      </WagmiConfig>
    </QueryClientProvider>
  </React.StrictMode>
);
