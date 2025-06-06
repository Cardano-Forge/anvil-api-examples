"use client";

import { useWallet, useExtensions } from "@ada-anvil/weld/react";
import { SUPPORTED_WALLETS } from "@ada-anvil/weld";
import { useState } from "react";

// Helper function to truncate address for display
const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

// Component to display wallet info
const WalletInfo = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span>{label} </span>
    <span>
      <b>{value}</b>
    </span>
  </div>
);

export default function WalletConnector() {
  const wallet = useWallet();
  const { supportedMap: installedWallets, isLoading } = useExtensions(
    "supportedMap",
    "isLoading",
  );
  const availableWallets = SUPPORTED_WALLETS.filter((w) =>
    installedWallets.has(w.key),
  );
  const [selectedWallet, setSelectedWallet] = useState<string>("");

  // Reset connection state if wallet selection changes
  const handleWalletSelection = (value: string) => {
    if (wallet.isConnectingTo && value !== wallet.isConnectingTo) {
      // Cancel any pending connection
      wallet
        .disconnect()
        .catch((err) => console.error("Failed to disconnect wallet:", err));
    }
    setSelectedWallet(value);
  };

  const handleConnect = async (walletKey?: string) => {
    if (!walletKey) return;
    try {
      await wallet.connectAsync(walletKey);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  return (
    <section className="paper">
      <h2>Wallet</h2>

      {wallet.isConnected ? (
        // Connected state - show wallet info and disconnect button
        <>
          <WalletInfo label="Connected to:" value={wallet.displayName || ""} />
          <WalletInfo
            label="Address:"
            value={truncateAddress(wallet.changeAddressBech32 || "")}
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
                  console.error("Failed to disconnect wallet:", err),
                )
            }
            className="btn mt-4"
          >
            Disconnect
          </button>
        </>
      ) : // Disconnected state - show wallet selector and connect button
      isLoading ? (
        <div>Detecting wallet extensions...</div>
      ) : (
        <div>
          <select
            className="custom-rounded mb-4"
            name="wallet-key"
            value={selectedWallet}
            onChange={(e) => handleWalletSelection(e.target.value)}
          >
            {availableWallets.length === 0 ? (
              <option value="">No wallets</option>
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
            className="btn text-center"
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
