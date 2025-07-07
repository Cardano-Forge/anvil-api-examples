import { API_URL, HEADERS } from "../../utils/constant.ts";

// This example demonstrates how to derive a script address from its hash.

// This is the hash of the un-parameterized 'hello_world.hello_world.spend' validator.
const scriptHash = "333158938654b6e69ce1349aeeadcff7fdc0c285f3102b8697a1e173";

const response = await fetch(
  `${API_URL}/validators/${scriptHash}/address`,
  {
    method: "GET",
    headers: HEADERS,
  },
);

const result = await response.json();

console.log("Get Script Address Response:");
console.log("Bech32 Address:", result.bech32);
console.log("Hex Address:", result.hex);
