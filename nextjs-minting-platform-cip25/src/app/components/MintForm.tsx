'use client';

import { useReducer, useCallback, useEffect } from 'react';
import { useWallet } from '@ada-anvil/weld/react';

type ActionType =
  | { type: 'RESET' }
  | { type: 'MINT_START' }
  | { type: 'MINT_SUCCESS'; payload: string }
  | { type: 'MINT_ERROR'; payload: string };

interface MintState {
  status: 'idle' | 'minting' | 'completed';
  error: string;
  resultTxId: string;
}

// Initial state
const initialState: MintState = {
  status: 'idle',
  error: '',
  resultTxId: '',
};

// Reducer function
function mintReducer(state: MintState, action: ActionType): MintState {
  switch (action.type) {
    case 'RESET':
      return initialState;
    case 'MINT_START':
      return {
        ...state,
        status: 'minting',
        error: '',
        resultTxId: '',
      };
    case 'MINT_SUCCESS':
      return {
        ...state,
        status: 'completed',
        resultTxId: action.payload,
      };
    case 'MINT_ERROR':
      return { 
        ...state, 
        status: 'idle', 
        error: action.payload 
      };
    default:
      return state;
  }
}

export default function MintForm() {
  const [state, dispatch] = useReducer(mintReducer, initialState);
  const wallet = useWallet();
  
  // Reset form if wallet disconnects
  useEffect(() => {
    if (!wallet.isConnected && state.status !== 'idle') {
      dispatch({ type: 'RESET' });
    }
  }, [wallet.isConnected, state.status]);
  
  const mintNFT = useCallback(async () => {
    // Reset error state and start minting process
    dispatch({ type: 'MINT_START' });
    
    try {
      // Check wallet connection directly using wallet hook
      if (!wallet.isConnected || !wallet.changeAddressBech32) {
        throw new Error('Please connect your wallet first');
      }
      
      // Step 1: Create the transaction
      const mintResponse = await fetch('/api/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changeAddress: wallet.changeAddressBech32, utxos: await wallet.handler.getUtxos() }),
      });
      
      const mintData = await mintResponse.json();
      
      if (!mintResponse.ok) {
        throw new Error(mintData.error || 'Failed to create mint transaction');
      }
      
      // Step 2: Sign the transaction using wallet hook
      const signedTransaction = await wallet.handler.signTx(mintData.strippedTransaction, true);
      if (!signedTransaction) {
        throw new Error('Failed to sign transaction');
      }

      // Step 3: Submit the signed transaction
      const submitResponse = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signedTx: signedTransaction,
          hash: mintData.hash,
          strippedTransaction: mintData.strippedTransaction,
        }),
      });
      
      const submitData = await submitResponse.json();
      
      if (!submitResponse.ok) {
        throw new Error(submitData.error || 'Failed to submit transaction');
      }
      
      dispatch({
        type: 'MINT_SUCCESS', 
        payload: submitData.result.txHash || 'Transaction submitted' 
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      dispatch({ type: 'MINT_ERROR', payload: errorMessage });
    }
  }, [wallet.isConnected, wallet.changeAddressBech32, wallet.handler]);
  
  return (
    <div className="p-6 bg-white shadow-md rounded-lg" aria-live="polite">
      <h2 className="text-2xl font-semibold text-gray-600 mb-6">Mint NFT</h2>
      
      {/* Wallet Connection Status */}
      {!wallet.isConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md" role="alert">
          <p className="text-yellow-700">Please connect your wallet to mint NFTs</p>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Single Mint NFT Button */}
        <div>
          <button 
            onClick={mintNFT}
            disabled={!wallet.isConnected || state.status === 'minting'}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:bg-blue-300 text-lg font-medium"
            aria-busy={state.status === 'minting'}
          >
            {state.status === 'minting' ? 'Minting NFT...' : 'Mint NFT'}
          </button>
        </div>
        
        {/* Success Message */}
        {state.status === 'completed' && (
          <div className="bg-green-100 p-4 rounded-md" role="status">
            <h3 className="text-lg font-medium text-green-800 mb-2">NFT Minted Successfully!</h3>
            <p className="text-green-700">
              Transaction ID: <span className="font-mono">{state.resultTxId}</span>
            </p>
          </div>
        )}
        
        {/* Error Message */}
        {state.error && (
          <div className="bg-red-100 p-4 rounded-md" role="alert">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{state.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}