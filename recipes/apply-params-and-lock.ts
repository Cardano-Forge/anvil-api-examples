// apply-params-and-lock.ts — parameterise a validator, then lock 2 ADA at the resulting address.
// node apply-params-and-lock.ts
// plutus.json: aiken-hello-world-with-params/plutus.json from the examples repo. Its single
// parameter `expected_msg` is a ByteArray; the unlock redeemer must carry the same bytes.
import { readFileSync, writeFileSync } from "node:fs";
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const blueprint = JSON.parse(readFileSync("plutus.json", "utf8"));
const baseHash: string = blueprint.validators[0].hash; // 333158…e173 for the sample
// ByteArray parameters are hex: a text string is silently cut at its first non-hex character.
const MESSAGE_HEX = Array.from(new TextEncoder().encode("Hello, Anvil!"), (b) =>
  b.toString(16).padStart(2, "0"),
).join("");

// 1. Apply parameters. With an inline `blueprint` nothing needs uploading. `params` is keyed by the
//    BASE hash, values in declaration order. The result is a ready-made `preloadedScripts` entry.
type Applied = {
  preloadedScript: { type: "plutus"; blueprint: unknown; validatorRefs: Record<string, unknown> };
  addresses: Record<string, { bech32: string; hex: string }>;
};
const { preloadedScript, addresses } = await post<Applied>("/blueprints/apply-params", {
  blueprint,
  params: { [baseHash]: [MESSAGE_HEX] },
});
const [scriptHash, address] = Object.entries(addresses)[0];
console.log("parametrised hash", scriptHash, "address", address.bech32);

// 2. Lock. The datum JSON is serialised with the validator's `spend` datum schema (`shape`).
//    `owner` is the key hash the unlock transaction must be signed by (extra_signatories).
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  outputs: [
    {
      address: address.bech32,
      lovelace: 2_000_000,
      datum: {
        type: "inline",
        value: { owner: wallet.key_hash },
        shape: { validatorHash: scriptHash, purpose: "spend" },
      },
    },
  ],
  preloadedScripts: [preloadedScript],
});
const txHash = await signAndSubmit(built.complete, wallet.skey);

// 3. Hand spend-from-validator.ts what it needs. Output 0 is the locked output: outputs keep request order.
const lock = {
  scriptHash,
  outputRef: { txHash, index: 0 },
  messageHex: MESSAGE_HEX,
  preloadedScript,
};
writeFileSync("lock.json", JSON.stringify(lock, null, 2));
console.log("wrote lock.json");
