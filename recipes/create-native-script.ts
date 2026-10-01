// create-native-script.ts — build a minting policy: "signed by this wallet AND before a deadline".
// node create-native-script.ts
// Costs nothing: the policy id is a hash; nothing goes on-chain until you mint. Writes policy.json.
import { writeFileSync } from "node:fs";
import { loadWallet, post } from "./_lib.ts";

const wallet = loadWallet();
// No mint or burn after the deadline (default: one year from now). Keep it more than 2 hours away:
// a build's validity ends 2 hours after it is made, and `before` rejects a later validity end.
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const DEADLINE = process.env.POLICY_DEADLINE ?? new Date(Date.now() + ONE_YEAR_MS).toISOString();

// 1. Key hash of the signer: `payment` from /utils/addresses/parse (56 hex — never a bech32 address).
const { payment: keyHash } = await post<{ payment: string; stake?: string }>(
  "/utils/addresses/parse",
  { address: wallet.base_address_preprod },
);

// 2. Deadline as an absolute slot. `time` is MILLISECONDS; seconds give a negative slot, which
//    /utils/native-scripts/serialize rejects with 400 Failed to parse policy script.
const { slot } = await post<{ slot: number }>("/utils/network/time-to-slot", {
  time: Date.parse(DEADLINE),
});

// 3. Serialise. Keep the JSON: POST /transactions/build wants it in preloadedScripts, not the CBOR.
const script = {
  type: "all",
  scripts: [
    { type: "sig", keyHash },
    { type: "before", slot },
  ],
};
const { policyId, script: cbor } = await post<{ policyId: string; script: string }>(
  "/utils/native-scripts/serialize",
  { schema: script },
);
console.log("policyId", policyId, "script bytes", cbor.length / 2);

// 4. Save exactly what was serialised — reordering clauses changes the policy id.
writeFileSync("policy.json", JSON.stringify({ policyId, script, deadline: DEADLINE }, null, 2));
console.log("wrote policy.json");
