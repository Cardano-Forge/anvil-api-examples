import { API_URL, HEADERS } from "../utils/constant.ts";

const address = "addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp";

const response = await fetch(`${API_URL}/wallets/balance?address=${address}`, {
  method: "GET",
  headers: HEADERS,
});

console.log(await response.json());

// Expected Output (hex-encoded CBOR Value per CIP-30):
// "821a001e8480a1581c..."
