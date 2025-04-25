"use client";

import { useWallet, useExtensions } from "@ada-anvil/weld/react";
import { SUPPORTED_WALLETS } from "@ada-anvil/weld";
import { useState } from "react";

// Component to display wallet information
const WalletInfo = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline">
    <span className="text-gray-700 mr-2">{label}</span>
    <span className="font-semibold break-all text-black">{value}</span>
  </div>
);

// Format wallet address to show abbreviated form
const formatAddress = (address?: string) => {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

/**
 * WalletConnector component handles wallet connection functionality
 * - Detects available Cardano wallets
 * - Allows users to connect/disconnect their wallet
 * - Displays wallet information when connected
 */
export default function WalletConnector() {
  const wallet = useWallet();
  const { supportedMap: installedWallets, isLoading } = useExtensions(
    "supportedMap",
    "isLoading"
  );

  // Filter to only show available wallets that are installed
  const availableWallets = SUPPORTED_WALLETS.filter((w) =>
    installedWallets.has(w.key),
  );

  const [selectedWallet, setSelectedWallet] = useState<string>("");

  // Handle wallet selection from dropdown
  const handleWalletSelection = (walletKey: string) => {
    setSelectedWallet(walletKey);
  };

  // Connect to selected wallet
  const handleConnect = async (walletKey?: string) => {
    if (!walletKey) return;
    try {
      await wallet.connectAsync(walletKey);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <section className="section-card">
      <h2 className="text-xl font-bold mb-4 text-black">Wallet</h2>

      {wallet.isConnected ? (
        // Connected state - show wallet info and disconnect button
        <>
          <WalletInfo label="Connected to:" value={wallet.displayName || ""} />
          <WalletInfo
            label="Address:"
            value={formatAddress(wallet.changeAddressBech32)}
          />
          <WalletInfo
            label="Balance:"
            value={`${wallet.balanceAda?.toFixed(2) || "0.00"} ADA`}
          />

          <button
            onClick={() =>
              wallet
                .disconnect()
                .catch((err) =>
                  console.error("Failed to disconnect wallet:", err)
                )
            }
            className="button-primary"
          >
            Disconnect
          </button>
        </>
      ) : isLoading ? (
        // Loading state
        <div className="text-gray-700">Detecting wallet extensions...</div>
      ) : (
        // Disconnected state - show wallet selector and connect button
        <div>
          <select
            className="w-full p-2 border-2 border-neutral-800 rounded-2xl mb-4 focus:outline-none bg-white text-black"
            name="wallet-key"
            value={selectedWallet}
            onChange={(e) => handleWalletSelection(e.target.value)}
          >
            {availableWallets.length === 0 ? (
              <option value="">No wallets installed</option>
            ) : (
              <>
                <option value="">Select a wallet</option>
                {availableWallets.map((w) => (
                  <option key={w.key} value={w.key}>
                    {w.displayName}
                  </option>
                ))}
              </>
            )}
          </select>
          
          <button
            onClick={() => selectedWallet && handleConnect(selectedWallet)}
            className="button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={wallet.isConnecting || availableWallets.length === 0}
          >
            {wallet.isConnecting
              ? `Connecting to ${wallet.isConnectingTo}...`
              : selectedWallet
                ? "Connect Wallet"
                : "Select a Wallet"}
          </button>
        </div>
      )}
    </section>
  );
}
