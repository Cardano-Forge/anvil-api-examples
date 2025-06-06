import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import { parseArgs } from "jsr:@std/cli/parse-args";

import {
  createPolicyScript,
  dateToSlot,
  getKeyhash,
  getPolicyId,
} from "../utils/shared.ts";
import { API_URL, HEADERS } from "../utils/constant.ts";

const args: {
  _: [];
  expireDate: string;
  customerWalletPath: string;
  policyWalletPath: string;
  metadataTemplatePath: string;
  counter: number;
  submit: boolean;
} = parseArgs(Deno.args);
// deno run -A mint-cli-cip25.ts \
//  --expireDate=2026-01-01 \
//  --customerWalletPath=customer.json \
//  --policyWalletPath=policy.json \
//  --metadataTemplatePath=metatemplate.json \
//  --counter=20250117 \
//  --submit

// NOTE: Be sure to send ADA in this address, it will be used to pay the tx fee.
const customerWallet = JSON.parse(
  Deno.readTextFileSync(args.customerWalletPath),
);
const policyWallet = JSON.parse(Deno.readTextFileSync(args.policyWalletPath));

// Date before you can interact with the policy
const slot = await dateToSlot(new Date(args.expireDate));
const keyhash = getKeyhash(policyWallet.base_address_preprod);
if (!keyhash) {
  throw new Error("Unable to get key hash for policy, missing or invalid skey");
}
const policyAnvilApi = createPolicyScript(keyhash, slot);

//
// CUSTOM FOR EACH MINT COLLECTION
//
// not the best way to handle this, a config file would be better
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
  Deno.readTextFileSync(args.metadataTemplatePath),
);
const counter = args.counter;

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
const transactionToSignWithPolicyKeyResponse = await fetch(urlTX, {
  method: "POST",
  body: JSON.stringify(data),
  headers: HEADERS,
});

const transactionToSignWithPolicyKey =
  await transactionToSignWithPolicyKeyResponse.json();
console.log(transactionToSignWithPolicyKey);

console.debug(
  "transactionToSignWithPolicyKey: ",
  transactionToSignWithPolicyKey,
);

//
// policy signature
//
const transactionToSignWithCustomerKey = FixedTransaction.from_bytes(
  Buffer.from(transactionToSignWithPolicyKey.complete, "hex"),
);
transactionToSignWithCustomerKey.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(policyWallet.skey),
);

console.debug(
  "transactionToSignWithCustomerKey: ",
  transactionToSignWithCustomerKey.to_hex(),
);

//
// customer signature
//
const txToSubmitOnChain = FixedTransaction.from_bytes(
  Buffer.from(transactionToSignWithCustomerKey.to_hex(), "hex"),
);
console.debug("Customer Wallet", customerWallet);
// This sign the tx and add vkeys to the txToSubmitOnChain, so in submit we don't need to provide signautres
txToSubmitOnChain.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(customerWallet.skey),
);

console.debug("txToSubmitOnChain: ", txToSubmitOnChain.to_hex());
console.debug(
  "txToSubmitOnChain JSON: ",
  txToSubmitOnChain.witness_set().to_json(),
);

//
// Submit tx
//
if (args.submit) {
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
  console.log(submitted);
} else {
  console.log(txToSubmitOnChain.to_hex());
}
