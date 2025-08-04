/**
 * CIP-25 NFT Minting Example
 *
 * This script demonstrates how to mint a standard CIP-25 Non-Fungible Token (NFT).
 * It handles everything from wallet loading to transaction submission.
 *
 * This involves:
 * 1. Loading a customer wallet (to pay for fees) and a policy wallet (to sign the policy).
 * 2. Creating a time-locked native script that expires in the future.
 * 3. Defining the asset metadata according to the CIP-25 standard.
 * 4. Building the transaction payload with the minting details.
 * 5. Building the transaction via the Anvil API.
 * 6. Signing the transaction with the customer and policy private keys.
 * 7. Submitting the fully signed transaction to the blockchain.
 *
 * Prerequisites:
 * - `wallet-customer.json`: A funded wallet file to pay for the transaction.
 * - `wallet-policy.json`: A wallet file to act as the policy key.
 * - `metatemplate.json`: A file containing the base structure for the CIP-25 metadata.
 * - `ANVIL_API_KEY`: An environment variable for Anvil API authentication.
 *
 * Execution:
 * `deno run --allow-all --env-file=.env cip25.ts`
 */

import { Buffer } from "node:buffer";
import { FixedTransaction, PrivateKey } from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import { createNativeScript, timeToSlot, getKeyhash } from "../utils/shared.ts";
import { API_URL, HEADERS } from "../utils/constant.ts";

// 1. Load wallets
const customerWallet = JSON.parse(Deno.readTextFileSync("wallet-customer.json"));
const policyWallet   = JSON.parse(Deno.readTextFileSync("wallet-policy.json"));

// 2. Create native script (expires 2026-01-01)
const slot = await timeToSlot(new Date("2026-01-01"));

// 2.1. Get keyhash of policy wallet
const keyhash = await getKeyhash(policyWallet.base_address_preprod);

// 2.2. Create native script
const nativeScript = await createNativeScript(keyhash!, slot);

// 3. Prepare mint payload (single NFT, counter based on timestamp for uniqueness)
const counter = Date.now();
const assets = [{
  version: "cip25",
  assetName: { name: `anvilapicip25_${counter}`, format: "utf8" },
  metadata: {
    ...(JSON.parse(Deno.readTextFileSync("metatemplate.json"))),
    name: `anvil-api-${counter}`,
  },
  policyId: nativeScript.hash,
  quantity: 1,
}];

// 4. Build transaction via Anvil API
const buildBody = {
  changeAddress: customerWallet.base_address_preprod,
  mint: assets,
  preloadedScripts: [nativeScript],
};

console.log("Build Body: ", buildBody);

const buildResult = await fetch(`${API_URL}/transactions/build`, 
  { method: "POST",
    headers: HEADERS,
    body: JSON.stringify(buildBody) 
  });
const buildJson = await buildResult.json();

console.log("Build Output: ", buildJson);

if (!buildResult.ok) throw new Error(buildJson.message ?? "Unable to build tx");

// 5. Sign (policy and customer using CSL)
const tx = FixedTransaction.from_bytes(Buffer.from(buildJson.complete, "hex"));
tx.sign_and_add_vkey_signature(PrivateKey.from_bech32(policyWallet.skey));
tx.sign_and_add_vkey_signature(PrivateKey.from_bech32(customerWallet.skey));

// 6. Submit via Anvil API
const submitResult = await fetch(`${API_URL}/transactions/submit`,
  { method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ transaction: tx.to_hex(), signatures: [] })
  });
const submitJson = await submitResult.json();
if (!submitResult.ok) throw new Error(submitJson.message ?? "Unable to submit tx");

console.log("Submitted Transaction Hash: ", submitJson.txId ?? submitJson);

