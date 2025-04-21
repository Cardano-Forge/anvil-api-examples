"use client";

import { useState } from 'react';
import { useWallet } from '@ada-anvil/weld/react';
import { useAmountSlider } from '@/hooks/useAmountSlider';
import { useTransactionOperations } from '@/hooks/useTransactions';

export default function LockFundsForm() {
  const wallet = useWallet();
  const address = wallet.changeAddressBech32;
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const { lockFunds, processing, error: errorMessage } = useTransactionOperations(wallet, address);
  const isLocking = processing === 'lock';
  
  const { 
    amount, 
    maxAmount, 
    handleAmountChange, 
    handleInputChange,
    sliderBackground,
    isWalletConnected
  } = useAmountSlider({ wallet });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWalletConnected || amount <= 0 || !wallet.changeAddressBech32) return;
    
    setSuccessMessage(null);
    setTxHash(null);
    
    try {
      const result = await lockFunds(amount);
      
      if (result?.txHash) {
        setSuccessMessage(`Successfully prepared transaction to lock ${amount} ADA`);
        setTxHash(result.txHash);
      }
    } catch (error) {
      console.error('Failed to lock funds:', error);
    }
  };
  
  return (
    <section className="section-card">
      <h2 className="text-xl font-bold mb-4 text-black">Lock Funds</h2>
      
      {/* Status Messages */}
      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg shadow-md border border-red-200">
          <div className="font-medium">{errorMessage}</div>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg shadow-md border border-green-200">
          <div className="font-medium">{successMessage}</div>
          {txHash && (
            <div className="mt-2 text-sm bg-white p-2 rounded border border-gray-200">
              <span className="text-gray-700">Transaction: </span>
              <span className="font-mono break-all">{txHash}</span>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="amount-slider" className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Lock (ADA)
          </label>
          
          {/* Slider */}
          <div className="flex items-center gap-4">
            <div className="flex-grow relative py-2">
              <input 
                type="range" 
                id="amount-slider"
                min="1" 
                max={maxAmount} 
                step="1"
                value={amount}
                onChange={handleAmountChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50 slider-thumb"
                disabled={!isWalletConnected}
                style={{
                  background: sliderBackground
                }}
              />
            </div>
            
            {/* Number Input */}
            <div className="relative w-24">
              <input
                type="number"
                name="lockAmount"
                value={amount}
                onChange={handleInputChange}
                min="1"
                max={maxAmount}
                step="1"
                className="w-full p-2 border-2 border-neutral-800 rounded-lg text-right text-black"
                disabled={!isWalletConnected}
              />
            </div>
          </div>
          
          {/* Available Balance */}
          <p className="mt-1 text-sm text-gray-500">
            {isWalletConnected 
              ? `Available: ${wallet.balanceAda?.toFixed(2) || '0.00'} ADA` 
              : 'Connect wallet to lock funds'}
          </p>
        </div>
        
        <button
          type="submit"
          disabled={!isWalletConnected || isLocking || amount <= 0}
          className="button-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLocking ? 'Processing...' : 'Lock Funds'}
        </button>
      </form>
    </section>
  );
}
