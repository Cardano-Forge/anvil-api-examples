import { NextRequest, NextResponse } from 'next/server';
import { createTransaction } from '../../lib/anvil';
import { createOrLoadPolicy } from '../../lib/policy';

/**
 * Mint API endpoint - creates a new NFT minting transaction
 * 
 * @param req Request containing the change address
 * @returns Response with transaction details or error
 */
export async function POST(req: NextRequest) {
  try {
    const { changeAddress, utxos } = await req.json();
    if (!changeAddress || !utxos) {
      return NextResponse.json(
        { error: 'Missing change address or utxos' },
        { status: 400 }
      );
    }

    const { keyHash, slot, policyId } = await createOrLoadPolicy();
    if (!keyHash || !policyId) {
      return NextResponse.json(
        { error: 'Failed to load policy data. Make sure POLICY_KEY_HASH is set in environment variables.' },
        { status: 500 }
      );
    }
    
    const transaction = await createTransaction(
      changeAddress,
      utxos,
      keyHash,
      slot,
      policyId,
    );

    return NextResponse.json({
      success: true,
      hash: transaction.hash,
      strippedTransaction: transaction.stripped // Note: if you return the complete transaction you will expose the NFT metadata when the client signs
    });
    
  } catch (error) {
    console.error('Mint API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create mint transaction' },
      { status: 500 }
    );
  }
}
