// create-wallet.ts — write a preprod test wallet (payment key + stake key) to wallet.json.
// node create-wallet.ts [file]
//
// The file holds the signing keys in clear text: use it for preprod test funds only. For a wallet
// with a seed phrase you can import in a browser wallet, use the Wallet CLI with --mnemonic
// (github.com/Cardano-Forge/cardano-wallet-cli); it writes the same fields.
import { existsSync, writeFileSync } from "node:fs";
import {
  BaseAddress,
  Credential,
  EnterpriseAddress,
  PrivateKey,
  RewardAddress,
} from "@emurgo/cardano-serialization-lib-nodejs";

const file = process.argv[2] ?? "wallet.json";
if (existsSync(file)) throw new Error(`${file} exists — refusing to overwrite a wallet`);

const TESTNET = 0; // network id of preprod and preview; mainnet is 1
const payment = PrivateKey.generate_ed25519();
const stake = PrivateKey.generate_ed25519();
const paymentHash = payment.to_public().hash();
const stakeHash = stake.to_public().hash();
const paymentCredential = Credential.from_keyhash(paymentHash);
const stakeCredential = Credential.from_keyhash(stakeHash);

const wallet = {
  base_address_preprod: BaseAddress.new(TESTNET, paymentCredential, stakeCredential)
    .to_address()
    .to_bech32(),
  enterprise_address_preprod: EnterpriseAddress.new(TESTNET, paymentCredential)
    .to_address()
    .to_bech32(),
  reward_address_preprod: RewardAddress.new(TESTNET, stakeCredential).to_address().to_bech32(),
  key_hash: paymentHash.to_hex(),
  skey: payment.to_bech32(),
  stake_key_hash: stakeHash.to_hex(),
  stake_skey: stake.to_bech32(),
};
writeFileSync(file, `${JSON.stringify(wallet, null, 2)}\n`, { mode: 0o600 });
console.log(`wrote ${file}`);
console.log(`fund this address with preprod test ADA: ${wallet.base_address_preprod}`);
