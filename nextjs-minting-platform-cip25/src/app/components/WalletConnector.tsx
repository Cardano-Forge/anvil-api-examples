'use client';

import { useState, useCallback } from 'react';
import { useWallet, useExtensions } from '@ada-anvil/weld/react';

interface WalletConnectorProps {
  onAddressChange?: (address: string) => void;
}

export default function WalletConnector({ onAddressChange }: WalletConnectorProps = {}) {
  const [error, setError] = useState<string>('');
  const wallet = useWallet();
  const installedWallets = useExtensions('supportedMap');
  
  // Connect to Eternl wallet
  const connectWallet = useCallback(async () => {
    setError('');
    
    try {
      // Check if Eternl is installed
      if (!installedWallets.get('eternl')) {
        setError('Eternl wallet extension not found. Please install it first.');
        return;
      }
      
      // Connect to Eternl
      await wallet.connectAsync('eternl');
      
      // Notify parent component of address change
      if (onAddressChange && wallet.changeAddressBech32) {
        onAddressChange(wallet.changeAddressBech32);
      }
    } catch (err) {
      console.error('Error connecting to wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
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
  
  // Helper function to truncate address for display
  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg mb-4">
      <h2 className="text-xl font-semibold mb-3 text-gray-600">Wallet Connection</h2>
      
      {!wallet.isConnected ? (
        <div>
          <button
            onClick={connectWallet}
            disabled={wallet.isConnecting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            aria-busy={wallet.isConnecting}
          >
            {wallet.isConnecting ? 'Connecting...' : 'Connect Eternl Wallet'}
          </button>
          
          {/* Message to inform users they need Eternl */}
          <p className="mt-2 text-sm text-gray-600">
            Only Eternl wallet is supported for this application.
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
            </div>
            <button
              onClick={disconnectWallet}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
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