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
const assetName = `cip68_${new Date().getTime()}`;

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
  mint: Array<object>;
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
  message: "Cip68 example",
  mint: [
    {
      // Reference token -> This is the token that will be spent to update metadata
      version: "cip68",
      assetName: {name:assetName, label:100, format:"utf8"}, 
      policyId: SCRIPT_HASH,
      type: "plutus",
      quantity: 1,
    },
    {
      // User token -> This is the token that will be sent to the user
      version: "cip68",
      assetName: {name:assetName,label:222, format:"utf8"}, 
      policyId: SCRIPT_HASH,
      type: "plutus",
      quantity: 1,
    },
  ],
  // Script Interactions - Define how to interact with the smart contract during transaction execution
  scriptInteractions: [
    {
      // Purpose: "mint" tells Cardano this is minting new tokens using a smart contract policy
      purpose: "mint",
      
      // Hash: The parameterized script hash of our CIP-68 minting policy
      hash: SCRIPT_HASH,
      
      // Redeemer: The data passed to the smart contract's mint validator for authorization
      redeemer: {
        type: "json",
        value: {
          // assetnames: Array of [asset_name_hex, quantity] pairs to be minted
          // The mint validator uses this to verify we're minting the correct CIP-68 token pair:
          // - Reference token (label 100) and User token (label 222) with the specified asset name
          // - The validator ensures both tokens are minted together as required by CIP-68
          assetnames: [[Buffer.from(assetName).toString("hex"), 0]]
        },
      },
    },
  ],
  outputs: [
    {
      // OUTPUT 0: Override Mint Array's 'reference token' (Label 100) output   
      // to modify the datum as spendable in case of a metadata update.
      // This will be sent to the smart contract address.
      address: SC_ADDRESS,
      assets: [
        {
          assetName: {name:assetName,label:100, format:"utf8"},
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
          // CIP-68 Metadata goes here. Follows official CIP-68 spec metadata format. (metadata, version, datum)
          metadata: [
            ["name", assetName],
            ["nickname", "nickname"]
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

console.log("✅ Transaction submitted successfully");

/**
🔄 Applying parameters to blueprint...
✅ Parameters applied successfully
Parameterized script hash: 5da506b0b8d9c7d9df247c7684aead8eb6fdac1cbfb2dd7cc33d6499
Script address: addr_test1wpw62p4shrvu0kwly378dp9w4k8tdldvrjlm9htucv7kfxggmdaj6
API Response: {
  "hash": "74dcb95427b9eee36137803617a900460b5d58ed266598ebf4146d659b613520",
  "complete": "84ac00d9010281825820980764a5f2108825aed12a73e68625fc5e1ab4a510c01b8de7b...",
  "stripped": "84ac00d9010281825820980764a5f2108825aed12a73e68625fc5e1ab4a510c01b8de7b...",
  "witnessSet": "a207d9010281590b9d590b9a010100332323232323232232253330043232323232323",
  "auxiliaryData": "a11902a2a1636d7367816d4369703638206578616d706c65"
}
✅ Transaction built successfully

{
  txHash: "74dcb95427b9eee36137803617a900460b5d58ed266598ebf4146d659b613520"
}
✅ Transaction submitted successfully
 */