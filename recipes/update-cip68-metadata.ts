// update-cip68-metadata.ts — change the datum of a CIP-68 reference token held by this wallet.
// node update-cip68-metadata.ts
// Only for reference tokens at a KEY address you control: the UTXO is spent as a regular input with
// no script witness. Tokens locked by a spend validator need scriptInteractions instead.
import { readFileSync } from "node:fs";
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const asset = JSON.parse(readFileSync("cip68.json", "utf8")) as { policyId: string; name: string };

// Pass the USER token's name (label 222): Anvil rewrites the label prefix to 000643b0 (100) to find
// the reference UTXO, reads its datum and re-creates the output with the new one.
// action "update" replaces metadata and extraDatum wholesale · "append" shallow-merges (`attributes`
// one level deeper) · "minAda" keeps the datum's content and only re-creates the output (e.g. to
// move it via destAddress). `metadata` is required unless action is "minAda" (400 otherwise).
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  cip68MetadataUpdates: [
    {
      policyId: asset.policyId,
      assetName: { name: asset.name, label: 222, format: "utf8" },
      action: "append",
      metadata: { description: "Updated by update-cip68-metadata.ts", attributes: { level: 2 } },
      inline: true,
    },
  ],
});
console.log("built", built.hash);

// The reference UTXO's owner (this wallet) signs; it also pays the fee.
await signAndSubmit(built.complete, wallet.skey);
