/**
 * CIP-68 Treasury Pays Example
 *
 * This script demonstrates how to mint CIP-68 tokens (a reference token and a user token)
 * where the transaction fees are paid from a designated treasury wallet.
 *
 * This involves:
 * 1. Loading customer, treasury, policy, and metadata manager wallets.
 * 2. Creating a time-locked native script signed by the policy wallet.
 * 3. Defining the asset metadata for both the reference (label 100) and user (label 222) tokens.
 * 4. Fetching UTXOs from the treasury wallet to cover transaction fees.
 * 5. Building the transaction payload with the mint operation and preloaded native script.
 * 6. Signing the transaction with both the treasury and metadata manager private keys.
 * 7. Submitting the transaction to the Anvil API.
 *
 * Required environment variables: BLOCKFROST_PROJECT_ID, ANVIL_API_KEY
 * Prerequisite: deno run --allow-all --env-file=.env cip68-treasury-pays.ts
 */

import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import {
  timeToSlot,
  getKeyhash,
  createNativeScript,
} from "../utils/shared.ts";
import { API_URL, HEADERS } from "../utils/constant.ts";
import { getUtxos } from "../fetch-utxos-from-the-backend/utxos/blockfrost.ts";

// 1. Load wallets
const customerWallet = JSON.parse(Deno.readTextFileSync("wallet-customer.json"));
const treasuryWallet = JSON.parse(Deno.readTextFileSync("wallet-treasury.json"));
const policyWallet = JSON.parse(Deno.readTextFileSync("wallet-policy.json"));
const metaManagerWallet = JSON.parse(Deno.readTextFileSync("wallet-meta-manager.json"));

// 2. Create native script (expires 2026-01-01, signed by policy wallet)
const counter = new Date().getTime();
const slot = await timeToSlot(new Date("2026-01-01"));
const keyhash = await getKeyhash(policyWallet.base_address_preprod);

if (!keyhash) {
  throw new Error("Unable to get key hash for policy wallet.");
}
const nativeScript = await createNativeScript(keyhash, slot);

// 3. Define assets to be minted
const assets = [
  {
    // Reference Token (label 100) -> sent to Metadata Manager Address
    version: "cip68",
    assetName: { name: `anvilapicip68_${counter}`, format: "utf8", label: 100 },
    metadata: {
      name: `anvil-api-${counter}`,
      image: "ipfs://QmQZJ1J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J",
      mediaType: "image/png",
      description: "Anvil API CIP-68 Treasury Pays Example",
    },
    policyId: nativeScript.hash,
    quantity: 1,
    destAddress: metaManagerWallet.base_address_preprod,
  },
  {
    // User Token (label 222) -> sent to Customer Address
    version: "cip68",
    assetName: { name: `anvilapicip68_${counter}`, format: "utf8", label: 222 },
    policyId: nativeScript.hash,
    quantity: 1,
    destAddress: customerWallet.base_address_preprod,
  },
];

// 4. Get UTXOs from the treasury wallet
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

// 5. Build the transaction payload
const buildBody = {
  changeAddress: treasuryWallet.base_address_preprod,
  utxos,
  mint: assets,
  preloadedScripts: [nativeScript],
};

console.log("Build Body: ", buildBody);

// 6. Build the transaction
const buildResponse = await fetch(`${API_URL}/transactions/build`, {
  method: "POST",
  body: JSON.stringify(buildBody),
  headers: HEADERS,
});

if (!buildResponse.ok) {
  throw new Error(`Failed to build transaction: ${await buildResponse.text()}`);
}
const buildJson = await buildResponse.json();
console.log("Build Output:", buildJson);

// 7. Sign the transaction
const transaction = FixedTransaction.from_bytes(Buffer.from(buildJson.complete, "hex"));

// Sign with Treasury wallet (pays for the transaction)
transaction.sign_and_add_vkey_signature(PrivateKey.from_bech32(treasuryWallet.skey));

// Sign with Metadata Manager wallet (controls the reference token)
transaction.sign_and_add_vkey_signature(PrivateKey.from_bech32(policyWallet.skey));

// 8. Submit the transaction
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
Sample Output

