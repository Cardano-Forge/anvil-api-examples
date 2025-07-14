import { API_URL, HEADERS } from "../../utils/constant.ts";

// This example parses a hex-encoded datum string back into a structured JSON object.
// The script hash is required for the API to fetch the validator's schema,
// which defines how to correctly interpret the raw hex data.

// This is the hash of the *parameterized* script.
const scriptHash = "333158938654b6e69ce1349aeeadcff7fdc0c285f3102b8697a1e173";

// This is the hex-encoded datum string we want to parse.
const datumHex = "d8799f581c30f4e824283240d2ca66f3e09b0b7adfc5d37816c072279b31f090a4ff";

const response = await fetch(
  `${API_URL}/validators/${scriptHash}/parse`,
  {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      type: "datum",
      purpose: "spend",
      data: { hex: datumHex },
    }),
  },
);

const result = await response.json();

console.log("Parse Datum Response:");
console.log("Parsed Datum Object:", JSON.stringify(result, null, 2));
