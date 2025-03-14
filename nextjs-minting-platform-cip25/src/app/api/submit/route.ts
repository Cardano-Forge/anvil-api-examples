import { NextRequest, NextResponse } from 'next/server';
import { submitTransaction } from '../../lib/anvil';
import { getTransaction, removeTransaction } from '../../lib/redis';

/**
 * Transaction Submission API endpoint
 * Submits a signed transaction to the blockchain
 * 
 * @param req Request containing the signed transaction and hash
 * @returns Response with submission result or error
 */
export async function POST(req: NextRequest) {
  console.log('Submit API request:', req.body);
  try {
    const { signedTx, transaction } = await req.json();

    if (!signedTx || !transaction) {
      return NextResponse.json(
        { error: 'Missing signed transaction or hash' },
        { status: 400 }
      );
    }

    // Check if transaction exists in cache
    const storedTx = await getTransaction(transaction.hash);
    if (!storedTx) {
      return NextResponse.json(
        { error: 'Transaction not found or expired' },
        { status: 404 }
      );
    }

    const result = await submitTransaction(signedTx, transaction.complete);

    // Remove transaction from cache after successful submission
    await removeTransaction(transaction.hash);

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit transaction' },
      { status: 500 }
    );
  }
}
