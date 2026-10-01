// _lib.ts — the one helper every recipe imports. Runs on Node.js 22.18+, Deno 2 and Bun; its one
// dependency (the Cardano serialization library, used to sign) is in package.json.
// Env: ANVIL_API_KEY (required) · ANVIL_API_URL, ANVIL_WALLET (optional)
//      DRY_RUN=true signs but never submits · ALLOW_SUBMIT=true overrides DRY_RUN.
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import {
  FixedTransaction,
  PrivateKey,
  TransactionUnspentOutput,
} from "@emurgo/cardano-serialization-lib-nodejs";

export const API = process.env.ANVIL_API_URL ?? "https://preprod.api.ada-anvil.app/v2/services";
const apiKey = process.env.ANVIL_API_KEY;
if (!apiKey) {
  throw new Error("Set ANVIL_API_KEY — see https://dev.ada-anvil.io/start/before-you-start");
}
export const HEADERS = { "Content-Type": "application/json", "x-api-key": apiKey };
export const DRY_RUN = process.env.DRY_RUN === "true" && process.env.ALLOW_SUBMIT !== "true";

// Anvil's error body is { message, code } (+ issues[] on a 400 input-validation error). A body that
// is not JSON (a gateway or proxy page) is reported as raw text instead of a JSON parse error.
async function unwrap<T>(response: Response, label: string): Promise<T> {
  const text = await response.text();
  if (!response.ok) {
    let body: { message?: string; issues?: unknown } = {};
    try {
      body = JSON.parse(text) ?? {};
    } catch {
      // not JSON: fall through to the raw text
    }
    const issues = body.issues ? ` ${JSON.stringify(body.issues)}` : "";
    throw new Error(`${label} → ${response.status}: ${body.message ?? text}${issues}`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

/** POST <API><path> with a JSON body. */
export function post<T = unknown>(path: string, body: unknown): Promise<T> {
  const init = { method: "POST", headers: HEADERS, body: JSON.stringify(body) };
  return fetch(`${API}${path}`, init).then((r) => unwrap<T>(r, `POST ${path}`));
}

/** GET <API><path>. Resolves to undefined on an empty 200 body (marketplace "not listed"). */
export function get<T = unknown>(path: string): Promise<T> {
  return fetch(`${API}${path}`, { headers: HEADERS }).then((r) => unwrap<T>(r, `GET ${path}`));
}

/** Response of POST /transactions/build. */
export type Built = {
  hash: string;
  complete: string;
  stripped: string;
  witnessSet: string;
  auxiliaryData?: string;
  evaluationResult?: Record<string, { memory: number; steps: number }>;
};

/**
 * wallet.json, written by create-wallet.ts or by the Wallet CLI with `--mnemonic`
 * (github.com/Cardano-Forge/cardano-wallet-cli). Without `--mnemonic` the CLI writes no base,
 * reward or stake fields, and every recipe that uses base_address_preprod as changeAddress fails
 * with 400 Input validation failed. Keys: 56-hex key hashes, bech32 signing keys.
 */
export type Wallet = {
  base_address_preprod: string;
  enterprise_address_preprod: string;
  reward_address_preprod?: string;
  key_hash: string;
  skey: string;
  stake_key_hash?: string;
  stake_skey?: string;
};

export function loadWallet(file = process.env.ANVIL_WALLET ?? "wallet.json"): Wallet {
  return JSON.parse(readFileSync(file, "utf8")) as Wallet;
}

/** Sign `complete` with every key, then POST /transactions/submit. Returns the tx hash. */
export async function signAndSubmit(complete: string, ...skeys: string[]): Promise<string> {
  const tx = FixedTransaction.from_bytes(Buffer.from(complete, "hex"));
  for (const skey of skeys) tx.sign_and_add_vkey_signature(PrivateKey.from_bech32(skey));
  const hash = tx.transaction_hash().to_hex();
  if (DRY_RUN) {
    console.log(`DRY_RUN — signed, not submitted: ${hash}`);
    return hash;
  }
  const { txHash } = await post<{ txHash: string }>("/transactions/submit", {
    transaction: tx.to_hex(),
  });
  console.log(`submitted ${txHash}`);
  return txHash;
}

/**
 * Resolve once `txHash` has an output at `address` in the UTXO set POST /transactions/build reads.
 * GET /wallets/utxos returns the same confirmed UTXOs the builder selects from, so a hit here
 * means the next build will see it. Entries are TransactionUnspentOutput CBOR hex. Every recipe's
 * change lands at its changeAddress: watch that one. Throws at `timeoutMs`.
 */
export async function waitForTx(
  txHash: string,
  address: string,
  { timeoutMs = 300_000, everyMs = 10_000 } = {},
): Promise<void> {
  if (DRY_RUN) {
    console.log(`DRY_RUN — not waiting for ${txHash}`);
    return;
  }
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const utxos = (await get<string[] | undefined>(`/wallets/utxos?address=${address}`)) ?? [];
    const spendable = utxos.some(
      (hex) => TransactionUnspentOutput.from_hex(hex).input().transaction_id().to_hex() === txHash,
    );
    if (spendable) return;
    if (Date.now() >= deadline) {
      throw new Error(`${txHash} not in the UTXO set of ${address} after ${timeoutMs / 1000}s`);
    }
    await new Promise((resolve) => setTimeout(resolve, everyMs));
  }
}
