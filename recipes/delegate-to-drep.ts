// delegate-to-drep.ts — delegate the wallet's voting power to a DRep (Conway governance).
// node delegate-to-drep.ts
// Needs a wallet with a stake key (create-wallet.ts writes one); the stake key must sign.
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
if (!wallet.stake_skey)
  throw new Error("wallet.json has no stake_skey — create it with create-wallet.ts");
// drep1… (CIP-105 or CIP-129) or drep_script1… bech32, or DRep CBOR hex: 8200581c<key_hash>,
// 8102 (always abstain), 8103 (always no confidence). A bare 56-hex key hash is rejected.
const DREP_ID = process.env.DREP_ID ?? "drep13d6sxkyz6st9h65qqrzd8ukpywhr8swe9f6357qntgjqye0gttd";

// "drep" is a legacy alias for "voteDelegation". Anvil adds the stake key hash to requiredSigners
// and, if the account reports neither a pool nor a DRep, a stake-key registration certificate.
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  delegations: [{ type: "voteDelegation", address: wallet.base_address_preprod, keyHash: DREP_ID }],
});
console.log("built", built.hash);

await signAndSubmit(built.complete, wallet.skey, wallet.stake_skey);
