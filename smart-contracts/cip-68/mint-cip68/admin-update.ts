import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
 
import customer from "./wallet-customer.json" with { type: "json" };
import adminWallet from "./wallet-mint-sc-policy.json" with { type: "json" };
import { API_URL, HEADERS } from "../../../utils/constant.ts";

const CUSTOMER_ADDRESS = customer.base_address_preprod;
const META_MANAGER_KEY_HASH = adminWallet.key_hash;
const assetName = "test";

// Transaction details for the reference token to spend
// This is the transaction hash from either the original mint or the latest admin update transaction.
// This is usually stored in Web2 database to be referenced later when updating metadata.
// Or you can use the 222 user token name (since they match) to query the blockchain and get the txhash and output index. 
const TX_HASH = "d330e666c15e2f19e54b49aff64e69aa134d25242b7dadd95d6aba570a7c1861";
const TX_OUTPUT_INDEX = "0";

// Load the blueprint to get script information
// Generated from Aiken upon successful smart contract build.
import blueprint from "../aiken-mint-cip-68/plutus.json" with { type: "json" };

// Apply parameters to get the parameterized script
console.log("🔄 Applying parameters to blueprint...");
const blueprintValidatorHash = blueprint.validators[0].hash;
const applyParamsResponse = await fetch(
  `${API_URL}/blueprints/apply-params`,
  {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      params: { [blueprintValidatorHash]: [META_MANAGER_KEY_HASH] },
      blueprint: blueprint
    }),
  },
);

if (!applyParamsResponse.ok) {
  console.error("❌ Failed to apply parameters:", applyParamsResponse.status, applyParamsResponse.statusText);
  const errorText = await applyParamsResponse.text();
  console.error("Error details:", errorText);
  Deno.exit(1);
}

const applyParamsResult = await applyParamsResponse.json();
console.log("✅ Parameters applied successfully");

// Extract the parameterized script and address
const parameterizedScript = applyParamsResult.preloadedScript;
const newHashes = Object.keys(applyParamsResult.addresses);
const SCRIPT_HASH = newHashes[0];
const SC_ADDRESS = applyParamsResult.addresses[SCRIPT_HASH].bech32;

console.log("Parameterized script hash:", SCRIPT_HASH);
console.log("Script address:", SC_ADDRESS);
const input: {
  changeAddress: string;
  message: string;
  scriptInteractions: object[];
  outputs: {
    address: string;
    assets: object[];
    datum: { type: "inline"; value: object; shape: object };
  }[];
  requiredSigners: string[];
  preloadedScripts: Array<object>;
} = {
  changeAddress: CUSTOMER_ADDRESS,
  message: "CIP-68 Admin Update Example",
  // Script Interactions - Define how to interact with the smart contract during transaction execution
  scriptInteractions: [
    {
      // Purpose: "spend" tells Cardano this is spending a UTXO locked at a smart contract address
      purpose: "spend",
      
      // Hash: The parameterized script hash of our CIP-68 validator
      hash: SCRIPT_HASH,
      
      // OutputRef: Specifies exactly which UTXO we want to spend (the reference token)
      outputRef: {
        txHash: TX_HASH,        // Transaction hash containing the reference token UTXO
        index: TX_OUTPUT_INDEX, // Output index within that transaction (usually 0)
      },
      
      // Redeemer: The data passed to the smart contract's spend validator for authorization
      redeemer: {
        type: "json",
        value: {
          // output_index: Tells the validator which transaction output contains the updated reference token
          output_index: 0,
          
          // update: "AdminUpdate" triggers admin authorization path in the smart contract
          // This makes the validator check that the transaction is signed by the admin key
          // (as opposed to "UserUpdate" which would require fee payment)
          update: "AdminUpdate"
        },
      },
    },
  ],
  outputs: [
    {
      // Send the updated reference token back to the smart contract address with the new metadata
      address: SC_ADDRESS,
      assets: [
        {
          assetName: {name: assetName, label: 100, format: "utf8"},
          policyId: SCRIPT_HASH,
          quantity: 1,
        },
      ],
      // Details how and where the datum is stored to be used later.
      datum: {
        type: "inline",
        shape: {
          validatorHash: SCRIPT_HASH,
          purpose: "spend", // Marked as spend purpose so the spend validator can update the metadata later.
        },
        value: {
          // Updated CIP-68 Metadata goes here. Follows official CIP-68 spec metadata format. (metadata, version, datum)
          metadata: [
            ["name", "test"],
            ["nickname", "datum_updated"] // Updated nickname to show the admin update
          ],
          version: 1
        }
      },
    },
  ],
  // Admin must sign to pass smart contract validation
  requiredSigners: [META_MANAGER_KEY_HASH],
  preloadedScripts: [parameterizedScript]
};

const contractDeployed = await fetch(`${API_URL}/transactions/build`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify(input),
});

const transaction = await contractDeployed.json();
if (!contractDeployed.ok || !transaction.complete) {
    console.error("❌ Transaction build failed:", transaction);
    Deno.exit(1);
}

console.log("API Response:", JSON.stringify(transaction, null, 2));
console.log("✅ Transaction built successfully");

// Sign the transaction using CSL.
const txToSubmitOnChain = FixedTransaction.from_bytes(Buffer.from(transaction.complete, "hex"));
txToSubmitOnChain.sign_and_add_vkey_signature(PrivateKey.from_bech32(customer.skey));
txToSubmitOnChain.sign_and_add_vkey_signature(PrivateKey.from_bech32(adminWallet.skey));

// Submit the transaction to the blockchain.
const urlSubmit = `${API_URL}/transactions/submit`;
const submitted = await fetch(urlSubmit, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({transaction: txToSubmitOnChain.to_hex()}),
});

const output = await submitted.json();
if (!submitted.ok) {
  console.error("❌ Transaction submission failed:", output);
  Deno.exit(1);
}

console.debug(output);

console.log("✅ Admin update transaction submitted successfully");

/**
 * Admin Update Transaction Example Output:
 * 
 * 🔄 Applying parameters to blueprint...
 * ✅ Parameters applied successfully
 * Parameterized script hash: 5da506b0b8d9c7d9df247c7684aead8eb6fdac1cbfb2dd7cc33d6499
 * Script address: addr_test1wpw62p4shrvu0kwly378dp9w4k8tdldvrjlm9htucv7kfxggmdaj6
 * API Response: {
 *   "hash": "d330e666c15e2f19e54b49aff64e69aa134d25242b7dadd95d6aba570a7c1861",
 *   "complete": "84ab00d9010283825820579cad3f5e6f031ade3179ebbd15655d4ebbd00b91f23fe0b...",
 *   "stripped": "84ab00d9010283825820579cad3f5e6f031ade3179ebbd15655d4ebbd00b91f23fe0b...",
 *   "witnessSet": "a207d9010281590b9d590b9a010100332323232323232232253330043232323232323",
 *   "auxiliaryData": "a11902a2a1636d7367816d4369703638206578616d706c65"
 * }
 * ✅ Transaction built successfully
 * 
 * {
 *   txHash: "d330e666c15e2f19e54b49aff64e69aa134d25242b7dadd95d6aba570a7c1861"
 * }
 * ✅ Admin update transaction submitted successfully
 */