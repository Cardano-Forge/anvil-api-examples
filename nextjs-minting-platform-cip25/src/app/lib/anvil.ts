'use server'

import { FixedTransaction, PrivateKey } from "@emurgo/cardano-serialization-lib-asmjs-gc";
import { randomBytes } from 'node:crypto';
import { getTransaction, removeTransaction, storeTransaction } from "./redis";
const { ANVIL_API_URL, ANVIL_API_KEY } = process.env;

// Define interfaces for the asset types
interface AssetAttribute {
  trait_type: string;
  value: string | number | boolean;
}

interface AssetMetadata {
  name: string;
  image: string | string[];
  mediaType: string;
  description: string;
  attributes?: AssetAttribute[];
}

interface Asset {
  version: string;
  assetName: { name: string, format: string };
  metadata: AssetMetadata;
  policyId: string;
  quantity: number;
}

// Ensure headers are set properly for all API calls
const getHeaders = () => {
  if (!ANVIL_API_KEY) {
    throw new Error('Anvil API key not found in environment variables');
  }
  
  return {
    'Content-Type': 'application/json',
    'X-Api-Key': ANVIL_API_KEY,
  };
};

/**
 * Generate an NFT asset with metadata
 * @param policyId The policy ID for the asset
 * @returns Asset object configured according to CIP-25 standard
 */
export async function generateAsset(policyId: string): Promise<Asset> {
  // Generate random attributes
  const randomAttributes: AssetAttribute[] = [
    { trait_type: 'part1', value: randomBytes(8).toString('hex') },
    { trait_type: 'part2', value: randomBytes(8).toString('hex') },
    { trait_type: 'part3', value: randomBytes(8).toString('hex') },
  ];

  // Generate a timestamp-based name
  const assetName = `0x${new Date().getTime()}`;
  
  return {
    version: 'cip25',
    assetName: { name: assetName, format: "utf8" },
    metadata: {
      name: assetName,
      image: [
        'https://ada-anvil.s3.ca-central-1.amazonaws.com/',
        'logo_pres_V2_3.png',
      ],
      mediaType: 'image/png',
      description: 'Minting Platform Example using Anvil API',
      attributes: randomAttributes,
    },
    policyId,
    quantity: 1,
  };
}

/**
 * Create a transaction using the Anvil API
 */
export async function createTransaction(
  changeAddress: string,
  utxos: string | string[],
  keyHash: string,
  slot: number,
  policyId: string,
) {
  if (!ANVIL_API_URL || !ANVIL_API_KEY) {
    throw new Error('Anvil API URL or key not found in environment variables');
  }

  const asset = await generateAsset(policyId);
  const data = {
    changeAddress,
    mint: [asset],
    outputs: [
      {
        address: process.env.TREASURY_BASE_ADDRESS,
        lovelace: 1_000_000,
      },
      {
        address: changeAddress,
        utxos: utxos,
        assets: [
          {
            assetName: asset.assetName,
            policyId: asset.policyId,
            quantity: asset.quantity,
          },
        ],
      },
    ],
    preloadedScripts: [
      {
        type: 'simple',
        script: {
          type: 'all',
          scripts: [
            {
              type: 'sig',
              keyHash,
            },
            {
              type: 'before',
              slot,
            },
          ],
        },
        hash: policyId,
      },
    ],
  };

  try {
    const response = await fetch(`${ANVIL_API_URL}/transactions/build`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const transaction = await response.json();
    await storeTransaction(transaction.hash, transaction);

    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Submit a signed transaction to the blockchain
 */
export async function submitTransaction(signedTx: string, hash: string) {
  if (!ANVIL_API_URL || !ANVIL_API_KEY) {
    throw new Error('Anvil API URL or key not found in environment variables');
  }

  // Check if transaction exists in cache
  const transaction = await getTransaction(hash);
  if (!transaction) {
    throw new Error('Transaction not found or expired when submitting');
  }
  
  try {
    // Sign transaction with policy key
    const transactionToSubmit = FixedTransaction.from_bytes(
      Buffer.from(transaction.complete, "hex"),
    );

    // Add policy key signature - you need to load this from environment variables or a secure store
    const policyKey = process.env.POLICY_SIGN_KEY;
    if (!policyKey) {
      throw new Error('Policy private key not found');
    }

    transactionToSubmit.sign_and_add_vkey_signature(
      PrivateKey.from_bech32(policyKey),
    );

    const response = await fetch(`${ANVIL_API_URL}/transactions/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        signatures: [signedTx], // Client wallet signature
        transaction: transactionToSubmit.to_hex() // Policy-key signed transaction
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    // Remove transaction from cache after successful submission
    await removeTransaction(hash);

    return await response.json();
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}