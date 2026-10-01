// burn-asset.ts — burn a token: a negative mint quantity under the same policy.
// node burn-asset.ts
import { readFileSync } from "node:fs";
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const policy = JSON.parse(readFileSync("policy.json", "utf8")) as {
  policyId: string;
  script: unknown;
};
// Bare hex, used verbatim: a missing or non-hex value would silently name a different asset.
const ASSET_NAME_HEX = process.env.ASSET_NAME_HEX; // printed by mint-cip25.ts
if (!ASSET_NAME_HEX) throw new Error("Set ASSET_NAME_HEX — mint-cip25.ts prints it");

// The token's UTXO must be among the 100 UTXOs Anvil fetches for changeAddress, and the policy must
// still be satisfiable — after a `before` deadline nothing can be minted OR burned.
// `version` is still required by the schema; a burn carries no metadata. Like every mint[] entry,
// a burn adds pricePerMint to Anvil's fee.
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  mint: [{ version: "cip25", policyId: policy.policyId, assetName: ASSET_NAME_HEX, quantity: -1 }],
  preloadedScripts: [{ type: "simple", hash: policy.policyId, script: policy.script }],
});
console.log("built", built.hash);

await signAndSubmit(built.complete, wallet.skey); // policy key = wallet key in these recipes
