import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";

// Import wallet files and constants using standardized structure
import customer from "./wallet-customer.json" with { type: "json" };
import adminWallet from "./wallet-mint-sc-policy.json" with { type: "json" };
import { API_URL, HEADERS } from "../../../utils/constant.ts";
import { getUtxos, findUserTokenUTXO, findReferenceTokenUTXO } from "../../../fetch-utxos-from-the-backend/utxos/blockfrost.ts";

const CUSTOMER_ADDRESS = customer.base_address_preprod;
const ADMIN_KEY_HASH = adminWallet.key_hash;
const ADMIN_ADDRESS = adminWallet.base_address_preprod;
const assetName = "cip68_1753999309623";
const nickname = "customer_updated";

// Import Blockfrost utility for dynamic UTXO fetching

const BLOCKFROST_BASE_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const BLOCKFROST_API_KEY = Deno.env.get("BLOCKFROST_PROJECT_ID");

if (!BLOCKFROST_API_KEY) {
  console.error("❌ BLOCKFROST_PROJECT_ID environment variable is required");
  console.error("Set environment variable:");
  console.error("  PowerShell/Windows: $env:BLOCKFROST_PROJECT_ID='your_api_key'");
  console.error("  Bash/macOS/Linux: export BLOCKFROST_PROJECT_ID='your_api_key'");
  console.error("  Command Prompt: set BLOCKFROST_PROJECT_ID=your_api_key");
  Deno.exit(1);
}

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
      params: { [blueprintValidatorHash]: [ADMIN_KEY_HASH] },
      blueprint: blueprint
    }),
  },
);

if (!applyParamsResponse.ok) {
  console.error("❌ Failed to apply parameters to blueprint:", await applyParamsResponse.text());
  Deno.exit(1);
}

const applyParamsResult = await applyParamsResponse.json();
console.log("✅ Parameters applied successfully");

// Extract the parameterized script and address
const parameterizedScript = applyParamsResult.preloadedScript;
const newHashes = Object.keys(applyParamsResult.addresses);
const POLICY_ID = newHashes[0];
const SC_ADDRESS = applyParamsResult.addresses[POLICY_ID].bech32;

console.log("Parameterized script hash:", POLICY_ID);
console.log("Script address:", SC_ADDRESS);

// Find reference token UTXO from script address
const referenceTokenUTXO = await findReferenceTokenUTXO(
  BLOCKFROST_BASE_URL,
  BLOCKFROST_API_KEY,
  POLICY_ID,
  assetName,
  SC_ADDRESS
);

// Find user token UTXO from customer address using the reliable findUserTokenUTXO function
const userTokenUTXO = await findUserTokenUTXO(
  BLOCKFROST_BASE_URL,
  BLOCKFROST_API_KEY,
  POLICY_ID,
  assetName,
  CUSTOMER_ADDRESS
);

// Also get the UTXO in string format for requiredInputs (this is what works with the API)
const utxos = await getUtxos(BLOCKFROST_BASE_URL, BLOCKFROST_API_KEY, CUSTOMER_ADDRESS);
const utxoString = `000de140${Buffer.from(assetName).toString("hex")}`;
const userUtxo = utxos.find((utxo) => utxo.includes(utxoString));

if (!userUtxo) {
  console.error("❌ User token UTXO not found at customer address");
  Deno.exit(1);
}

console.log(`Reference token: ${referenceTokenUTXO.transaction_id}#${referenceTokenUTXO.output_index}`);
console.log(`User token: ${userTokenUTXO.transaction_id}#${userTokenUTXO.output_index}`);
console.log(`User token UTXO string: ${userUtxo}`);

