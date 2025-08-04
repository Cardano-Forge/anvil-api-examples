import { NextRequest, NextResponse } from 'next/server';
import { createTransaction, submitTransaction, createOrLoadPolicy } from '@/app/lib/anvil';
import { getUtxos } from '@/app/lib/blockfrost';

/**
 * Mint API endpoint - creates a new NFT minting transaction
 * 
 * @param req Request containing the change address
 * @returns Response with transaction details or error
 */
export async function POST(req: NextRequest) {
  try {
    const { changeAddress } = await req.json();
    if (!changeAddress) {
      return NextResponse.json(
        { error: 'Missing change address' },
        { status: 400 }
      );
    }

    if (!process.env.TREASURY_ADDRESS) {
      throw new Error('Treasury address not found in environment variables');
    }

    const utxos = await getUtxos(process.env.TREASURY_ADDRESS);
    if (!utxos || utxos.length === 0) {
      return NextResponse.json(
        { error: 'No UTXOs found in treasury wallet. Please fund the treasury wallet.' },
        { status: 500 }
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

    // Step 2: Submit the transaction
    const result = await submitTransaction(transaction);

    return NextResponse.json({
      success: true,
      result,
    });
    
  } catch (error) {
    console.error('Mint API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create mint transaction' },
      { status: 500 }
    );
  }
}
