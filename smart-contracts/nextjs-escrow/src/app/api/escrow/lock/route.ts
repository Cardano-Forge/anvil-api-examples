import { NextRequest, NextResponse } from 'next/server';
import { lockFunds } from '@/lib/anvil-api';
import { upsertWallet, upsertTx } from '@/lib/db';
import { TX_STATUS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { changeAddress, amount, ownerKeyHash, message } = body;

    // Validate inputs
    if (!changeAddress || amount == null || !ownerKeyHash) {
      return NextResponse.json(
        { error: 'Missing changeAddress, amount, or ownerKeyHash' },
        { status: 400 }
      );
    }

    // Build lock transaction
    const { txHash, complete, error } = await lockFunds({
      changeAddress,
      lovelaceAmount: amount,
      ownerKeyHash,
      message: message || 'Locking funds in escrow using Anvil API',
    });
    if (error || !txHash || !complete) {
      return NextResponse.json(
        { error: error || 'Failed to build lock transaction' },
        { status: 500 }
      );
    }

    // Store transaction in DB
    upsertWallet(changeAddress);
    upsertTx(txHash, changeAddress, Number(amount), TX_STATUS.SIGN_LOCK);

    return NextResponse.json({ txHash, complete });
  } catch (err: unknown) {
    console.error('Error locking funds:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message || 'Failed to lock funds' },
      { status: 500 }
    );
  }
}
