// upload-blueprint.ts — register a CIP-57 blueprint (plutus.json), publish its validators as
// reference scripts, and record the reference UTXOs on the blueprint.
// node upload-blueprint.ts
// plutus.json: the Aiken hello-world from github.com/Cardano-Forge/anvil-api-examples
// (smart-contracts/hello-world/aiken-hello-world/plutus.json). Two keys are global across
// organisations: title@version (rewritten below) and each validator hash (the compiled code).
// If another organisation already uploaded this exact code, step 1 fails: upload your own contract.
import { readFileSync } from "node:fs";
import { type Built, DRY_RUN, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const blueprint = JSON.parse(readFileSync("plutus.json", "utf8"));
blueprint.preamble.title =
  process.env.BLUEPRINT_TITLE ?? `${wallet.key_hash.slice(0, 8)}/hello-world`;

// 1. Upload. Your own title@version again = update in place; validators are keyed by hash.
type Uploaded = {
  blueprintId: number;
  scriptAddresses: Record<string, string>;
  jsonSchema: unknown;
};
const { blueprintId, scriptAddresses } = await post<Uploaded>("/blueprints/", { blueprint });
const hashes = Object.keys(scriptAddresses); // one per distinct validator hash; addresses are HEX
console.log("blueprintId", blueprintId, "validators", hashes);

// 2. Publish each validator's compiled code as a reference script: an output whose `datum` is
//    { type: "script", hash }. Later transactions can then use scriptSource: "ref" instead of
//    embedding the code.
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  message: "Reference scripts for hello-world",
  outputs: hashes.map((hash) => ({
    address: scriptAddresses[hash],
    datum: { type: "script", hash },
  })),
});
const txHash = await signAndSubmit(built.complete, wallet.skey);

// 3. Tell Anvil where the scripts live. Outputs are in request order, so validator i is output i.
//    Pass `refs` on every re-upload: an upload without it clears the refs recorded earlier.
//    Not in a DRY_RUN: the transaction never reached the chain, the refs would point at nothing.
if (DRY_RUN) {
  console.log("DRY_RUN — refs not recorded");
} else {
  const refs = Object.fromEntries(hashes.map((hash, index) => [hash, { txHash, index }]));
  await post<Uploaded>("/blueprints/", { blueprint, refs });
  console.log("refs recorded", JSON.stringify(refs));
}
