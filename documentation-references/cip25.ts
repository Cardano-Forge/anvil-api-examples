import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import {
  createPolicyScript,
  dateToSlot,
  getKeyhash,
  getPolicyId,
} from "../utils/shared.ts";
import { API_URL, HEADERS } from "../utils/constant.ts";

//
// Wallets
//
// NOTE: Be sure to send ADA in this address, it will be used to pay the tx fee.
const customerWallet = JSON.parse(Deno.readTextFileSync("customer.json"));
// Wallet to create the policy with, no ADA is required for this one.
const policyWallet = JSON.parse(Deno.readTextFileSync("policy-cip25.json"));

//
// Variables
//
const expirationDate = "2026-01-01";
const counter = new Date().getTime();

//
// Set Policy
//
// Date before you can interact with the policy
const slot = dateToSlot(new Date(expirationDate));
const keyhash = getKeyhash(policyWallet.skey);
if (!keyhash) {
  throw new Error("Unable to get key hash for policy, missing or invalid skey");
}
const policyAnvilApi = createPolicyScript(keyhash, slot);

//
// Custom for each mint collection
//
// Not the best way to handle this, a config file would be better
const policyAnvilApiScript = {
  type: "all",
  scripts: [
    {
      type: "sig",
      keyHash: keyhash.to_hex(),
    },
    {
      type: "before",
      slot: slot,
    },
  ],
};

const assets: {
  version: string;
  assetName: { name: string; format: "utf8" | "hex" };
  metadata: {
    name: string;
    image: string | string[];
    mediaType: string;
    description: string;
    epoch: number;
  };
  policyId: string;
  quantity: 1;
}[] = [];
const assetMetadataTemplate = JSON.parse(
  Deno.readTextFileSync("metatemplate.json"),
);

// Simulate use case
assets.push({
  version: "cip25",
  assetName: { name: `anvilapicip25_${counter}`, format: "utf8" },
  metadata: {
    ...assetMetadataTemplate,
    // Adding custom data just to test the flow
    name: `anvil-api-${counter}`,
    epoch: new Date().getTime(), // dummy data
  },
  policyId: getPolicyId(policyAnvilApi.mint_script),
  quantity: 1,
});

//
// Generic calls to create, sign and submit tx
//
const data = {
  changeAddress: customerWallet.enterprise_address_preprod,
  utxos: [],
  mint: assets,
  preloadedScripts: [
    {
      type: "simple",
      script: policyAnvilApiScript,
      hash: getPolicyId(policyAnvilApi.mint_script),
    },
  ],
};

const urlTX = `${API_URL}/transactions/build`;
const response = await fetch(urlTX, {
  method: "POST",
  body: JSON.stringify(data),
  headers: HEADERS,
});

const transactionToSignWithPolicyKey = await response.json();

if (response.status !== 200) {
  console.error(transactionToSignWithPolicyKey);
  throw new Error("Unable to build tx.");
}

//
// policy signature
//

const transactionToSignWithCustomerKey = FixedTransaction.from_bytes(
  Buffer.from(transactionToSignWithPolicyKey.complete, "hex"),
);
transactionToSignWithCustomerKey.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(policyWallet.skey),
);

//
// customer signature
//
const txToSubmitOnChain = FixedTransaction.from_bytes(
  Buffer.from(transactionToSignWithCustomerKey.to_hex(), "hex"),
);

// This sign the tx and add vkeys to the txToSubmitOnChain, so in submit we don't need to provide signautres
txToSubmitOnChain.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(customerWallet.skey),
);

//
// Submit tx
//
const urlSubmit = `${API_URL}/transactions/submit`;

const submittedResponse = await fetch(urlSubmit, {
  method: "POST",
  body: JSON.stringify({
    signatures: [], // This empty because the txToSubmitOnChain has the vkeys
    transaction: txToSubmitOnChain.to_hex(),
  }),
  headers: HEADERS,
});

const submitted = await submittedResponse.json();

if (submittedResponse.status !== 200) {
  console.error(submitted);
  throw new Error("Unable to submit tx.");
}

console.log(submitted);
