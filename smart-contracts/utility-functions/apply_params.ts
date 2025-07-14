import { API_URL, HEADERS } from "../../utils/constant.ts";
import { Buffer } from "node:buffer";

// This example applies a parameter to the 'hello_world' validator, which requires a secret message.
// Only transactions that provide the correct secret message can spend the funds locked by the contract.
// See aiken-hello-world-with-params smart contract for more details.

const scriptHash = "333158938654b6e69ce1349aeeadcff7fdc0c285f3102b8697a1e173";

const params = {
  purpose: "spend",
  params: [Buffer.from("Hello, Anvil!").toString("hex")]
};

const response = await fetch(
  `${API_URL}/validators/${scriptHash}/apply-params`,
  {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(params),
  },
);

const result = await response.json();

console.log("Applied Parameters Response:");
console.log("New Script Hash:", result.hash);
console.log("New Script Address:", result.addressBech32);