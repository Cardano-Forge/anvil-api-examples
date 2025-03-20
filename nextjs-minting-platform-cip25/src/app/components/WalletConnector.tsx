'use client';

import { useWallet, useExtensions } from '@ada-anvil/weld/react';
import { SUPPORTED_WALLETS } from '@ada-anvil/weld';

// Helper function to truncate address for display
const truncateAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

export default function WalletConnector() {
  const wallet = useWallet();
  const { supportedMap: installedWallets, isLoading } = useExtensions("supportedMap", "isLoading");
  const availableWallets = SUPPORTED_WALLETS.filter((w) => installedWallets.has(w.key));
  
  const handleConnect = async (walletKey?: string) => {
    if (!walletKey) return;

    try {
      await wallet.connectAsync(walletKey);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      await wallet.disconnect();
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg mb-4">
      <h2 className="text-xl font-semibold mb-3 text-gray-600">Wallet Connection</h2>
      
      {/* Wallet Connection Interface - Either shows available wallets or connection status */}
      {!wallet.isConnected ? (
        <>
          {/* Wallet Detection State */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Detecting wallet extensions...</span>
              </div>
            </div>
          ) : availableWallets.length > 0 ? (

            /* Available Wallets Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              {SUPPORTED_WALLETS.map(walletInfo => {
                const isInstalled = installedWallets.has(walletInfo.key);
                const isConnecting = wallet.isConnecting && wallet.isConnectingTo === walletInfo.displayName;
                
                return isInstalled ? (
                  /* Connect Button for Installed Wallet */
                  <button
                    key={walletInfo.key}
                    onClick={() => handleConnect(walletInfo.key)}
                    disabled={wallet.isConnecting}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center justify-center w-full"
                  >
                    {isConnecting ? 'Connecting...' : walletInfo.displayName}
                  </button>
                ) : (
                  /* Install Link for Unavailable Wallet */
                  <a 
                    key={walletInfo.key}
                    href={walletInfo.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 border border-blue-300 rounded-md flex items-center justify-center w-full"
                  >
                    Install {walletInfo.displayName}
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="mb-3 text-amber-600">No Cardano wallets detected. Please install a compatible wallet extension.</p>
          )}
          <p className="text-sm text-gray-600">
            Please select one of the available wallet extensions to connect.
          </p>
        </>
      ) : (
        /* Connected Wallet Status Section */
        <div>
          <div className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm mb-3">
            <div>
              <p className="font-medium text-gray-600">
                Connected: <span className="font-mono">{truncateAddress(wallet.changeAddressBech32 || '')}</span>
              </p>
              <p className="text-sm text-gray-600">
                Balance: {wallet.balanceAda.toFixed(2)} ₳
              </p>
              <p className="text-xs text-gray-500">
                Using: <span className="capitalize">{wallet.displayName}</span>
              </p>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}