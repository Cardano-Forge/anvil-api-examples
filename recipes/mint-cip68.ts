// mint-cip68.ts — mint a CIP-68 pair: reference token (label 100, datum) + user token (label 222).
// node mint-cip68.ts
import { readFileSync, writeFileSync } from "node:fs";
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const policy = JSON.parse(readFileSync("policy.json", "utf8")) as {
  policyId: string;
  script: unknown;
};
const NAME = `AnvilRecipe68_${Date.now() % 100_000}`;

// CIP-68: a label is mandatory; `metadata` is allowed only on the label-100 reference token and
// becomes its datum `Constr 0 [metadata, 1, extraDatum?]`. That datum output is only produced when
// `destAddress` is set — always set it on the 100 entry. Datum strings are encoded like utf8 asset
// names (printable ASCII only), and values 0, false and "" are dropped.
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  mint: [
    {
      version: "cip68",
      policyId: policy.policyId,
      assetName: { name: NAME, label: 100, format: "utf8" },
      quantity: 1,
      metadata: {
        name: NAME,
        image: "ipfs://QmPlaceholderImageCid0000000000000000000000000",
        attributes: { level: 1 },
      },
      inline: true, // inline datum (default false = datum hash on the output + datum in the witness set)
      destAddress: wallet.base_address_preprod, // the "metadata manager": its holder can update
    },
    {
      version: "cip68",
      policyId: policy.policyId,
      assetName: { name: NAME, label: 222, format: "utf8" },
      quantity: 1,
      destAddress: wallet.base_address_preprod, // the user token — what a customer receives
    },
  ],
  preloadedScripts: [{ type: "simple", hash: policy.policyId, script: policy.script }],
});
console.log("built", built.hash);

await signAndSubmit(built.complete, wallet.skey);
writeFileSync("cip68.json", JSON.stringify({ policyId: policy.policyId, name: NAME }, null, 2));
console.log("wrote cip68.json (read by update-cip68-metadata.ts)");
