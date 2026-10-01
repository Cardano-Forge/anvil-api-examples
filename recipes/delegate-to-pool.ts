// delegate-to-pool.ts — delegate the wallet's stake to a pool (registering the stake key if needed).
// node delegate-to-pool.ts
// Needs a wallet with a stake key (create-wallet.ts writes one); the stake key must sign.
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
if (!wallet.stake_skey)
  throw new Error("wallet.json has no stake_skey — create it with create-wallet.ts");
// Pool id as bech32 or 56 hex; it must be registered on preprod (a mainnet pool id is rejected on
// submit). The default is GRADA, a preprod pool.
const POOL_ID = process.env.POOL_ID ?? "pool1nmfr5j5rnqndprtazre802glpc3h865sy50mxdny65kfgf3e5eh";

// `address` must be a BASE address (its stake part is what gets delegated); `keyHash` is the pool id.
// When the stake account reports neither a pool nor a DRep, Anvil puts a stake-key registration
// certificate first (it pays the 2 ADA key deposit). "pool" is a legacy alias for "stakeDelegation".
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  delegations: [
    { type: "stakeDelegation", address: wallet.base_address_preprod, keyHash: POOL_ID },
  ],
});
console.log("built", built.hash);

// Two witnesses: the payment key (inputs) and the stake key (certificate).
await signAndSubmit(built.complete, wallet.skey, wallet.stake_skey);