/*
Sample Output

Build Body:  {
  changeAddress: "addr_test1qqwadht4defe0cqem6a56ytwz96g4y7j7z0a02y5aj8c4unm5k2xfvhpn4kukwhsfakq22dy94yf9y8nt9dddzpkmuys4r5q8h",
  mint: [
    {
      version: "cip25",
      assetName: { name: "anvilapicip25_1752700276552", format: "utf8" },
      metadata: {
        name: "anvil-api-1752700276552",
        image: [
          "https://ada-anvil.s3.ca-central-1.amazonaws.com/",
          "logo_pres_V2_3.png"
        ],
        mediaType: "image/png",
        description: "Testing CIP-25 using anvil API",
        epoch: 1752700276552
      },
      policyId: "4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfb",
      quantity: 1
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
Build Output:  {
  hash: "72be679ccc4cadce0109beeda0dd182b8439204f252db7b4acbffd2f568f53a8",
  complete: "84a700d901028182582060e489d03a8c911be2b78ea719d95c6f4df11aeb62ee6d447bb50a042589b31500018282583900e4c0e5e76be5cf9ea49b889cb6e54baed815859c35b2d9fe84b04b222435fcd97a6b0717fbd3658537d3dfd3360267449dcd2cd4de5928e01a00118c30825839001dd6dd756e5397e019debb4d116e11748a93d2f09fd7a894ec8f8af27ba59464b2e19d6dcb3af04f6c0529a42d489290f3595ad68836df09821ac84f97d7a2581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581b616e76696c61706963697032355f3137353237303032373635353201581c5db632e917cab856ac7dd4ce76b3ef928b82d1d63037f4fbd1cb88c4a1581b616e76696c61706963697032355f3137343532373438333532343501021a000350e1031a05c878ca075820f070e276604599b066d5092f28bf85ee76a7c06c6bf7d7898594b47974685403081a05c85caa09a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581b616e76696c61706963697032355f3137353237303032373635353201a101d90102818201828200581c3910f0db63599cd9cb1484d5591491629470761a89cde0473e4b94f682051a06a60080f5a11902d1a178383464356264363234396630643965346232373632636533333465323937336463376664343134656331653038623462306332313539626662a1781b616e76696c61706963697032355f31373532373030323736353532a56b6465736372697074696f6e781e54657374696e67204349502d3235207573696e6720616e76696c204150496565706f63681b000001981513cf4865696d61676582783068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f726c6f676f5f707265735f56325f332e706e67696d656469615479706569696d6167652f706e67646e616d6577616e76696c2d6170692d31373532373030323736353532",
  stripped: "84a700d901028182582060e489d03a8c911be2b78ea719d95c6f4df11aeb62ee6d447bb50a042589b31500018282583900e4c0e5e76be5cf9ea49b889cb6e54baed815859c35b2d9fe84b04b222435fcd97a6b0717fbd3658537d3dfd3360267449dcd2cd4de5928e01a00118c30825839001dd6dd756e5397e019debb4d116e11748a93d2f09fd7a894ec8f8af27ba59464b2e19d6dcb3af04f6c0529a42d489290f3595ad68836df09821ac84f97d7a2581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581b616e76696c61706963697032355f3137353237303032373635353201581c5db632e917cab856ac7dd4ce76b3ef928b82d1d63037f4fbd1cb88c4a1581b616e76696c61706963697032355f3137343532373438333532343501021a000350e1031a05c878ca075820f070e276604599b066d5092f28bf85ee76a7c06c6bf7d7898594b47974685403081a05c85caa09a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581b616e76696c61706963697032355f3137353237303032373635353201a0f5f6",
  witnessSet: "a101d90102818201828200581c3910f0db63599cd9cb1484d5591491629470761a89cde0473e4b94f682051a06a60080",
  auxiliaryData: "a11902d1a178383464356264363234396630643965346232373632636533333465323937336463376664343134656331653038623462306332313539626662a1781b616e76696c61706963697032355f31373532373030323736353532a56b6465736372697074696f6e781e54657374696e67204349502d3235207573696e6720616e76696c204150496565706f63681b000001981513cf4865696d61676582783068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f726c6f676f5f707265735f56325f332e706e67696d656469615479706569696d6167652f706e67646e616d6577616e76696c2d6170692d31373532373030323736353532"
}
Submitted Transaction Hash:  {
  txHash: "72be679ccc4cadce0109beeda0dd182b8439204f252db7b4acbffd2f568f53a8"
}
*/