import { NextRequest, NextResponse } from 'next/server';
import { createTransaction } from '../../lib/anvil';
import { createOrLoadPolicy } from '../../lib/policy';
import { storeTransaction } from '../../lib/redis';
import { randomBytes } from 'crypto';

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

    const policyResult = createOrLoadPolicy();
    
    if (!policyResult.keyHash || !policyResult.policyId) {
      return NextResponse.json(
        { error: 'Failed to load policy data. Make sure POLICY_KEY_HASH is set in environment variables.' },
        { status: 500 }
      );
    }
    
    const { keyHash, slot, policyId } = policyResult;

    // Generate metadata for the NFT. replace with actual asset metadata
    const metadata = {
      attributes: {
        part1: randomBytes(8).toString('hex'),
        part2: randomBytes(8).toString('hex'),
        part3: randomBytes(8).toString('hex'),
      },
      name: `0x${new Date().getTime()}`,
    };

    const asset = {
      version: 'cip25',
      assetName: metadata.name,
      metadata: {
        name: metadata.name,
        image: [
          'https://ada-anvil.s3.ca-central-1.amazonaws.com/',
          'logo_pres_V2_3.png',
        ],
        mediaType: 'image/png',
        description: 'Minting Platform Example using Anvil API',
        attributes: metadata.attributes,
      },
      policyId,
      quantity: 1,
    };

    const transaction = await createTransaction(
      changeAddress,
      utxos,
      asset,
      keyHash,
      slot,
      policyId,
    );

    await storeTransaction(transaction.hash, transaction);

    return NextResponse.json({
      success: true,
      transaction: transaction
    });
  } catch (error) {
    console.error('Mint API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create mint transaction' },
      { status: 500 }
    );
  }
}
