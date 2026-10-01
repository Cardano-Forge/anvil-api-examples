// marketplace-list-and-buy.ts — seller lists an NFT on the Wayup contract, buyer purchases it.
// node marketplace-list-and-buy.ts
// Two funded preprod wallets: wallet.json (seller, holds the asset) and wallet-buyer.json
// (ANVIL_WALLET_BUYER overrides that path).
// The marketplace service has no submit endpoint: sign each returned transaction and send it to
// POST /transactions/submit, strictly in order.
import { DRY_RUN, get, loadWallet, post, signAndSubmit } from "./_lib.ts";

const seller = loadWallet();
const buyer = loadWallet(process.env.ANVIL_WALLET_BUYER ?? "wallet-buyer.json");
const POLICY_ID = process.env.POLICY_ID ?? "<policy_id>";
const ASSET_NAME_HEX = process.env.ASSET_NAME_HEX ?? "<asset_name_hex>";
const PRICE_ADA = 5; // min 5, max 10,000,000, ≤ 6 decimals

type MarketBuild = { transactions: string[]; distribution: Record<string, number[]>[] };
type Listing = { outputRef: string; price: number; script: { type: string } };
const toOutputRef = (ref: string) => ({
  txHash: ref.split("#")[0],
  index: Number(ref.split("#")[1]),
});

// 1. List. `create.assets` is an array (more than one asset = bundle). Always the V2 dialect.
const listed = await post<MarketBuild>("/marketplace/transactions/build", {
  changeAddress: seller.base_address_preprod,
  create: [{ assets: [{ policyId: POLICY_ID, assetName: ASSET_NAME_HEX }], priceAda: PRICE_ADA }],
});
for (const tx of listed.transactions) await signAndSubmit(tx, seller.skey);
if (DRY_RUN) {
  console.log("DRY_RUN — the listing was never submitted; stopping before the indexer poll");
  process.exit(0);
}

// 2. Wait for the indexer to see the listing (empty 200 body = not listed yet).
let listing: Listing | undefined;
for (let i = 0; i < 24 && !listing; i++) {
  listing = await get<Listing | undefined>(
    `/marketplace/collections/${POLICY_ID}/assets/${ASSET_NAME_HEX}/listing`,
  );
  if (!listing) await new Promise((r) => setTimeout(r, 5_000));
}
if (!listing) throw new Error("Listing not indexed after 2 minutes");
console.log(
  `listed at ${listing.price / 1_000_000} ADA (${listing.script.type}), ${listing.outputRef}`,
);

// 3. Buy at the listing price; the builder pays seller, royalty and service fee out of it.
const bought = await post<MarketBuild>("/marketplace/transactions/build", {
  changeAddress: buyer.base_address_preprod,
  buy: [{ outputRef: toOutputRef(listing.outputRef) }],
});
console.log("buy transactions:", bought.transactions.length, JSON.stringify(bought.distribution));
for (const tx of bought.transactions) await signAndSubmit(tx, buyer.skey);
