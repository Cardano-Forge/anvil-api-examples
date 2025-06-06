// IMPORTANT
// YOU NEED TO CHANGE THE TX HASH BELOW USING THE ONE RECEIVED AT STEP 1

import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1"; // update utilities doc.

import blueprint from "./aiken-hello-world/plutus.json" with { type: "json" }; // NOTE: You only need the hash.
import customer from "./customer.json" with { type: "json" };
import { API_URL, HEADERS } from "../../utils/constant.ts";

// Save the hash in your database or backend.
// You are gonna need this hash everytime you need to interact with the smart contract.
// In this example we are loading it from the blueprint, but you do not need the blueprint.
const hash = blueprint.validators[0].hash;

const input = {
  changeAddress: customer.base_address_preprod,
  message: "Unlock my fortune using anvil API",
  scriptInteractions: [
    {
      hash,
      purpose: "spend",
      // This Output ref and index is the UTXO locked at the previous step.
      outputRef: {
        txHash:
          "80d231e6a5a5882a7e92dfc418eb91f7f82704d5c75bd55a38776057e1b401d6", // ACTION: Replace with your txHash
        index: 0, // ACTION: Replace with you index (if you follow this example it is 0, it is based on the utxos order in the tx)
      },
      redeemer: {
        // Aka. Smart contract Parameters
        type: "json",
        value: {
          msg: Buffer.from("Hello World", "utf8").toString("hex"), // ACTION: Replace with your String
        },
      },
    },
  ],
  requiredSigners: [customer.stake_key_hash], // Aka. extra_signatories
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
// This sign the tx and add vkeys to the txToSubmitOnChain, so in submit we don't need to provide signature
// // This is an example, in a real application this signature is done on the frontend using the customer wallet.
// Need to sign with the UTXO key (the payment address that pays the fee).
txToSubmitOnChain.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(customer.skey),
);
// Sign with the stake key to satisfies the required Signers condition in the contract
txToSubmitOnChain.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(customer.stake_skey),
);
// NOTE: Both signature are usually provided by the frontend wallet.

const urlSubmit = `${API_URL}/transactions/submit`;
const submitted = await fetch(urlSubmit, {
  method: "POST",
  body: JSON.stringify({
    signatures: [], // no signature required as it is part of the `txToSubmitOnChain`.
    transaction: txToSubmitOnChain.to_hex(),
  }),
  headers: HEADERS,
});

const submittedResponse = await submitted.json();
console.debug("submittedResponse", submittedResponse);
