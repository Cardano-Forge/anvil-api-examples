// parse-transaction.ts — decode a transaction (CBOR you just built, or an on-chain hash) into JSON.
// node parse-transaction.ts
// Nothing is submitted: the wallet only needs UTXOs so the build can be balanced.
import { type Built, loadWallet, post } from "./_lib.ts";

const wallet = loadWallet();

type Output = { address: string; lovelace: string; assets: unknown[]; datum?: unknown };
type Parsed = {
  body: {
    inputs: { outputRef: { txHash: string; index: number }; output?: Output }[];
    outputs: Output[];
    fee?: string;
    ttl?: { slot: string; unixTime: string };
  };
  witnessSet: { vkeys?: unknown[]; redeemers?: unknown[] };
  auxiliaryData?: { metadata?: Record<string, unknown> };
  isValid: boolean;
};

// 1. Something to parse: an unsigned payment from the wallet to its own address.
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  outputs: [{ address: wallet.enterprise_address_preprod, lovelace: 2_000_000 }],
  message: "parse me",
});

// 2. Parse the CBOR. Inputs are resolved to the UTXOs they spend; datums and redeemers are decoded
//    to JSON when Anvil has a blueprint for the script. Amounts come back as strings.
const parsed = await post<Parsed>("/transactions/parse", { transaction: built.complete });
console.log("fee", parsed.body.fee, "ttl", parsed.body.ttl?.unixTime, "isValid", parsed.isValid);
for (const [i, o] of parsed.body.outputs.entries()) {
  console.log(`output ${i}: ${o.lovelace} lovelace → ${o.address.slice(0, 24)}…`);
}
console.log("metadata", JSON.stringify(parsed.auxiliaryData?.metadata));

// 3. The same endpoint takes a 64-hex transaction hash (looked up in Anvil's indexer, this network).
const TX_HASH = process.env.TX_HASH; // optional: any preprod transaction Anvil has indexed
if (TX_HASH) {
  const onChain = await post<Parsed>("/transactions/parse", { transaction: TX_HASH });
  console.log(
    TX_HASH,
    "inputs",
    onChain.body.inputs.length,
    "outputs",
    onChain.body.outputs.length,
  );
}
