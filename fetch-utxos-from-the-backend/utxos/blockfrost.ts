import { Buffer } from "node:buffer";
import {
  TransactionUnspentOutput,
  TransactionInput,
  TransactionOutput,
  TransactionHash,
  TransactionUnspentOutputs,
  MultiAsset,
  Value,
  Assets,
  AssetName,
  BigNum,
  ScriptHash,
  Address,
} from "@emurgo/cardano-serialization-lib-nodejs";

export function hex_to_uint8(input: string): Uint8Array {
  return new Uint8Array(Buffer.from(input, "hex"));
}
export function assets_to_value(
  multi_asset: MultiAsset,
  assets: Asset[],
): Value {
  const qt = assets.find((asset) => asset.unit === "lovelace")?.quantity;
  if (!qt) {
    throw new Error("No lovelace found in the provided utxo");
  }

  const assets_to_add: Record<string, Assets> = {};

  for (const asset of assets) {
    if (asset.unit !== "lovelace") {
      const policy_hex = asset.unit.slice(0, 56);
      const asset_hex = hex_to_uint8(asset.unit.slice(56));

      if (!assets_to_add[policy_hex]) {
        assets_to_add[policy_hex] = Assets.new();
      }

      assets_to_add[policy_hex].insert(
        AssetName.new(asset_hex),
        BigNum.from_str(asset.quantity),
      );
    }
  }

  for (const key of Object.keys(assets_to_add)) {
    multi_asset.insert(ScriptHash.from_hex(key), assets_to_add[key]);
  }

  return Value.new_with_assets(BigNum.from_str(qt), multi_asset);
}

export type Asset = {
  unit: string;
  quantity: string;
};
export type Utxo = {
  address: string;
  tx_hash: string;
  output_index: number;
  amount: Asset[];
  block?: string;
  data_hash?: string | null;
  inline_datum?: string | null;
  reference_script_hash?: string | null;
};
export async function get_utxos_api(
  blockfrost_base_url: string,
  blockfrost_api_key: string,
  address: string,
): Promise<Utxo[]> {
  const get = async (data: object[] = [], page = 1) => {
    const res = await fetch(
      `${blockfrost_base_url}/addresses/${address}/utxos?page=${page}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          project_id: blockfrost_api_key,
        },
      },
    );

    if (res.status < 199 || res.status > 200) {
      throw new Error("Unable to get utxos for specified address");
    }

    const json = await res.json();
    if (json.length > 0) {
      return await get([...data, ...json], page + 1);
    }

    return [...data, ...json];
  };

  return await get();
}

console.time("blockfrost");
const utxos = await get_utxos_api(
  "https://cardano-mainnet.blockfrost.io/api/v0",
  Deno.env.get("BLOCKFROST_PROJECT_ID"),
  "addr1q96gmvs93t96txjv43sw5gtf6pfzwmsu07t635pmlvwsucup2645cqyrknctcsd3s4e6wc23fxqsr3mywdlx9lnme6sshlyndu",
);
console.timeEnd("blockfrost");
console.log("UTXOs Found:", utxos.length);

const parsedUtxo: TransactionUnspentOutputs = TransactionUnspentOutputs.new();

console.time("build_utxo_blockfrost");
for (const utxo of utxos) {
  const multi_assets = MultiAsset.new();
  const { tx_hash, output_index, amount, address } = utxo as Utxo;

  // If we have enough utxos, we can proceed.
  parsedUtxo.add(
    TransactionUnspentOutput.new(
      TransactionInput.new(TransactionHash.from_hex(tx_hash), output_index),
      TransactionOutput.new(
        Address.from_bech32(address),
        assets_to_value(multi_assets, amount),
      ),
    ),
  );
}
console.timeEnd("build_utxo_blockfrost");

// console.log("Parsed UTXO", parsedUtxo.to_json());

Deno.exit(0);
