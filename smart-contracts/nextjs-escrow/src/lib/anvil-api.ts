const API_ENDPOINT = 'https://preprod.api.ada-anvil.app/v2/services';

const X_API_KEY = process.env.ANVIL_API_KEY;

if (!X_API_KEY) {
  throw new Error('ANVIL_API_KEY environment variable is not set');
}

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': X_API_KEY,
});

// Error handling utilities
const handleApiError = (context: string, error: unknown): string => {
  console.error(`Error ${context}:`, error);
  const message = error instanceof Error ? error.message : String(error);
  return `Failed to ${context}: ${message}`;
};

// Generic API fetch with error handling
async function fetchApi<T>(url: string, options: RequestInit, context: string): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error(`${context} error:`, response.status, response.statusText, errText);
      throw new Error(`${response.status} ${response.statusText} - ${errText}`);
    }
    
    return await response.json() as T;
  } catch (error) {
    throw new Error(handleApiError(context, error));
  }
}

// Interface for lock funds parameters
interface LockFundsParams {
  changeAddress: string;     // User's wallet address for change
  lovelaceAmount: number;    // Amount in lovelace to lock in escrow
  ownerKeyHash: string;      // Public key hash of the owner who can unlock funds
  message?: string;          // Optional transaction message
}

// Interface for the lock funds response
interface LockFundsResponse {
  txHash?: string;  // Transaction hash if successful
  complete?: string; // Complete tx for client-side signing
  error?: string;   // Error message if the request fails
}

// Interface for unlock funds parameters
export interface UnlockFundsParams {
  txHash: string;
  changeAddress: string;
  ownerKeyHash: string;       // Key hash for requiredSigners
  unlockReason?: string;
}

// Interface for the unlock funds response
export interface UnlockFundsResponse {
  complete?: string;
  error?: string;
}

/**
 * Get the script address for a validator hash
 */
export async function getScriptAddress(validatorHash: string): Promise<string> {
  const data = await fetchApi<{ hex: string }>(
    `${API_ENDPOINT}/validators/${validatorHash}/address`,
    {
      method: 'GET',
      headers: getHeaders(),
    },
    'get script address'
  );
  return data.hex;
}

/**
 * Get the payment verification key hash from an address
 */
export async function getAddressKeyHash(address: string): Promise<string> {
  const data = await fetchApi<{ payment: string }>(
    `${API_ENDPOINT}/utils/addresses/parse`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ address }),
    },
    'get address key hash'
  );
  return data.payment;
}

/**
 * Lock funds in the escrow smart contract
 * This creates a transaction that sends ADA to the script address with the specified datum
 */
export async function lockFunds(params: LockFundsParams): Promise<LockFundsResponse> {
  try {
    // Derive owner payment key hash for datum
    const paymentKeyHash = await getAddressKeyHash(params.changeAddress);
    
    // Get the validator hash from environment
    const validatorHash = process.env.ESCROW_VALIDATOR_HASH;
    if (!validatorHash) {
      throw new Error('Escrow validator hash not found');
    }
    
    // Get script address
    const scriptAddress = await getScriptAddress(validatorHash);
    
    // Prepare the transaction input
    const input = {
      changeAddress: params.changeAddress,
      message: params.message || "Locking funds in escrow using Anvil API",
      outputs: [
        {
          address: scriptAddress,
          lovelace: params.lovelaceAmount,
          datum: {
            type: "inline",
            value: {
              owner: paymentKeyHash
            },
            shape: {
              validatorHash: validatorHash,
              purpose: "spend"
            }
          }
        }
      ],
    };

    // Build the transaction using our generic fetch utility
    const result = await fetchApi<{ hash: string, complete: string }>(
      `${API_ENDPOINT}/transactions/build`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(input),
      },
      'build lock transaction'
    );
    
    // Return hash and complete transaction for client-side signing and DB recording
    return {
      txHash: result.hash,
      complete: result.complete,
    };
  } catch (error: unknown) {
    return { error: handleApiError('lock funds', error) };
  }
}

/**
 * Unlock funds from the escrow smart contract
 * This creates a transaction that spends the UTXO with the specified redeemer
 */
export async function unlockFunds(
  params: UnlockFundsParams
): Promise<UnlockFundsResponse> {
  try {
    // Get the validator hash from environment
    const validatorHash = process.env.ESCROW_VALIDATOR_HASH;
    if (!validatorHash) {
      throw new Error('Escrow validator hash not found');
    }

    // Derive owner payment key hash for requiredSigners
    const signerKeyHash = await getAddressKeyHash(params.changeAddress);

    const input = {
      changeAddress: params.changeAddress,
      message: params.unlockReason || 'Unlocking funds using Anvil API',
      scriptInteractions: [
        {
          hash: validatorHash,
          purpose: 'spend',
          outputRef: {
            txHash: params.txHash,
            index: 0,
          },
          redeemer: {
            type: "json",
            value: {
              msg: Buffer.from("Hello, World!", "utf8").toString("hex"),
            },
          },
        },
      ],
      requiredSigners: [signerKeyHash],
    };

    // Build the transaction using our generic fetch utility
    const result = await fetchApi<{ complete: string }>(
      `${API_ENDPOINT}/transactions/build`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(input),
      },
      'build unlock transaction'
    );
    
    return { complete: result.complete };
  } catch (error: unknown) {
    return { error: handleApiError('unlock funds', error) };
  }
}

/**
 * Submit a signed transaction to the blockchain
 */
export async function submitTransaction(signedTx: string, complete: string): Promise<{ txHash: string }> {
  // Use our generic fetch utility with proper error handling
  const result = await fetchApi<{ txHash: string }>(
    `${API_ENDPOINT}/transactions/submit`,
    {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        signatures: [signedTx],
        transaction: complete,
      }),
    },
    'submit transaction'
  );
  
  return { txHash: result.txHash };
}
