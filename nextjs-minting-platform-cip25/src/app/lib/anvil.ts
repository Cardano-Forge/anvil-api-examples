const ANVIL_API_URL = process.env.ANVIL_API_URL;
const ANVIL_API_KEY = process.env.ANVIL_API_KEY;

import { FixedTransaction, PrivateKey } from "@emurgo/cardano-serialization-lib-asmjs";

// Ensure headers are set properly for all API calls
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Api-Key': ANVIL_API_KEY || '',
});

/**
 * Create a transaction using the Anvil API
 */
export async function createTransaction(
  changeAddress: string,
  utxos: string | string[],
  asset: { assetName: string, policyId: string, quantity: number },
  keyHash: string,
  slot: number,
  policyId: string,
) {
  if (!ANVIL_API_URL || !ANVIL_API_KEY) {
    throw new Error('Anvil API URL or key not found in environment variables');
  }

  const data = {
    changeAddress,
    mint: [asset],
    outputs: [
      {
        address: process.env.TREASURY_BASE_ADDRESS_PREPROD,
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

    return await response.json();
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Submit a signed transaction to the blockchain
 */
export async function submitTransaction(signedTx: string, completeTransaction: string) {
  if (!ANVIL_API_URL || !ANVIL_API_KEY) {
    throw new Error('Anvil API URL or key not found in environment variables');
  }
  
  try {
    // Sign transaction with policy key
    const transactionToSubmit = FixedTransaction.from_bytes(
      Buffer.from(completeTransaction, "hex"),
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

    return await response.json();

  } catch (error) {
    console.error('Error submitting transaction:', error);
    throw error;
  }
}