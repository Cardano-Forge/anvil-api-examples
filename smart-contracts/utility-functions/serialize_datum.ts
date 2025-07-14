import { API_URL, HEADERS } from "../../utils/constant.ts";
import customer from "../../smart-contracts/hello-world/customer.json" with { type: "json" };

// This example serializes a JSON datum object into a hex-encoded string.
// The script hash is required for the API to fetch the validator's schema,
// which defines how to correctly structure the data into its binary format.

// This is the hash of the *parameterized* script from the previous step.
const scriptHash = "333158938654b6e69ce1349aeeadcff7fdc0c285f3102b8697a1e173";

// This is the datum object we want to serialize. It must match the schema defined in the contract.
// The 'hello_world' contract expects a datum with an 'owner' field containing a VerificationKeyHash.
const datumObject = {
  owner: customer.key_hash,
};

const response = await fetch(
  `${API_URL}/validators/${scriptHash}/serialize`,
  {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      type: "datum",
      purpose: "spend",
      data: datumObject,
    }),
  },
);

const result = await response.json();

console.log("Serialize Datum Response:");
console.log("Hex-encoded Datum:", result);
