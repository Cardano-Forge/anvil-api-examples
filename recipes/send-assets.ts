// send-assets.ts — send a native asset (NFT or fungible token) together with its minimum ADA.
// node send-assets.ts
import { type Built, get, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const RECEIVER = process.env.RECEIVER ?? wallet.enterprise_address_preprod;
const POLICY_ID = process.env.POLICY_ID ?? "<policy_id>"; // 56 hex
const ASSET_NAME_HEX = process.env.ASSET_NAME_HEX ?? "<asset_name_hex>"; // hex, label prefix included
const QUANTITY = 1;

// 1. Check the wallet holds enough. `assetName` is hex; lovelace and quantity are decimal strings.
type Balance = {
  lovelace: string;
  assets: { policyId: string; assetName: string; quantity: string }[];
};
const balance = await get<Balance>(`/wallets/balance/json?address=${wallet.base_address_preprod}`);
const held = balance.assets.find((a) => a.policyId === POLICY_ID && a.assetName === ASSET_NAME_HEX);
if (!held || BigInt(held.quantity) < BigInt(QUANTITY)) {
  throw new Error(`Wallet does not hold ${QUANTITY} of ${POLICY_ID}.${ASSET_NAME_HEX}`);
}

// 2. Build. A bare-string assetName is used as HEX and never validated — do not pass UTF-8 text.
//    `lovelace` is omitted: Anvil raises the output to max(min-ADA for the tokens, 1 ADA).
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  outputs: [
    {
      address: RECEIVER,
      assets: [{ policyId: POLICY_ID, assetName: ASSET_NAME_HEX, quantity: QUANTITY }],
    },
  ],
});
console.log("built", built.hash);

// 3 + 4. Sign and submit.
await signAndSubmit(built.complete, wallet.skey);
