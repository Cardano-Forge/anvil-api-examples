// mint-cip25.ts — mint one NFT with CIP-25 metadata under the policy from create-native-script.ts.
// node mint-cip25.ts
import { readFileSync } from "node:fs";
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const policy = JSON.parse(readFileSync("policy.json", "utf8")) as {
  policyId: string;
  script: unknown;
};
// Printable ASCII only: format "utf8" writes each UTF-16 code unit as unpadded hex, so any other
// character gives a different name than NAME_HEX.
const NAME = `AnvilRecipe${Date.now() % 100_000}`;
const NAME_HEX = Array.from(new TextEncoder().encode(NAME), (b) =>
  b.toString(16).padStart(2, "0"),
).join("");

// `version` is mandatory. `assetName` as an object — a bare string is used as HEX, unvalidated.
// `metadata` lands under label 721 as { policyId: { <name>: metadata } }. Strings over 64 characters
// are split into arrays of 64-character chunks, except strings inside arrays.
// `preloadedScripts` is needed until the policy has been seen on-chain; hash must equal the script's.
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  mint: [
    {
      version: "cip25",
      policyId: policy.policyId,
      assetName: { name: NAME, format: "utf8" },
      quantity: 1,
      metadata: {
        name: NAME,
        image: "ipfs://QmPlaceholderImageCid0000000000000000000000000",
        mediaType: "image/png",
        description: "Minted with the Anvil API recipes",
      },
      // destAddress: "<receiver_address>", // omitted: the token lands in change (this wallet)
    },
  ],
  preloadedScripts: [{ type: "simple", hash: policy.policyId, script: policy.script }],
});
console.log("built", built.hash, "metadata attached:", Boolean(built.auxiliaryData));

// A `sig` clause is NOT added to requiredSigners automatically: the policy key must sign explicitly.
// In these recipes the policy key and the paying key are the same wallet, so one signature does both.
await signAndSubmit(built.complete, wallet.skey);
console.log(`ASSET_NAME_HEX=${NAME_HEX}  (unit ${policy.policyId}${NAME_HEX})`);