// Build transaction input using the base example structure
const input: {
  changeAddress: string;
  message: string;
  mint?: Array<object>;
  scriptInteractions: object[];
  outputs: {
    address: string;
    lovelace?: string;
    assets?: object[];
    datum?: { type: "inline"; value: object; shape: object };
  }[];
  requiredSigners: string[];
  preloadedScripts: object[];
  requiredInputs: string[];
  referenceInputs: { txHash: string; index: string }[];
} = {
  changeAddress: CUSTOMER_ADDRESS,
  message: "CIP-68 Customer Update Example",
  
  // SCRIPT INTERACTIONS: Tell the validator how to spend the reference token UTXO
  scriptInteractions: [
    {
      purpose: "spend", // We're spending a UTXO from the script address
      hash: POLICY_ID, // The validator script hash
      
      // REFERENCE TOKEN UTXO: The UTXO containing the reference token to be spent
      outputRef: {
        txHash: referenceTokenUTXO.transaction_id,
        index: referenceTokenUTXO.output_index,
      },
      
      // REDEEMER: Data passed to the validator to authorize the spend
      redeemer: {
        type: "json",
        value: {
          output_index: 0, // Index of the output containing the updated reference token
          update: {
            // USER UPDATE: Validator checks UserUpdate branch
            nickname: Buffer.from(nickname).toString("hex"), // New nickname in hex
            fee_output_index: 1, // Index of output paying the 1 ADA fee to admin
            
            // USER TOKEN REFERENCE: Validator uses this to find user token in inputs
            // Corresponds to find_input(self.inputs, output_ref_user_token) in validator
            output_ref_user_token: {
              transaction_id: userTokenUTXO.transaction_id,
              output_index: userTokenUTXO.output_index,
            },
          },
        },
      },
    },
  ],
  
  // TRANSACTION OUTPUTS: What the transaction creates
  outputs: [
    {
      // OUTPUT 0: Updated reference token back to script address
      // Validator checks: output at output_index (0) contains updated metadata
      address: SC_ADDRESS,
      assets: [
        {
          assetName: { name: assetName, label: 100, format: "utf8" }, // Reference token (label 100)
          policyId: POLICY_ID,
          quantity: 1,
        },
      ],
      // UPDATED DATUM: Contains the new metadata with updated nickname
      datum: {
        type: "inline",
        shape: {
          validatorHash: POLICY_ID,
          purpose: "spend",
        },
        value: {
          metadata: [
            ["name", assetName], // According to the contract. This must be the same asset name as minted. 
            ["nickname", "customer_updated"], // This is what gets updated
          ],
          version: 1,
        },
      },
    },
    {
      // OUTPUT 1: 1 ADA fee payment to admin
      // Validator checks: fee_output at fee_output_index (1) pays exactly 1 ADA to admin
      address: ADMIN_ADDRESS,
      lovelace: "1000000", // 1 ADA fee - validator verifies this amount
    },
  ],

  requiredSigners: [],
  referenceInputs: [],
  requiredInputs: [userUtxo!],
  preloadedScripts: [parameterizedScript],
};

const contractDeployed = await fetch(`${API_URL}/transactions/build`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify(input),
});

if (!contractDeployed.ok) {
  const errorText = await contractDeployed.text();
  console.error("❌ Transaction build failed:", errorText);
  Deno.exit(1);
}

const transaction = await contractDeployed.json();
console.log("✅ Transaction built successfully");

// Sign the transaction using CSL.
const txToSubmitOnChain = FixedTransaction.from_bytes(Buffer.from(transaction.complete, "hex"));
txToSubmitOnChain.sign_and_add_vkey_signature(PrivateKey.from_bech32(customer.skey));

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

console.log("✅ Customer update transaction submitted successfully");

/*
🔄 Applying parameters to blueprint...
✅ Parameters applied successfully
Parameterized script hash: 4983663c2b236161ad8e26c36dff9aee709a6adef53be2...
Script address: addr_test1wpycxe3u9v3kzcdd3cnvxm0lnth8pxn2mm6nhch9f6pagxq...
Reference token found: 1750a1c191646ade084c911fd9fd8a7c6b8372923e2305c4f4...
User token UTXO: 828258201750a1c191646ade084c911fd9fd8a7c6b8372923e2305c4...
✅ Transaction built successfully
{
  txHash: "b2cb92868e58238edb5646775847fca911c46c4d2206bb66b64c4df0af06187b"
}
✅ Customer update transaction submitted successfully
*/