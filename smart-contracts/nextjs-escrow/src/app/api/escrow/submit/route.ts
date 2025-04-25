import { NextRequest, NextResponse } from 'next/server';
import { submitTransaction } from '@/lib/anvil-api';
import { updateTxStatus } from '@/lib/db';
import { TX_STATUS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { complete, signature, type, originalTxHash } = body;
    
    // Validate inputs
    if (!complete || !signature || !(type === TX_STATUS.SIGN_LOCK || type === TX_STATUS.SIGN_UNLOCK)) {
      return NextResponse.json(
        { error: 'Missing complete transaction or signature' },
        { status: 400 }
      );
    }
    
    // For unlock transactions, originalTxHash is required
    if (type === TX_STATUS.SIGN_UNLOCK && !originalTxHash) {
      return NextResponse.json(
        { error: 'Missing originalTxHash for unlock transaction' },
        { status: 400 }
      );
    }

    // Submit the signed transaction to the blockchain
    const result = await submitTransaction(signature, complete);

    // Mark transaction as pending in DB
    // For lock transactions, update the new txHash
    // For unlock transactions, update the original txHash
    const txHashToUpdate = type === TX_STATUS.SIGN_UNLOCK ? originalTxHash : result.txHash;
    updateTxStatus(txHashToUpdate, type === TX_STATUS.SIGN_LOCK ? TX_STATUS.PENDING : TX_STATUS.UNLOCKED);

    return NextResponse.json({ txHash: result.txHash });
  } catch (error: unknown) {
    console.error('Error submitting transaction:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message || 'Failed to submit transaction' },
      { status: 500 }
    );
  }
}
