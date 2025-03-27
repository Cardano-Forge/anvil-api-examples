"use server";

const BASE_URL = process.env.NEXT_PUBLIC_ANVIL_API_URL;

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
  if (!BASE_URL) {
    throw new Error("Anvil API base URL is not configured");
  }

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

  return callAnvilApi<TransactionSubmitResult, SubmitTransactionParams>({
    endpoint: "transactions/submit",
    body: params,
  });
}
