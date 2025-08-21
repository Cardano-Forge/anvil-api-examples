import { API_URL, HEADERS } from "../../utils/constant.ts";
import { Buffer } from "node:buffer";
import plutusJson from "../hello-world/aiken-hello-world-with-params/plutus.json" with { type: "json" };

// This example applies a parameter to the 'hello_world' validator, which requires a secret message.
// Only transactions that provide the correct secret message can spend the funds locked by the contract.
// See aiken-hello-world-with-params smart contract for more details.

const validatorHash = "333158938654b6e69ce1349aeeadcff7fdc0c285f3102b8697a1e173";

const requestBody = {
  params: {
    [validatorHash]: [Buffer.from("Hello, Anvil!").toString("hex")]
  },
  blueprint: plutusJson // Include the blueprint since it may not be uploaded
};

const response = await fetch(
  `${API_URL}/blueprints/apply-params`,
  {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(requestBody),
  },
);

const result = await response.json();

console.log("Applied Parameters Response:");
console.log("Preloaded Script:", result.preloadedScript);
console.log("New Validator Addresses:", result.addresses);