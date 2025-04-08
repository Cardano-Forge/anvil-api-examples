import { CardanoQueryClient } from "@utxorpc/sdk";
import { Buffer } from "node:buffer";
import {
  TransactionUnspentOutput,
  TransactionInput,
  TransactionOutput,
  TransactionHash,
  TransactionUnspentOutputs,
} from "@emurgo/cardano-serialization-lib-nodejs";

const queryClient = new CardanoQueryClient({
  // Dolos Endpoint
  uri: Deno.env.get("DOLOS_ENDPOINT"),
});

console.time("dolos");
const utxos = await queryClient.searchUtxosByAddress(
  Buffer.from(
    // Fetched from browser using wallet.getChangeAddress()
    "01748db2058acba59a4cac60ea2169d052276e1c7f97a8d03bfb1d0e638156ab4c0083b4f0bc41b18573a76151498101c764737e62fe7bcea1",
    "hex",
  ),
);
console.timeEnd("dolos");
console.log("UTXOs Found:", utxos.length);

const parsedUtxo: TransactionUnspentOutputs = TransactionUnspentOutputs.new();

console.time("build_utxo_dolos");
for (const utxo of utxos) {
  // UTXOs from dolos
  const bytes = utxo.nativeBytes;
  if (!bytes) {
    throw new Error("No native bytes");
  }
  parsedUtxo.add(
    TransactionUnspentOutput.new(
      TransactionInput.new(
        TransactionHash.from_bytes(utxo.txoRef.hash),
        utxo.txoRef.index,
      ),
      TransactionOutput.from_bytes(bytes),
    ),
  );
}
console.timeEnd("build_utxo_dolos");

const utxoHexes: string[] = [];
for (let i = 0; i < parsedUtxo.len(); i++) {
  utxoHexes.push(parsedUtxo.get(i).to_hex());
}
console.log(utxoHexes);

Deno.exit(0);
