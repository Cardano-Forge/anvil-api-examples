// send-ada.ts — pay ADA from the wallet to one address.
// node send-ada.ts
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet(); // wallet.json (create-wallet.ts), funded on preprod
const RECEIVER = process.env.RECEIVER ?? wallet.enterprise_address_preprod; // any bech32 address
const LOVELACE = 5_000_000; // 5 ADA (1 ADA = 1,000,000 lovelace); every output is at least 1 ADA

// 1. Build. `utxos` omitted: Anvil funds the transaction from the first 100 UTXOs of changeAddress.
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  outputs: [{ address: RECEIVER, lovelace: LOVELACE }],
});
console.log("built", built.hash);

// 2 + 3. Sign with the payment key, submit. The returned txHash equals built.hash.
await signAndSubmit(built.complete, wallet.skey);
