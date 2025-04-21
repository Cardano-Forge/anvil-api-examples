"use client";

import { useWallet } from '@ada-anvil/weld/react';
import { usePollingTransactions, useTransactionOperations } from '@/hooks/useTransactions';
import { Transaction, TransactionStatus, TX_STATUS } from '@/lib/types';

const formatTxHash = (hash: string): string => {
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 4)}`;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
};

const formatAmount = (lovelaceAmount: number): string => {
  return (lovelaceAmount / 1_000_000).toFixed(2);
};

const STATUS_STYLES: Record<TransactionStatus, string> = {
  [TX_STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [TX_STATUS.SIGN_LOCK]: 'bg-yellow-100 text-yellow-800',
  [TX_STATUS.SIGN_UNLOCK]: 'bg-yellow-100 text-yellow-800',
  [TX_STATUS.CONFIRMED]: 'bg-green-100 text-green-800',
  [TX_STATUS.UNLOCKED]: 'bg-blue-100 text-blue-800',
};
const STATUS_LABELS: Record<TransactionStatus, string> = {
  [TX_STATUS.PENDING]: 'Pending',
  [TX_STATUS.SIGN_LOCK]: 'Sign to Lock',
  [TX_STATUS.SIGN_UNLOCK]: 'Sign to Unlock',
  [TX_STATUS.CONFIRMED]: 'Confirmed',
  [TX_STATUS.UNLOCKED]: 'Unlocked',
};

const STATUS_DETAILS: Record<TransactionStatus, string> = {
  [TX_STATUS.PENDING]: 'Waiting for Cardano blockchain confirmation...',
  [TX_STATUS.SIGN_LOCK]: 'Transaction needs to be signed to lock funds',
  [TX_STATUS.SIGN_UNLOCK]: 'Transaction needs to be signed to unlock funds',
  [TX_STATUS.CONFIRMED]: 'Transaction confirmed on the Cardano blockchain',
  [TX_STATUS.UNLOCKED]: 'Funds have been successfully unlocked',
};

const renderEmptyState = () => (
  <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
    <p className="text-gray-600">No transactions found. Lock some funds to get started.</p>
  </div>
);

const renderWalletNotConnected = () => (
  <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
    <p className="text-gray-600">Please connect your wallet to view your transactions.</p>
  </div>
);

const renderLoadingState = () => (
  <div className="p-8 text-center">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
    <p className="mt-2 text-gray-600">Loading your transactions...</p>
  </div>
);

const renderErrorState = (errorMessage: string) => (
  <div className="p-6 bg-red-50 text-red-700 rounded-lg border border-red-200">
    <h3 className="font-bold mb-2">Error loading transactions</h3>
    <p>{errorMessage}</p>
  </div>
);

export default function MyTransactions() {
  const wallet = useWallet();
  const address = wallet.changeAddressBech32;
  
  const { data: transactions = [], error, isLoading } = usePollingTransactions(address);
  const { unlockFunds, processing: unlocking, error: unlockError } = useTransactionOperations(wallet, address);

  const handleUnlock = (txHash: string, amount: number) => {
    if (!address) return;
    unlockFunds(txHash, amount).catch(err => {
      console.debug('Transaction unlock error:', err);
    });
  };
  
  const renderContent = () => {
    if (!address) return renderWalletNotConnected();
    if (error) return renderErrorState((error as Error).message);
    if (isLoading) return renderLoadingState();
    return (
      <>
        {unlockError && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
            {unlockError}
          </div>
        )}
        {renderTransactions()}
      </>
    );
  }

  const renderActionButton = (transaction: Transaction) => {
    if (transaction.status === TX_STATUS.CONFIRMED) {
      return (
        <button
          disabled={unlocking === transaction.txHash}
          className="button-primary py-1 px-3 text-sm disabled:opacity-50"
          onClick={() => handleUnlock(transaction.txHash, transaction.amount)}
        >
          {unlocking === transaction.txHash ? 'Unlocking…' : 'Unlock'}
        </button>
      );
    }
    return <span className="text-gray-400">-</span>;
  };

  const renderTransactions = () => {
    if (transactions.length === 0) {
      return renderEmptyState();
    }
    
    return (
      <table className="w-full text-left border-collapse text-black">
        <thead>
          <tr>
            <th className="px-4 py-2">Transaction</th>
            <th className="px-4 py-2 text-right">Amount</th>
            <th className="px-4 py-2 text-center">Status</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction: Transaction) => {
            const isPending = transaction.status === TX_STATUS.PENDING;
            
            return (
              <tr 
                key={transaction.txHash} 
                className={`border-t hover:bg-gray-50 ${isPending ? 'bg-yellow-50' : ''}`}
              >
                <td className="px-4 py-3 font-mono">
                  <a 
                    href={`https://preprod.cardanoscan.io/transaction/${transaction.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline"
                    title={transaction.txHash}
                  >
                    {formatTxHash(transaction.txHash)}
                  </a>
                </td>
                <td className="px-4 py-3 text-right">{formatAmount(transaction.amount)} ADA</td>
                <td className="px-4 py-3 text-center">
                  {isPending ? (
                      <span className="inline-flex items-center" title={STATUS_DETAILS[transaction.status]}>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[transaction.status]}`}>
                          {STATUS_LABELS[transaction.status]}
                        </span>
                        <span className="ml-2 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                      </span> 
                    ) : (
                      <span 
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_STYLES[transaction.status] || 'bg-gray-100 text-gray-800'}`}
                        title={STATUS_DETAILS[transaction.status]}
                      > 
                      {STATUS_LABELS[transaction.status] || transaction.status}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{formatDate(transaction.timestamp)}</td>
                <td className="px-4 py-3 text-center">
                  {renderActionButton(transaction)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };
  
  return (
    <section className="section-card text-black">
      <h2 className="text-xl font-bold mb-4 text-black">My Transactions</h2>
      {renderContent()}
    </section>
  );
}
