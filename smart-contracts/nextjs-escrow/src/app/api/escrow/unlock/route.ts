import { NextRequest, NextResponse } from 'next/server';
import { unlockFunds } from '@/lib/anvil-api';
import { upsertWallet, upsertTx } from '@/lib/db';
import { TX_STATUS } from '@/lib/types';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { txHash, changeAddress, ownerKeyHash, amount } = body;

  if (!txHash || !changeAddress || !ownerKeyHash || amount == null) {
    return NextResponse.json(
      { error: 'Missing txHash, changeAddress, ownerKeyHash, or amount' },
      { status: 400 }
    );
  }

  try {
    const { complete, error } = await unlockFunds({ txHash, changeAddress, ownerKeyHash });
    if (error || !complete) {
      return NextResponse.json(
        { error: error || 'Failed to build unlock transaction' },
        { status: 500 }
      );
    }

    upsertWallet(changeAddress);
    upsertTx(txHash, changeAddress, Number(amount), TX_STATUS.PENDING);

    // Return built transaction for client-side signing and submission
    return NextResponse.json({ complete });
  } catch (err: unknown) {
    console.error('Error unlocking funds:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
