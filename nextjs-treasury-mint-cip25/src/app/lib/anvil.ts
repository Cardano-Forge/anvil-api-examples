'use server'

import { FixedTransaction, PrivateKey } from "@emurgo/cardano-serialization-lib-asmjs-gc";
import { randomBytes } from 'node:crypto';

const { ANVIL_API_URL, ANVIL_API_KEY, POLICY_KEY_HASH, POLICY_EXPIRATION_DATE } = process.env;

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
    changeAddress: process.env.TREASURY_ADDRESS,
    utxos,
    mint: [asset],
    outputs: [
      {
        address: changeAddress,
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
    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Submit a signed transaction to the blockchain
 */
export async function submitTransaction(transaction: { complete: string }) {
  if (!ANVIL_API_URL || !ANVIL_API_KEY) {
    throw new Error('Anvil API URL or key not found in environment variables');
  }
  
  try {
    // Sign transaction with policy key
    const transactionToSubmit = FixedTransaction.from_bytes(
      Buffer.from(transaction.complete, "hex"),
    );

    // Add policy key signature  - you need to load this from environment variables or a secure store
    const policyKey = process.env.POLICY_SIGN_KEY;
    if (!policyKey) {
      throw new Error('Policy private key not found');
    }

    transactionToSubmit.sign_and_add_vkey_signature(
      PrivateKey.from_bech32(policyKey),
    );

    // Add treasury key signature - you need to load this from environment variables or a secure store
    const treasuryKey = process.env.TREASURY_SIGN_KEY;
    if (!treasuryKey) {
      throw new Error('Treasury private key not found');
    }

    transactionToSubmit.sign_and_add_vkey_signature(
      PrivateKey.from_bech32(treasuryKey),
    );

    const response = await fetch(`${ANVIL_API_URL}/transactions/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        transaction: transactionToSubmit.to_hex() // Fully signed transaction
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}

/**
 * Convert a DateTime to a Cardano slot number via Anvil API
 */
export async function timeToSlot(date: Date) {
  if (!ANVIL_API_URL || !ANVIL_API_KEY) {
    throw new Error('Anvil API URL or key not found in environment variables');
  }

  try {
    const timeInMilliseconds = date.getTime();
    const response = await fetch(`${ANVIL_API_URL}/utils/network/time-to-slot`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ time: timeInMilliseconds }),
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    return data.slot;
  } catch (error) {
    console.error('Error in dateToSlot:', error);
    throw error;
  }
}

/**
 * Create a native script using Anvil's serialization endpoint
 */
export async function createNativeScript(
  keyHash: string,
  ttl: number,
  with_timelock = true,
): Promise<{ type: string; script: object; hash: string }> {
  if (!ANVIL_API_URL || !ANVIL_API_KEY) {
    throw new Error('Anvil API URL or key not found in environment variables');
  }

  const baseScript = { type: "sig" as const, keyHash };
  let policyScriptSchema: 
    | { type: "sig", keyHash: string }
    | { type: "all", scripts: Array<{ type: "sig", keyHash: string } | { type: "before", slot: number }> };

  if (with_timelock) {
    policyScriptSchema = {
      type: "all",
      scripts: [baseScript, { type: "before", slot: ttl }],
    };
  } else {
    policyScriptSchema = baseScript;
  }

  const body = JSON.stringify({ schema: policyScriptSchema });

  const response = await fetch(`${ANVIL_API_URL}/utils/native-scripts/serialize`, {
    method: "POST",
    headers: getHeaders(),
    body,
  });

  console.log("Response: ", response);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${errorText}`);
  }

  const { policyId } = await response.json();

  return {
    type: "simple",
    script: policyScriptSchema,
    hash: policyId,
  };
}

/**
 * Create or load policy configuration 
 * 
 * This function establishes the constraints for token minting:
 * - keyHash: Controls who can sign minting transactions
 * - slot: Defines the blockchain slot after which no more tokens can be minted
 * - policyId: A unique identifier derived from the policy script that permanently
 *   identifies all tokens minted under this policy
 */
export async function createOrLoadPolicy() {
  if (!POLICY_EXPIRATION_DATE || !POLICY_KEY_HASH) {
    throw new Error('POLICY_EXPIRATION_DATE or POLICY_KEY_HASH is not defined in environment variables');
  }
  
  const slot = await timeToSlot(new Date(POLICY_EXPIRATION_DATE));
  const keyHash = POLICY_KEY_HASH;
  
  if (!keyHash) {
    throw new Error('POLICY_KEY_HASH is not defined in environment variables');
  }
  
  const policy = await createNativeScript(keyHash, slot, true);
  const policyId = policy.hash;
  return { slot, keyHash, policyId };
}

