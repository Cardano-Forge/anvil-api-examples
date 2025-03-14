'use client';

import { useState, useCallback } from 'react';
import { useWallet, useExtensions } from '@ada-anvil/weld/react';

// Define the valid wallet types
type WalletType = 'eternl' | 'nami' | 'tokeo' | 'flint' | 'gerowallet' | 'typhoncip30' | 'nufi' | 'nufiSnap' | 'lace' | 'vespr';

interface WalletConnectorProps {
  onAddressChange?: (address: string) => void;
}

// Helper function to truncate address for display
const truncateAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-8)}`;
};

export default function WalletConnector({ onAddressChange }: WalletConnectorProps = {}) {
  const [error, setError] = useState<string>('');
  const wallet = useWallet();
  const installedWallets = useExtensions('supportedMap');
  
  // Connect to selected wallet
  const connectWallet = useCallback(async (walletName: WalletType) => {
    setError('');
    
    try {
      if (!installedWallets.get(walletName)) {
        setError(`${walletName} wallet extension not found. Please install it first.`);
        return;
      }
      
      await wallet.connectAsync(walletName as WalletType);
      
      if (onAddressChange && wallet.changeAddressBech32) {
        onAddressChange(wallet.changeAddressBech32);
      }
      
    } catch (err) {
      console.error(`Error connecting to ${walletName} wallet:`, err);
      setError(err instanceof Error ? err.message : `Failed to connect ${walletName} wallet`);
    }
  }, [wallet, installedWallets, onAddressChange]);
  
  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await wallet.disconnect();
      // Notify parent component of address change (to empty)
      if (onAddressChange) {
        onAddressChange('');
      }
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  }, [wallet, onAddressChange]);

  const availableWallets = Array.from(installedWallets.entries());
  return (
    <div className="p-4 bg-gray-50 rounded-lg mb-4">
      <h2 className="text-xl font-semibold mb-3 text-gray-600">Wallet Connection</h2>
      
      {!wallet.isConnected ? (
        <div>
          {availableWallets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {availableWallets.map(([walletName, isInstalled]) => (
                <button
                  key={walletName}
                  onClick={() => connectWallet(walletName)}
                  disabled={wallet.isConnecting || !isInstalled}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm flex items-center justify-center capitalize"
                  aria-busy={wallet.isConnecting}
                  title={isInstalled ? `Connect to ${walletName}` : `${walletName} is not installed`}
                >
                  {wallet.isConnecting && wallet.isConnectingTo === walletName ? 'Connecting...' : walletName}
                </button>
              ))}
            </div>
          ) : (
            <p className="mb-3 text-amber-600">No Cardano wallets detected. Please install a compatible wallet extension.</p>
          )}
          <p className="mt-2 text-sm text-gray-600">
            Please select one of the available wallet extensions to connect.
          </p>
        </div>
      ) : (
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
              onClick={disconnectWallet}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
              aria-label="Disconnect wallet"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 bg-red-100 text-red-800 rounded-md" role="alert">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}