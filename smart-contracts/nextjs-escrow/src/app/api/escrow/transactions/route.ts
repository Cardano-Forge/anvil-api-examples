import { NextRequest, NextResponse } from 'next/server';
import { getTxsByWallet } from '@/lib/db';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get('wallet');

  // Validate wallet parameter
  if (!wallet) {
    return NextResponse.json(
      { error: 'Missing wallet parameter' },
      { status: 400 }
    );
  }

  try {
    const txs = await getTxsByWallet(wallet);
    return NextResponse.json(txs);
  } catch (error: unknown) {
    console.error('Error fetching transactions:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
