/**
 * CIP-68 NFT Minting Example
 *
 * This script demonstrates how to mint a CIP-68 Non-Fungible Token (NFT), which includes both a reference token (label 100)
 * and a user-facing token (label 222). It handles the entire process from wallet loading to transaction submission.
 *
 * This involves:
 * 1. Loading customer, policy, and metadata manager wallets.
 * 2. Creating a time-locked native script signed by the policy wallet.
 * 3. Defining the asset metadata for both the reference and user tokens according to the CIP-68 standard.
 * 4. Building the transaction payload with the minting details.
 * 5. Building the transaction via the Anvil API.
 * 6. Signing the transaction with the customer, policy, and metadata manager private keys.
 * 7. Submitting the fully signed transaction to the blockchain.
 *
 * Prerequisites:
 * - `wallet-customer.json`: A funded wallet file to pay for the transaction.
 * - `wallet-policy.json`: A wallet file to act as the policy key.
 * - `wallet-meta-manager.json`: A wallet to manage metadata updates (its key is in the reference token datum).
 * - `ANVIL_API_KEY`: An environment variable for Anvil API authentication.
 *
 * Execution:
 * `deno run --allow-all --env-file=.env cip68.ts`
 */

import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import {
  dateToSlot,
  getKeyhash,
  createNativeScript,
} from "../utils/shared.ts";
import { API_URL, HEADERS } from "../utils/constant.ts";

// 1. Load wallets
const customerWallet = JSON.parse(Deno.readTextFileSync("wallet-customer.json"));
const policyWallet = JSON.parse(Deno.readTextFileSync("wallet-policy.json"));
const metaManagerWallet = JSON.parse(Deno.readTextFileSync("wallet-meta-manager.json"));

// 2. Create native script (expires 2026-01-01 signed by policy wallet)
const slot = await dateToSlot(new Date("2026-01-01"));

// 2.1. Get keyhash of policy wallet
const keyhash = await getKeyhash(policyWallet.base_address_preprod);
if (!keyhash) {
  throw new Error("Unable to get key hash for policy, missing or invalid skey");
}

// 2.2. Create native script
const nativeScript = await createNativeScript(keyhash, slot);

// 3. Prepare mint payload
const counter = new Date().getTime();
const assets: {
  version: string;
  assetName: { name: string; format: "utf8" | "hex"; label: 100 | 222 };
  metadata?: {
    name: string;
    image: string | string[];
    mediaType: string;
    description: string;
  };
  policyId: string;
  quantity: 1;
  destAddress?: string;
}[] = [];

// Mint 2 assets (Reference Token & User Token)
assets.push(
  {
    // Reference Token - Label 100 -> Metadata Manager Address
    version: "cip68",
    assetName: { name: `anvilapicip68_${counter}`, format: "utf8", label: 100 },
    metadata: {
      name: `anvil-api-${counter}`,
      image: [
        "https://ada-anvil.s3.ca-central-1.amazonaws.com/",
        "logo_pres_V2_3.png",
      ],
      mediaType: "image/png",
      description: "Testing CIP-68 using anvil API",
    },
    policyId: nativeScript.hash,
    quantity: 1,
    destAddress: metaManagerWallet.base_address_preprod,
  },
  {
    // User Token - Label 222 -> Customer Address
    version: "cip68",
    assetName: { name: `anvilapicip68_${counter}`, format: "utf8", label: 222 },
    policyId: nativeScript.hash,
    quantity: 1,
    destAddress: customerWallet.base_address_preprod,
  },
);

// 4. Build transaction via Anvil API
const buildBody = {
  changeAddress: customerWallet.base_address_preprod,
  mint: assets,
  preloadedScripts: [nativeScript],
};

console.log("Build Body: ", buildBody);

const buildResult = await fetch(`${API_URL}/transactions/build`, {
  method: "POST",
  body: JSON.stringify(buildBody),
  headers: HEADERS,
});
const buildJson = await buildResult.json();

console.log("Build Output: ", buildJson);

if (!buildResult.ok) {
  throw new Error(buildJson.message ?? `Unable to build tx`);
}

// 5. Sign transaction
const tx = FixedTransaction.from_bytes(
  Buffer.from(buildJson.complete, "hex"),
);
tx.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(policyWallet.skey),
);
tx.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(customerWallet.skey),
);

// 6. Submit transaction
const submitResult = await fetch(`${API_URL}/transactions/submit`, {
  method: "POST",
  body: JSON.stringify({
    signatures: [],
    transaction: tx.to_hex(),
  }),
  headers: HEADERS,
});

const submitJson = await submitResult.json();
if (!submitResult.ok) throw new Error(submitJson.message ?? "Unable to submit tx");

console.log("Submitted Transaction Hash: ", submitJson.txId ?? submitJson);

