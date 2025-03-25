import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";

import blueprint from "./aiken-hello-world/plutus.json" with { type: "json" }; // NOTE: You only need the hash.
import customer from "./customer.json" with { type: "json" };

import { API_URL, HEADERS } from "../../utils/constant.ts";

// Save the hash in your database or backend.
// You are gonna need this hash everytime you need to interact with the smart contract.
// In this example we are loading it from the blueprint, but you do not need the blueprint.
const hash = blueprint.validators[0].hash;

async function getScriptAddr(hash: string): Promise<string> {
  const response = await fetch(`${API_URL}/validators/${hash}/address`, {
    method: "GET",
    headers: HEADERS,
  });

  const scriptAddress = await response.json();
  console.debug("scriptAddress", scriptAddress);
  return scriptAddress.hex as string;
}

// Send 2 ADA to the Smart Contract (Lock ADA)
const input = {
  changeAddress: customer.base_address_preprod,
  message: "Locking my fortune using anvil API",
  outputs: [
    {
      address: await getScriptAddr(hash), // script address of the first validator
      lovelace: 2_000_000, // 1 ADA = 1_000_000 Lovelace
      datum: {
        type: "inline",
        value: {
          owner: customer.key_hash, // Only the Customer will be able to unlock the funds
        },
        shape: {
          validatorHash: hash,
          purpose: "spend",
        },
      },
    },
  ],
};

const response = await fetch(`${API_URL}/transactions/build`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify(input),
});

const result = await response.json();
console.log("result", result);
const txToSign = result.complete;

// Sign transaction directly in the backend
const txToSubmitOnChain = FixedTransaction.from_bytes(
  Buffer.from(txToSign, "hex"),
);
// This sign the tx and add vkeys to the txToSubmitOnChain, so in submit we don't need to provide signatures
txToSubmitOnChain.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(customer.skey),
);

const urlSubmit = `${API_URL}/transactions/submit`;
const submitted = await fetch(urlSubmit, {
  method: "POST",
  body: JSON.stringify({
    signatures: [],
    transaction: txToSubmitOnChain.to_hex(),
  }),
  headers: HEADERS,
});

const submittedResponse = await submitted.json();
console.debug("submittedResponse", submittedResponse);

console.log("-".repeat(50));
console.log("IMPORTANT: This is the txHash to use in the step #3");
console.log(submittedResponse);
console.log("-".repeat(50));