Found 3 UTXOs in treasury wallet.
Build Body:  {
  changeAddress: "addr_test1qpxpar5s94wv6n76jvmvkr8uhnrflge6fatjzlkuujw3m33mk0alnas44ptzrkqqp3kdhplmcwys5mlht5w6seefrtls2r748e",
  utxos: [
    "82825820cbdd371aca5fef27267d5a41d9af6c6d9c9ba46b16aa5501f6fae91d3415a1f700825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff1a05f5e100",
    "82825820f3c3344a570042a0ad5753bd6af8a6ff360dbc41ea35c77f6502da89427efc9c00825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff1a01312d00",
    "828258203bbfdc451b2d12a3388146113b9411da603c205a835579a6e1397e696e04f0df02825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff821a0979d543a3581c38fdf893232baf9703e2f051ff9083a2756063c8bce3d80eb8d5eb3fa148000de1407465737401581c5e3817eacf8b6c393307fa61b00d546678e24414380dc7a2d879bc78a148000de1407465737401581cf8e024681ee83f54bd5f9a033464168f619970289017a9f53454d950a148000de1407465737401"
  ],
  mint: [
    {
      version: "cip68",
      assetName: {
        name: "anvilapicip68_1752704257434",
        format: "utf8",
        label: 100
      },
      metadata: {
        name: "anvil-api-1752704257434",
        image: "ipfs://QmQZJ1J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J3J",
        mediaType: "image/png",
        description: "Anvil API CIP-68 Treasury Pays Example"
      },
      policyId: "4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfb",
      quantity: 1,
      destAddress: "addr_test1qz7jcka6zwj0tz52rl73te7y7avl2ckzmkfguwl42h728jeqzph40hhsxq32p2t4r3qcnhsrk9nnq5m2yv04dhuf3hfsuqphqk"
    },
    {
      version: "cip68",
      assetName: {
        name: "anvilapicip68_1752704257434",
        format: "utf8",
        label: 222
      },
      policyId: "4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfb",
      quantity: 1,
      destAddress: "addr_test1qqwadht4defe0cqem6a56ytwz96g4y7j7z0a02y5aj8c4unm5k2xfvhpn4kukwhsfakq22dy94yf9y8nt9dddzpkmuys4r5q8h"
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
  hash: "6689bd7030901e036490e510d95f6535c7717345fe8a5541c3f6efe5efa5d65c",
  complete: "84a700d90102818258203bbfdc451b2d12a3388146113b9411da603c205a835579a6e1397e696e04f0df02018483583900bd2c5bba13a4f58a8a1ffd15e7c4f759f562c2dd928e3bf555fca3cb20106f57def03022a0a9751c4189de03b16730536a231f56df898dd3821a00157084a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581f000643b0616e76696c61706963697036385f3137353237303432353734333401582080cbf5aab266792d95a836241f88b8a9e4e4e58f897884343f01dcbf57529f8f825839001dd6dd756e5397e019debb4d116e11748a93d2f09fd7a894ec8f8af27ba59464b2e19d6dcb3af04f6c0529a42d489290f3595ad68836df09821a00133418a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581f000de140616e76696c61706963697036385f313735323730343235373433340182583900e4c0e5e76be5cf9ea49b889cb6e54baed815859c35b2d9fe84b04b222435fcd97a6b0717fbd3658537d3dfd3360267449dcd2cd4de5928e01a0020ce70825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff821a092ce9faa3581c38fdf893232baf9703e2f051ff9083a2756063c8bce3d80eb8d5eb3fa148000de1407465737401581c5e3817eacf8b6c393307fa61b00d546678e24414380dc7a2d879bc78a148000de1407465737401581cf8e024681ee83f54bd5f9a033464168f619970289017a9f53454d950a148000de1407465737401021a0003783d031a05c88894081a05c86c7409a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba2581f000643b0616e76696c61706963697036385f3137353237303432353734333401581f000de140616e76696c61706963697036385f31373532373034323537343334010b58204587ac46d0a5802afe974301ec122e228c20b19fbd15ba26eaf9c1770d687d0da201d90102818201828200581c3910f0db63599cd9cb1484d5591491629470761a89cde0473e4b94f682051a06a6008004d901029fd8799fa4446e616d6557616e76696c2d6170692d3137353237303432353734333445696d6167655830697066733a2f2f516d515a4a314a334a334a334a334a334a334a334a334a334a334a334a334a334a334a334a334a334a496d656469615479706549696d6167652f706e674b6465736372697074696f6e5826416e76696c20415049204349502d36382054726561737572792050617973204578616d706c6501fffff5f6",
  stripped: "84a700d90102818258203bbfdc451b2d12a3388146113b9411da603c205a835579a6e1397e696e04f0df02018483583900bd2c5bba13a4f58a8a1ffd15e7c4f759f562c2dd928e3bf555fca3cb20106f57def03022a0a9751c4189de03b16730536a231f56df898dd3821a00157084a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581f000643b0616e76696c61706963697036385f3137353237303432353734333401582080cbf5aab266792d95a836241f88b8a9e4e4e58f897884343f01dcbf57529f8f825839001dd6dd756e5397e019debb4d116e11748a93d2f09fd7a894ec8f8af27ba59464b2e19d6dcb3af04f6c0529a42d489290f3595ad68836df09821a00133418a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581f000de140616e76696c61706963697036385f313735323730343235373433340182583900e4c0e5e76be5cf9ea49b889cb6e54baed815859c35b2d9fe84b04b222435fcd97a6b0717fbd3658537d3dfd3360267449dcd2cd4de5928e01a0020ce70825839004c1e8e902d5ccd4fda9336cb0cfcbcc69fa33a4f57217edce49d1dc63bb3fbf9f615a85621d8000c6cdb87fbc3890a6ff75d1da867291aff821a092ce9faa3581c38fdf893232baf9703e2f051ff9083a2756063c8bce3d80eb8d5eb3fa148000de1407465737401581c5e3817eacf8b6c393307fa61b00d546678e24414380dc7a2d879bc78a148000de1407465737401581cf8e024681ee83f54bd5f9a033464168f619970289017a9f53454d950a148000de1407465737401021a0003783d031a05c88894081a05c86c7409a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba2581f000643b0616e76696c61706963697036385f3137353237303432353734333401581f000de140616e76696c61706963697036385f31373532373034323537343334010b58204587ac46d0a5802afe974301ec122e228c20b19fbd15ba26eaf9c1770d687d0da0f5f6",
  witnessSet: "a201d90102818201828200581c3910f0db63599cd9cb1484d5591491629470761a89cde0473e4b94f682051a06a6008004d901029fd8799fa4446e616d6557616e76696c2d6170692d3137353237303432353734333445696d6167655830697066733a2f2f516d515a4a314a334a334a334a334a334a334a334a334a334a334a334a334a334a334a334a334a334a496d656469615479706549696d6167652f706e674b6465736372697074696f6e5826416e76696c20415049204349502d36382054726561737572792050617973204578616d706c6501ffff"
}
Submitted Transaction: {
  "txHash": "6689bd7030901e036490e510d95f6535c7717345fe8a5541c3f6efe5efa5d65c"
}
*/ 