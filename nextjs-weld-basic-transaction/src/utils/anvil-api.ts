"use server";

const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "preprod";
const BASE_URL = `https://${NETWORK}.api.ada-anvil.app/v2/services`;

interface AnvilApiConfig<T = Record<string, unknown>> {
  endpoint: string;
  method?: "GET" | "POST";
  body?: T;
  apiKey?: string;
}

export async function callAnvilApi<T, B = Record<string, unknown>>({
  endpoint,
  method = "POST",
  body,
  apiKey,
}: AnvilApiConfig<B>): Promise<T> {
  const key = apiKey || process.env.ANVIL_API_KEY;
  if (!key) {
    throw new Error("API key is required for Anvil API");
  }

  const headers = {
    "Content-Type": "application/json",
    "X-Api-Key": key,
  };

  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      throw new Error(
        `Anvil API Error (${response.status}): ${errorData.message || "Unknown error"}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("Anvil API request failed:", error);
    throw error;
  }
}

export interface BuildTransactionParams {
  changeAddress: string;
  utxos: string[];
  outputs: {
    address: string;
    lovelace: number;
    assets?: Record<string, number>;
  }[];
}

export interface TransactionBuildResult {
  hash: string;
  complete: string; // CBOR
  stripped: string; // CBOR
  witnessSet: string; // CBOR
}

export async function buildTransaction(
  params: BuildTransactionParams,
): Promise<TransactionBuildResult> {
  if (!params.changeAddress) {
    throw new Error("Change address is required");
  }
  if (!params.utxos || !params.utxos.length) {
    throw new Error("UTXOs are required");
  }
  if (!params.outputs || !params.outputs.length) {
    throw new Error("Outputs are required");
  }

  return callAnvilApi<TransactionBuildResult, BuildTransactionParams>({
    endpoint: "transactions/build",
    body: params,
  });
}

export interface SubmitTransactionParams {
  transaction: string; // CBOR
  signatures?: string[];
}

export interface TransactionSubmitResult {
  txHash: string;
}

export async function submitTransaction(
  params: SubmitTransactionParams,
): Promise<TransactionSubmitResult> {
  if (!params.transaction) {
    throw new Error("Transaction is required");
  }
  if (params.signatures && !params.signatures.length) {
    throw new Error("Signatures are required");
  }

  return callAnvilApi<TransactionSubmitResult, SubmitTransactionParams>({
    endpoint: "transactions/submit",
    body: params,
  });
}
