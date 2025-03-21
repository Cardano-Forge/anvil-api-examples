import { NextRequest, NextResponse } from 'next/server';
import { submitTransaction } from '../../lib/anvil';

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
    const { signedTx, hash } = await req.json();

    if (!signedTx || !hash) {
      return NextResponse.json(
        { error: 'Missing signed transaction or hash' },
        { status: 400 }
      );
    }

    const result = await submitTransaction(signedTx, hash);
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
