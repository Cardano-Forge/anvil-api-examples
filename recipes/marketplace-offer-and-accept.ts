// marketplace-offer-and-accept.ts — buyer makes an ADA offer on an NFT; the owner accepts it.
// node marketplace-offer-and-accept.ts
// Two funded preprod wallets: wallet.json (owner, holds the asset) and wallet-buyer.json
// (ANVIL_WALLET_BUYER overrides that path).
import { DRY_RUN, get, loadWallet, post, signAndSubmit } from "./_lib.ts";

const owner = loadWallet();
const buyer = loadWallet(process.env.ANVIL_WALLET_BUYER ?? "wallet-buyer.json");
const POLICY_ID = process.env.POLICY_ID ?? "<policy_id>";
const ASSET_NAME_HEX = process.env.ASSET_NAME_HEX ?? "<asset_name_hex>";
const OFFER_ADA = 5; // min 5 — this ADA leaves the buyer's wallet until accepted or withdrawn

type MarketBuild = { transactions: string[]; distribution: Record<string, number[]>[] };
type Offer = { outputRef: string; price: number };
const toOutputRef = (ref: string) => ({
  txHash: ref.split("#")[0],
  index: Number(ref.split("#")[1]),
});

// 1. Offer. `changeAddress` must be a BASE address (the offer is keyed by its stake credential).
const offered = await post<MarketBuild>("/marketplace/transactions/build", {
  changeAddress: buyer.base_address_preprod,
  createOffer: [{ policyId: POLICY_ID, assetName: ASSET_NAME_HEX, priceAda: OFFER_ADA }],
});
for (const tx of offered.transactions) await signAndSubmit(tx, buyer.skey);
if (DRY_RUN) {
  console.log("DRY_RUN — the offer was never submitted; stopping before the indexer poll");
  process.exit(0);
}

// 2. The owner sees the top offer once indexed (empty 200 body = no offer yet).
let top: Offer | undefined;
for (let i = 0; i < 24 && !top; i++) {
  top = await get<Offer | undefined>(
    `/marketplace/collections/${POLICY_ID}/assets/${ASSET_NAME_HEX}/offer`,
  );
  if (!top) await new Promise((r) => setTimeout(r, 5_000));
}
if (!top) throw new Error("Offer not indexed after 2 minutes");
console.log(`top offer ${top.price / 1_000_000} ADA at ${top.outputRef}`);

// 3. Accept. Spends the offer contract, so at most 2 such actions per transaction. If the asset is
//    listed, add `unlist: [{ outputRef: <listing> }]` to the same build; unlist also needs the
//    owner's stake key signature.
const accepted = await post<MarketBuild>("/marketplace/transactions/build", {
  changeAddress: owner.base_address_preprod,
  acceptOffer: [{ outputRef: toOutputRef(top.outputRef) }],
});
for (const tx of accepted.transactions) await signAndSubmit(tx, owner.skey);
