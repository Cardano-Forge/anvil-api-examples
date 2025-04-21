"use client";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Transaction, TransactionStatus, TX_STATUS } from '@/lib/types';
import { useCallback, useState, useEffect } from 'react';

//--------------------------------------------------------------
// React Query-dependent hooks for data fetching and cache updates
//--------------------------------------------------------------
/**
 * Hook to manage transaction data with smart polling that automatically
 * activates only when pending transactions are detected
 * @param wallet - Wallet address to fetch transactions for
 * @returns Transaction data with loading and error states
 */
export function usePollingTransactions(wallet?: string) {
  const [hasPendingTx, setHasPendingTx] = useState(false);
  
  const query = useQuery<Transaction[], Error>({
    queryKey: ['transactions', wallet],
    queryFn: async () => {
      if (!wallet) throw new Error("Wallet is required");
      const response = await fetch(`/api/escrow/transactions?wallet=${wallet}`);
      return response.json();
    },
    enabled: !!wallet,
    refetchInterval: wallet && hasPendingTx ? 5000 : false,
  });
  
  useEffect(() => {
    if (query.data) {
      const isPending = query.data.some(tx => tx.status === TX_STATUS.PENDING);
      if (isPending !== hasPendingTx) {
        setHasPendingTx(isPending);
      }
    }
  }, [query.data, hasPendingTx]);
  
  return query;
}

export function useTransactionUpdater(wallet?: string) {
  const queryClient = useQueryClient();
  
  return useCallback(
    (txHash: string, newStatus: TransactionStatus, newTransaction?: Partial<Transaction>) => {
      if (!wallet) return;
      
      // Update cache optimistically
      queryClient.setQueryData<Transaction[]>(
        ['transactions', wallet],
        old => {
          if (!old) return [];
          
          // Update existing transaction or add new one
          const existingTx = old.find(tx => tx.txHash === txHash);
          if (existingTx) {
            return old.map(tx => 
              tx.txHash === txHash ? { ...tx, status: newStatus } : tx
            );
          } 
          
          // Create and add new transaction if provided
          if (newTransaction) {
            const newTx: Transaction = {
              txHash,
              wallet: wallet,
              amount: newTransaction.amount || 0,
              status: newStatus,
              timestamp: newTransaction.timestamp || Date.now(),
            };
            return [newTx, ...old];
          }
          
          return old;
        }
      );
      
      // Refresh data from server
      queryClient.invalidateQueries({ queryKey: ['transactions', wallet] });
    },
    [queryClient, wallet]
  );
}

//--------------------------------------------------------------
// Transaction operation hooks (API calls, wallet operations)
//--------------------------------------------------------------

/**
 * Hook to manage transaction operations (locking and unlocking funds)
 * @param wallet - The wallet instance from useWallet()
 * @param address - The wallet address to use for transactions
 * @returns Functions and state for transaction operations
 */
// Define types for better readability
type CardanoWallet = {
  changeAddressHex?: string;
  handler?: {
    signTx: (txComplete: string, witnessOnly: boolean) => Promise<string>;
  };
};

// API response types
interface TransactionResponse {
  txHash: string;
  error?: string;
}

interface BuildTransactionResponse {
  complete?: string;
  error?: string;
}

const apiPost = async <T>(endpoint: string, payload: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`/api/escrow/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data as T;
};

export function useTransactionOperations(wallet: CardanoWallet, address?: string) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateTransaction = useTransactionUpdater(address);

  // Transaction building functions
  const buildUnlockTransaction = async (txHash: string, amount: number) => {
    if (!address || !wallet?.changeAddressHex) return null;
    
    const data = await apiPost<BuildTransactionResponse>('unlock', {
      txHash,
      changeAddress: address,
      ownerKeyHash: wallet.changeAddressHex,
      amount
    });
    
    if (!data.complete) {
      throw new Error('Build failed');
    }
    
    return data.complete;
  };

  const buildLockTransaction = async (lovelaceAmount: number) => {
    if (!address || !wallet?.changeAddressHex) return null;
    
    const data = await apiPost<BuildTransactionResponse>('lock', {
      changeAddress: address,
      amount: lovelaceAmount,
      ownerKeyHash: wallet.changeAddressHex,
      message: `Locking ${lovelaceAmount / 1_000_000} ADA in escrow`
    });
    
    if (!data.complete) {
      throw new Error('Build failed');
    }
    
    return data.complete;
  };

  // Transaction signing and submission
  const signTransaction = async (txComplete: string): Promise<string> => {
    const signed = await wallet?.handler?.signTx(txComplete, true);
    if (!signed) {
      throw new Error('Signing failed');
    }
    return signed;
  };

  const submitSignedTransaction = async (signed: string, txComplete: string, originalTxHash: string): Promise<TransactionResponse> => {
    return apiPost<TransactionResponse>('submit', {
      signature: signed,
      complete: txComplete,
      type: TX_STATUS.SIGN_UNLOCK,
      originalTxHash
    });
  };
  
  const submitLockTransaction = async (signedTx: string, txComplete: string, lovelaceAmount: number): Promise<TransactionResponse> => {
    return apiPost<TransactionResponse>('submit', {
      signature: signedTx,
      complete: txComplete,
      changeAddress: address,
      amount: lovelaceAmount,
      type: TX_STATUS.SIGN_LOCK
    });
  };
  
  const lockFunds = async (adaAmount: number) => {
    if (!address) return null;
    
    setError(null);
    setProcessing('lock');
    
    try {
      // Convert ADA to Lovelace (smallest unit)
      const lovelaceAmount = adaAmount * 1_000_000;
      
      // Build → Sign → Submit pattern
      const txComplete = await buildLockTransaction(lovelaceAmount);
      if (!txComplete) throw new Error('Failed to build transaction');
      
      const signedTx = await signTransaction(txComplete);
      const result = await submitLockTransaction(signedTx, txComplete, lovelaceAmount);
      
      // Update transaction status in cache
      if (result.txHash) {
        updateTransaction(result.txHash, TX_STATUS.PENDING, {
          amount: lovelaceAmount,
          timestamp: Date.now()
        });
      }
      
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setProcessing(null);
    }
  };
  
  const unlockFunds = async (txHash: string, amount: number) => {
    if (!address) return;
    
    setError(null);
    setProcessing(txHash);
    
    try {
      // Build → Sign → Submit pattern
      const txComplete = await buildUnlockTransaction(txHash, amount);
      if (!txComplete) throw new Error('Failed to build transaction');
      
      const signedTx = await signTransaction(txComplete);
      await submitSignedTransaction(signedTx, txComplete, txHash);
      
      // Update transaction status in cache
      updateTransaction(txHash, TX_STATUS.UNLOCKED);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    } finally {
      setProcessing(null);
    }
  };

  return {
    lockFunds,
    unlockFunds,
    processing,
    error
  };
}

