# Anvil API recipes

The runnable scripts of the [Anvil API documentation](https://dev.ada-anvil.io/recipes): one task per file, from sending ADA to spending from a smart contract. Each script has a page that explains what every API call does and the errors you are likely to hit.

The scripts are plain TypeScript and run as they are, without a build step, on Node.js 22.18 or later, Deno 2 and Bun.

## Set up

You need a testnet API key ([Before you start](https://dev.ada-anvil.io/start/before-you-start)).

```bash
git clone https://github.com/Cardano-Forge/anvil-api-examples
cd anvil-api-examples/recipes
npm install                                   # one dependency: the library that signs
export ANVIL_API_KEY="<your_testnet_key>"
node create-wallet.ts                         # writes wallet.json and prints its address
```

Send preprod test ADA to the printed address from the [Cardano testnet faucet](https://docs.cardano.org/cardano-testnets/tools/faucet), then run any recipe:

```bash
node send-ada.ts
```

| Runtime | Install | Run |
| --- | --- | --- |
| Node.js 22.18+ | `npm install` | `node send-ada.ts` |
| Deno 2 | `deno install` | `deno run --allow-net --allow-read --allow-write --allow-env send-ada.ts` |
| Bun | `bun install` | `bun send-ada.ts` |

`wallet.json` holds its signing keys in clear text and is ignored by git: use it for preprod test funds only. `DRY_RUN=true` signs but never submits.

## Recipes

| Script | What it does | Page |
| --- | --- | --- |
| [`send-ada.ts`](send-ada.ts) | Pay ADA to one address — the minimal build → sign → submit loop. | [Send ADA](https://dev.ada-anvil.io/recipes/transactions/send-ada) |
| [`send-assets.ts`](send-assets.ts) | Transfer a native token after checking the balance; Anvil adds min-ADA. | [Send assets](https://dev.ada-anvil.io/recipes/transactions/send-assets) |
| [`expiring-transaction.ts`](expiring-transaction.ts) | Set `validityInterval.end` and verify the TTL. **Known issue**: numeric bounds are ignored, so the recipe currently fails. | [Expiring transaction](https://dev.ada-anvil.io/recipes/transactions/expiring-transaction) |
| [`transaction-with-message.ts`](transaction-with-message.ts) | Attach a CIP-20 message (label 674) and read it back. | [Transaction with message](https://dev.ada-anvil.io/recipes/transactions/transaction-with-message) |
| [`parse-transaction.ts`](parse-transaction.ts) | Decode built CBOR or an on-chain hash to JSON. Submits nothing. | [Parse transaction](https://dev.ada-anvil.io/recipes/transactions/parse-transaction) |
| [`submit-with-wallet-signature.ts`](submit-with-wallet-signature.ts) | Production flow: server builds and submits, browser signs with CIP-30 `signTx(complete, true)`. | [Submit with a wallet signature](https://dev.ada-anvil.io/recipes/transactions/submit-with-wallet-signature) |
| [`delegate-to-pool.ts`](delegate-to-pool.ts) | `stakeDelegation` certificate, auto stake-key registration, payment + stake key signatures. | [Delegate to a pool](https://dev.ada-anvil.io/recipes/delegation/delegate-to-pool) |
| [`delegate-to-drep.ts`](delegate-to-drep.ts) | `voteDelegation` certificate for a `drep1…` id. | [Delegate to a DRep](https://dev.ada-anvil.io/recipes/delegation/delegate-to-drep) |
| [`withdraw-rewards.ts`](withdraw-rewards.ts) | Withdraw the whole reward balance. **Known issue**: every build with `withdrawals` currently fails. | [Withdraw rewards](https://dev.ada-anvil.io/recipes/delegation/withdraw-rewards) |
| [`create-native-script.ts`](create-native-script.ts) | `all(sig, before)` policy → policy id, saved as `policy.json`. No transaction. | [Create a native script](https://dev.ada-anvil.io/recipes/native-assets/create-native-script) |
| [`mint-cip25.ts`](mint-cip25.ts) | One NFT with label-721 metadata under the native policy. | [Mint CIP-25](https://dev.ada-anvil.io/recipes/native-assets/mint-cip25) |
| [`mint-cip68.ts`](mint-cip68.ts) | Reference token (100, inline datum) + user token (222). | [Mint CIP-68](https://dev.ada-anvil.io/recipes/native-assets/mint-cip68) |
| [`update-cip68-metadata.ts`](update-cip68-metadata.ts) | `cip68MetadataUpdates` on a wallet-held reference token (append). | [Update CIP-68 metadata](https://dev.ada-anvil.io/recipes/native-assets/update-cip68-metadata) |
| [`burn-asset.ts`](burn-asset.ts) | Negative mint quantity under the same policy. | [Burn asset](https://dev.ada-anvil.io/recipes/native-assets/burn-asset) |
| [`upload-blueprint.ts`](upload-blueprint.ts) | Register `plutus.json`, publish reference scripts, record `refs`. | [Upload blueprint](https://dev.ada-anvil.io/recipes/smart-contracts/upload-blueprint) |
| [`apply-params-and-lock.ts`](apply-params-and-lock.ts) | Parameterise a validator inline, lock 2 ADA with a shaped datum; writes `lock.json`. | [Apply params and lock](https://dev.ada-anvil.io/recipes/smart-contracts/apply-params-and-lock) |
| [`spend-from-validator.ts`](spend-from-validator.ts) | `scriptInteractions` spend with a JSON redeemer, evaluation and collateral by Anvil. | [Spend from validator](https://dev.ada-anvil.io/recipes/smart-contracts/spend-from-validator) |
| [`serialize-datum.ts`](serialize-datum.ts) | JSON ↔ Plutus Data hex with a CIP-57 schema. No wallet. | [Serialize datum](https://dev.ada-anvil.io/recipes/smart-contracts/serialize-datum) |
| [`marketplace-list-and-buy.ts`](marketplace-list-and-buy.ts) | Seller `create`s a listing, buyer `buy`s it; two wallets. | [Marketplace: list and buy](https://dev.ada-anvil.io/recipes/marketplace/marketplace-list-and-buy) |
| [`marketplace-offer-and-accept.ts`](marketplace-offer-and-accept.ts) | Buyer `createOffer`, owner `acceptOffer`; two wallets. | [Marketplace: offer and accept](https://dev.ada-anvil.io/recipes/marketplace/marketplace-offer-and-accept) |

Some recipes hand files to later ones (`policy.json`, `cip68.json`, `lock.json`); each page says which recipe to run first.

## Files

- `_lib.ts`: the helper every recipe imports — base URL, the `x-api-key` header from `ANVIL_API_KEY`, `post` / `get`, `loadWallet`, `signAndSubmit`.
- `create-wallet.ts`: writes a preprod test wallet. `node create-wallet.ts wallet-buyer.json` creates the second wallet of the marketplace recipes.
- `package.json`: the one dependency, [`@emurgo/cardano-serialization-lib-nodejs`](https://www.npmjs.com/package/@emurgo/cardano-serialization-lib-nodejs), used to sign.

The scripts are copied here from the sources of the documentation whenever they change, so edits made to them in this repository are overwritten. Found a problem? Open an issue.
