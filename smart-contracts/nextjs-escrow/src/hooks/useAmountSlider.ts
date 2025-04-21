import { useState, ChangeEvent } from 'react';
import { useWallet } from '@ada-anvil/weld/react';

type UseAmountSliderProps = {
  wallet: ReturnType<typeof useWallet>;
};

export const useAmountSlider = ({ wallet }: UseAmountSliderProps) => {
  const [amount, setAmount] = useState<number>(1);
  const maxAmount = Number(wallet.balanceAda?.toFixed(2) || 1);
  
  if (!wallet.isConnected && amount !== 1) {
    setAmount(1);
  }
  
  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newAmount = parseFloat(e.target.value);
    const clampedAmount = Math.min(Math.max(newAmount, 1), maxAmount);
    setAmount(clampedAmount);
  };
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setAmount(1);
      return;
    }
    
    const newAmount = parseFloat(value);
    
    if (!isNaN(newAmount)) {
      const clampedAmount = Math.min(Math.max(newAmount, 1), maxAmount);
      setAmount(clampedAmount);
    }
  };
  
  const getSliderBackground = () => {
    if (!wallet.isConnected) return '#e5e7eb';
    const percentage = (amount / maxAmount) * 100;
    return `linear-gradient(to right, black 0%, black ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
  };
  
  return {
    amount,
    setAmount,
    maxAmount,
    handleAmountChange,
    handleInputChange,
    getSliderBackground,
    isWalletConnected: wallet.isConnected
  };
};