/*
Build Body:  {
  changeAddress: "addr_test1qqwadht4defe0cqem6a56ytwz96g4y7j7z0a02y5aj8c4unm5k2xfvhpn4kukwhsfakq22dy94yf9y8nt9dddzpkmuys4r5q8h",
  mint: [
    {
      version: "cip68",
      assetName: {
        name: "anvilapicip68_1752701331052",
        format: "utf8",
        label: 100
      },
      metadata: {
        name: "anvil-api-1752701331052",
        image: [
          "https://ada-anvil.s3.ca-central-1.amazonaws.com/",
          "logo_pres_V2_3.png"
        ],
        mediaType: "image/png",
        description: "Testing CIP-68 using anvil API"
      },
      policyId: "4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfb",
      quantity: 1,
      destAddress: "addr_test1qz7jcka6zwj0tz52rl73te7y7avl2ckzmkfguwl42h728jeqzph40hhsxq32p2t4r3qcnhsrk9nnq5m2yv04dhuf3hfsuqphqk"
    },
    {
      version: "cip68",
      assetName: {
        name: "anvilapicip68_1752701331052",
        format: "utf8",
        label: 222
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
  hash: "758bb17313d91d0960ac3629b9830da99ec74b8f49225901e190ad361c6a1091",
  complete: "84a700d901028182582072be679ccc4cadce0109beeda0dd182b8439204f252db7b4acbffd2f568f53a801018383583900bd2c5bba13a4f58a8a1ffd15e7c4f759f562c2dd928e3bf555fca3cb20106f57def03022a0a9751c4189de03b16730536a231f56df898dd3821a00157084a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581f000643b0616e76696c61706963697036385f31373532373031333331303532015820809f3e00c6702e74a9ec87763e2c9a7334754f6a20583f9268affcc5bc81c82c82583900e4c0e5e76be5cf9ea49b889cb6e54baed815859c35b2d9fe84b04b222435fcd97a6b0717fbd3658537d3dfd3360267449dcd2cd4de5928e01a0020ce70825839001dd6dd756e5397e019debb4d116e11748a93d2f09fd7a894ec8f8af27ba59464b2e19d6dcb3af04f6c0529a42d489290f3595ad68836df09821ac815ef6ea2581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba2581b616e76696c61706963697032355f3137353237303032373635353201581f000de140616e76696c61706963697036385f3137353237303133333130353201581c5db632e917cab856ac7dd4ce76b3ef928b82d1d63037f4fbd1cb88c4a1581b616e76696c61706963697032355f3137343532373438333532343501021a00036975031a05c87d06081a05c860e609a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba2581f000643b0616e76696c61706963697036385f3137353237303133333130353201581f000de140616e76696c61706963697036385f31373532373031333331303532010b58206bb381d54ea424e4c4d6e48f7403378bf9751e3a650ed086bbccd01af3bb81f8a201d90102818201828200581c3910f0db63599cd9cb1484d5591491629470761a89cde0473e4b94f682051a06a6008004d901029fd8799fa4446e616d6557616e76696c2d6170692d3137353237303133333130353245696d6167659f583068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f526c6f676f5f707265735f56325f332e706e67ff496d656469615479706549696d6167652f706e674b6465736372697074696f6e581e54657374696e67204349502d3638207573696e6720616e76696c2041504901fffff5f6",
  stripped: "84a700d901028182582072be679ccc4cadce0109beeda0dd182b8439204f252db7b4acbffd2f568f53a801018383583900bd2c5bba13a4f58a8a1ffd15e7c4f759f562c2dd928e3bf555fca3cb20106f57def03022a0a9751c4189de03b16730536a231f56df898dd3821a00157084a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba1581f000643b0616e76696c61706963697036385f31373532373031333331303532015820809f3e00c6702e74a9ec87763e2c9a7334754f6a20583f9268affcc5bc81c82c82583900e4c0e5e76be5cf9ea49b889cb6e54baed815859c35b2d9fe84b04b222435fcd97a6b0717fbd3658537d3dfd3360267449dcd2cd4de5928e01a0020ce70825839001dd6dd756e5397e019debb4d116e11748a93d2f09fd7a894ec8f8af27ba59464b2e19d6dcb3af04f6c0529a42d489290f3595ad68836df09821ac815ef6ea2581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba2581b616e76696c61706963697032355f3137353237303032373635353201581f000de140616e76696c61706963697036385f3137353237303133333130353201581c5db632e917cab856ac7dd4ce76b3ef928b82d1d63037f4fbd1cb88c4a1581b616e76696c61706963697032355f3137343532373438333532343501021a00036975031a05c87d06081a05c860e609a1581c4d5bd6249f0d9e4b2762ce334e2973dc7fd414ec1e08b4b0c2159bfba2581f000643b0616e76696c61706963697036385f3137353237303133333130353201581f000de140616e76696c61706963697036385f31373532373031333331303532010b58206bb381d54ea424e4c4d6e48f7403378bf9751e3a650ed086bbccd01af3bb81f8a0f5f6",
  witnessSet: "a201d90102818201828200581c3910f0db63599cd9cb1484d5591491629470761a89cde0473e4b94f682051a06a6008004d901029fd8799fa4446e616d6557616e76696c2d6170692d3137353237303133333130353245696d6167659f583068747470733a2f2f6164612d616e76696c2e73332e63612d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f526c6f676f5f707265735f56325f332e706e67ff496d656469615479706549696d6167652f706e674b6465736372697074696f6e581e54657374696e67204349502d3638207573696e6720616e76696c2041504901ffff"
}
Submitted Transaction Hash:  {
  txHash: "758bb17313d91d0960ac3629b9830da99ec74b8f49225901e190ad361c6a1091"
}
*/
