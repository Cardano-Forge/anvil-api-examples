// Transaction status constants
export const TX_STATUS = {
  PENDING: 'pending' as const,
  SIGN_LOCK: 'signLock' as const,
  SIGN_UNLOCK: 'signUnlock' as const,
  CONFIRMED: 'confirmed' as const,
  UNLOCKED: 'unlocked' as const,
} as const;

// Create a type from the values
export type TransactionStatus = typeof TX_STATUS[keyof typeof TX_STATUS];

export type Transaction = {
  txHash: string;
  wallet: string;
  amount: number;
  status: TransactionStatus;
  timestamp: number;
};
