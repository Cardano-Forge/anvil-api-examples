// @blocked: every build with withdrawals fails; this recipe currently fails
// withdraw-rewards.ts — withdraw the whole reward balance of the wallet's stake key.
// node withdraw-rewards.ts
//
// KNOWN ISSUE — every build with `withdrawals` currently fails with
// 422 "… Deserialization failed in Ed25519KeyHash …"; there is no request-side workaround.
// The build call below throws while this stands.
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
if (!wallet.reward_address_preprod || !wallet.stake_skey)
  throw new Error("wallet.json has no stake key — create it with create-wallet.ts");

// `withdrawals` is an array of bech32 REWARD addresses (stake_test1…). Anvil withdraws the whole
// withdrawable balance of each — there is no per-entry amount. The stake key must sign.
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  withdrawals: [wallet.reward_address_preprod],
});
console.log("built", built.hash);

await signAndSubmit(built.complete, wallet.skey, wallet.stake_skey);
