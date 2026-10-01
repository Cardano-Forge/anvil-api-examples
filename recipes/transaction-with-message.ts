// transaction-with-message.ts — attach a CIP-20 message (metadata label 674) to a payment.
// node transaction-with-message.ts
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const RECEIVER = process.env.RECEIVER ?? wallet.enterprise_address_preprod;

// `message` is a string (split into 64-character pieces when longer) or an array of strings
// (stored verbatim — each element must fit in 64 bytes). Both land at { 674: { msg: [...] } }.
// Pieces are counted in characters but the limit is 64 bytes: keep message text ASCII.
// Any other label goes through `meta`, e.g. meta: [{ label: 1234, data: { hello: "world" } }].
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  outputs: [{ address: RECEIVER, lovelace: 2_000_000 }],
  message: ["Invoice 42", "Paid with the Anvil API"],
});
console.log("built", built.hash, "auxiliaryData present:", Boolean(built.auxiliaryData));

// Read the metadata back from the built transaction before signing.
type Parsed = { auxiliaryData?: { metadata?: Record<string, unknown> } };
const parsed = await post<Parsed>("/transactions/parse", { transaction: built.complete });
console.log("label 674:", JSON.stringify(parsed.auxiliaryData?.metadata?.["674"]));

await signAndSubmit(built.complete, wallet.skey);
