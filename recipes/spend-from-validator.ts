// spend-from-validator.ts — unlock the UTXO locked by apply-params-and-lock.ts (Plutus spend).
// node spend-from-validator.ts
import { readFileSync } from "node:fs";
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
type Lock = {
  scriptHash: string;
  outputRef: { txHash: string; index: number };
  messageHex: string;
  preloadedScript: unknown;
};
const lock = JSON.parse(readFileSync("lock.json", "utf8")) as Lock;

// One scriptInteraction per locked UTXO: `outputRef` is an OBJECT and `redeemer` is { type, value }
// (json = serialised with the handler's redeemer schema; hex = used as-is). The validator checks
// redeemer.msg == expected_msg and that `owner` signed, hence `requiredSigners` with the wallet's key hash.
// Anvil picks collateral (a wallet UTXO with at least 4 ADA above its own minimum ADA, ADA-only
// UTXOs first), evaluates the script and fills in the execution units; `evaluationResult` reports
// them keyed "spend:<position of the script input among the transaction inputs>".
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  scriptInteractions: [
    {
      purpose: "spend",
      hash: lock.scriptHash,
      outputRef: lock.outputRef,
      redeemer: { type: "json", value: { msg: lock.messageHex } },
      scriptSource: "code", // "ref" once the script is published as a reference script
    },
  ],
  requiredSigners: [wallet.key_hash],
  preloadedScripts: [lock.preloadedScript], // the same object apply-params returned
});
console.log("built", built.hash, "ex-units", JSON.stringify(built.evaluationResult));

await signAndSubmit(built.complete, wallet.skey);
