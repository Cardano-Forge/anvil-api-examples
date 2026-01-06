import { API_URL, HEADERS } from "../utils/constant.ts";

const address = "addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp";

const response = await fetch(`${API_URL}/wallets/utxos?address=${address}`, {
  method: "GET",
  headers: HEADERS,
});

console.log(await response.json());

// Expected Output (array of hex-encoded CBOR UTXOs per CIP-30):
// ["8282582056a393244dfd5f6d8b1c83751f6f513f317af785c93a70007dfea6f6fee0dda500...", ...]
