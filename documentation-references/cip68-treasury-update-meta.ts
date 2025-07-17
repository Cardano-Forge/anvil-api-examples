/**
 * CIP-68 Metadata Update with Treasury-Paid Fees Example
 *
 * This script demonstrates how to update the metadata of a CIP-68 asset (specifically the reference token)
 * where the transaction fees are paid from a designated treasury wallet.
 *
 * This involves:
 * 1. Loading treasury, policy, and metadata manager wallets.
 * 2. Defining the target asset and policy details.
 * 3. Fetching UTXOs from the treasury wallet to cover transaction fees.
 * 4. Building a transaction payload to update the CIP-68 metadata.
 * 5. Building the transaction via the Anvil API.
 * 6. Signing the transaction with both the metadata manager's key (as required by the reference token's datum)
 *    and the treasury wallet's key (to authorize fee payment).
 * 7. Submitting the fully signed transaction to the blockchain.
 *
 * Required files: wallet-treasury.json, wallet-policy.json, wallet-meta-manager.json
 * Required environment variables: BLOCKFROST_PROJECT_ID, ANVIL_API_KEY
 * Prerequisite: deno run --allow-all --env-file=.env cip68-treasury-update-meta.ts
 */

import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import {
  createNativeScript,
  dateToSlot,
  getKeyhash,
} from "../utils/shared.ts";
import { API_URL, HEADERS } from "../utils/constant.ts";
import { getUtxos } from "../fetch-utxos-from-the-backend/utxos/blockfrost.ts";

// 1. Load wallets
const treasuryWallet = JSON.parse(Deno.readTextFileSync("wallet-treasury.json"));
const policyWallet = JSON.parse(Deno.readTextFileSync("wallet-policy.json"));
const metaManagerWallet = JSON.parse(Deno.readTextFileSync("wallet-meta-manager.json"));

// 2. Define Asset and Policy Details
// This is the hex-encoded asset name (policyID + assetName) of the CIP-68 token pair.
// The API will automatically find the reference (100) token to update.
const assetName = "000643b0616e76696c61706963697036385f31373532373032393939373838";

// The native script is needed to be pre-loaded for the API to validate the transaction.
// In a real-world scenario, you might just have the policy ID if it's already on-chain.
const expirationDate = "2026-01-01";
const slot = await dateToSlot(new Date(expirationDate));
const keyhash = await getKeyhash(policyWallet.base_address_preprod);
if (!keyhash) {
  throw new Error("Unable to get key hash for policy wallet.");
}
const nativeScript = await createNativeScript(keyhash, slot);

// 3. Fetch Treasury UTXOs
const BLOCKFROST_PROJECT_ID = Deno.env.get("BLOCKFROST_PROJECT_ID");
if (!BLOCKFROST_PROJECT_ID) {
  throw new Error("Missing BLOCKFROST_PROJECT_ID env var");
}
const utxos = await getUtxos(
  "https://cardano-preprod.blockfrost.io/api/v0",
  BLOCKFROST_PROJECT_ID,
  treasuryWallet.base_address_preprod,
);
console.log(`Found ${utxos.length} UTXOs in treasury wallet.`);

// 4. Build the transaction payload
const buildBody = {
  changeAddress: treasuryWallet.base_address_preprod,
  utxos,
  cip68MetadataUpdates: [
    {
      policyId: nativeScript.hash,
      assetName: assetName,
      metadata: {
        name: "New Updated Name",
        description: "This is the updated description for the CIP-68 asset.",
        image: "ipfs://new-image-hash-goes-here",
      },
      action: "update",
    },
  ],
  preloadedScripts: [
    {
      type: "simple",
      script: nativeScript.script,
      hash: nativeScript.hash,
    },
  ],
};

console.log("Build Body: ", buildBody);

// 5. Build the transaction
const buildResponse = await fetch(`${API_URL}/transactions/build`, {
  method: "POST",
  body: JSON.stringify(buildBody),
  headers: HEADERS,
});
const buildJson = await buildResponse.json();

if (!buildResponse.ok) {
  console.error("Build failed. Response:", buildJson);
  throw new Error(`Failed to build transaction: ${buildResponse.statusText}`);
}
console.log("Build Output:", buildJson);

// 6. Sign the transaction
const transaction = FixedTransaction.from_bytes(
  Buffer.from(buildJson.complete, "hex"),
);

// Sign with MetaManager wallet (required by the datum on the reference token)
transaction.sign_and_add_vkey_signature(PrivateKey.from_bech32(metaManagerWallet.skey));

// Sign with Treasury wallet (to authorize spending the UTXO for fees)
transaction.sign_and_add_vkey_signature(PrivateKey.from_bech32(treasuryWallet.skey));

// 7. Submit the transaction
const submitResponse = await fetch(`${API_URL}/transactions/submit`, {
  method: "POST",
  body: JSON.stringify({
    transaction: transaction.to_hex(),
  }),
  headers: HEADERS,
});
const submitJson = await submitResponse.json();

if (!submitResponse.ok) {
  console.error("Submission failed. Response:", submitJson);
  throw new Error(`Failed to submit transaction: ${submitResponse.statusText}`);
}

console.log("Submitted Transaction:", JSON.stringify(submitJson, null, 2));

/*
Sample Output: 

Found 3 UTXOs in treasury wallet.
Build Body:  {
  changeAddress: "addr_test1qpxpar5s94wv6n76jvmvkr8uhnrflge6fatjzlkuujw3m33mk0alnas44ptzrkqqp3kdhplmcwys5mlht5w6seefrtls2r748e",
  utxos: [
    "82825820cbdd371aca5fef27267d5a41d9af6c6d9c9ba46b16aa5501f6fae91d3415a1f700825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff1a05f5e100",
    "82825820f3c3344a570042a0ad5753bd6af8a6ff360dbc41ea35c77f6502da89427efc9c00825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff1a01312d00",
    "82825820d6aefd369f3bf1c17398c43a7608d197cba623f7fa60831f77865a9c76ecd56602825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff821a097f845ca3581c38fdf893232baf9703e2f051ff9083a2756063c8bce3d80eb8d5eb3fa148000de1407465737401581c5e3817eacf8b6c393307fa61b00d546678e24414380dc7a2d879bc78a148000de1407465737401581cf8e024681ee83f54bd5f9a033464168f619970289017a9f53454d950a148000de1407465737401"
  ],
  cip68MetadataUpdates: [
    {
      policyId: "4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfb",
      assetName: "000643b0616e76696c61706963697036385f31373532373032393939373838",
      metadata: {
        name: "New Updated Name",
        description: "This is the updated description for the CIP-68 asset.",
        image: "ipfs://new-image-hash-goes-here"
      },
      action: "update"
    }
  ],
  preloadedScripts: [
    {
      type: "simple",
      script: { type: "all", scripts: [ [Object], [Object] ] },
      hash: "4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfb"
    }
  ]
}
Build Output: {
  hash: "3bbfdc451b2d12a3388146113b9411da603c205a835579a6e1397e696e04f0df",
  complete: "84a700d90102838258209d13e6fdec8ddae0b7e94e27100feb67d30ab13b7f284f8c672f662018e16ff101825820d6aefd369f3bf1c17398c43a7608d197cba623f7fa60831f77865a9c76ecd56600825820d6aefd369f3bf1c17398c43a7608d197cba623f7fa60831f77865a9c76ecd56602018383583900bd2c5bba13a4f58a8a1ffd15e7c4f759f562c2dd928e3bf555fca3cb20106f57def03022a0a9751c4189de03b16730536a231f56df898dd3821a00157084a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581f000643b0616e76696c61706963697036385f31373532373032393939373838015820a68af340c4deadbc6dfadf635d8e8145d2d5dcdedb06ae4b27a218d0b5823ef8a300581d60ea2cb2c69f72fc8e3c31f836de3d6877267bbdc50311c3e8eecf099c011a00186a00028201d8184a49616e76696c2d746167825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff821a0979d543a3581c38fdf893232baf9703e2f051ff9083a2756063c8bce3d80eb8d5eb3fa148000de1407465737401581c5e3817eacf8b6c393307fa61b00d546678e24414380dc7a2d879bc78a148000de1407465737401581cf8e024681ee83f54bd5f9a033464168f619970289017a9f53454d950a148000de1407465737401021a00036529031a05c887fd081a05c86bdd0b5820ff3e6f8c66bcd5a36e6ad36d70bc96873d98e0684e0f1cae68023aa5c20a18e70ed9010281581cea2cb2c69f72fc8e3c31f836de3d6877267bbdc50311c3e8eecf099ca200d90102818258208bc6baaa47db83c0a0d957d559e4b443a9f7a5757ab3c184cf8c2b2ee21bb69558404800f8b668617063b0ecd1cee7760b205d2071ea97b5726c9ec89bcf90db00e2e2b4b8560aa2aae47eab657839e99fe997f17c4703d2ab2da4d778fe0659d40f04d901029fd8799fa3446e616d65504e65772055706461746564204e616d654b6465736372697074696f6e583554686973206973207468652075706461746564206465736372697074696f6e20666f7220746865204349502d36382061737365742e45696d616765581f697066733a2f2f6e65772d696d6167652d686173682d676f65732d6865726501fffff5f6",
  stripped: "84a700d90102838258209d13e6fdec8ddae0b7e94e27100feb67d30ab13b7f284f8c672f662018e16ff101825820d6aefd369f3bf1c17398c43a7608d197cba623f7fa60831f77865a9c76ecd56600825820d6aefd369f3bf1c17398c43a7608d197cba623f7fa60831f77865a9c76ecd56602018383583900bd2c5bba13a4f58a8a1ffd15e7c4f759f562c2dd928e3bf555fca3cb20106f57def03022a0a9751c4189de03b16730536a231f56df898dd3821a00157084a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581f000643b0616e76696c61706963697036385f31373532373032393939373838015820a68af340c4deadbc6dfadf635d8e8145d2d5dcdedb06ae4b27a218d0b5823ef8a300581d60ea2cb2c69f72fc8e3c31f836de3d6877267bbdc50311c3e8eecf099c011a00186a00028201d8184a49616e76696c2d746167825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff821a0979d543a3581c38fdf893232baf9703e2f051ff9083a2756063c8bce3d80eb8d5eb3fa148000de1407465737401581c5e3817eacf8b6c393307fa61b00d546678e24414380dc7a2d879bc78a148000de1407465737401581cf8e024681ee83f54bd5f9a033464168f619970289017a9f53454d950a148000de1407465737401021a00036529031a05c887fd081a05c86bdd0b5820ff3e6f8c66bcd5a36e6ad36d70bc96873d98e0684e0f1cae68023aa5c20a18e70ed9010281581cea2cb2c69f72fc8e3c31f836de3d6877267bbdc50311c3e8eecf099ca0f5f6",
  witnessSet: "a200d90102818258208bc6baaa47db83c0a0d957d559e4b443a9f7a5757ab3c184cf8c2b2ee21bb69558404800f8b668617063b0ecd1cee7760b205d2071ea97b5726c9ec89bcf90db00e2e2b4b8560aa2aae47eab657839e99fe997f17c4703d2ab2da4d778fe0659d40f04d901029fd8799fa3446e616d65504e65772055706461746564204e616d654b6465736372697074696f6e583554686973206973207468652075706461746564206465736372697074696f6e20666f7220746865204349502d36382061737365742e45696d616765581f697066733a2f2f6e65772d696d6167652d686173682d676f65732d6865726501ffff"
}
Submitted Transaction: {
  "txHash": "3bbfdc451b2d12a3388146113b9411da603c205a835579a6e1397e696e04f0df"
}
*/
