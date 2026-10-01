// serialize-datum.ts — JSON → Plutus Data hex (and back) with a CIP-57 schema, no blueprint upload.
// node serialize-datum.ts
// Costs nothing and needs no wallet: the schema travels with the request.
import { post } from "./_lib.ts";

// The hello-world datum as Aiken writes it: the schema is a $ref into `definitions`.
const definitions = {
  VerificationKeyHash: { title: "VerificationKeyHash", dataType: "bytes" },
  "hello_world/Datum": {
    title: "Datum",
    anyOf: [
      {
        title: "Datum",
        dataType: "constructor",
        index: 0,
        fields: [{ title: "owner", $ref: "#/definitions/VerificationKeyHash" }],
      },
    ],
  },
};
const schema = { $ref: "#/definitions/hello_world~1Datum" };
const data = { owner: "1dd6dd756e5397e019debb4d116e11748a93d2f09fd7a894ec8f8af2" }; // bytes = hex, never text

// 1. Serialize → the response is a bare JSON string (the hex), not an object.
const hex = await post<string>("/schemas/serialize", { data, schema, definitions });
console.log("datum hex", hex); // d8799f581c1dd6dd…8af2ff

// 2. Parse it back. Integers come back as decimal strings, bytes as hex.
const back = await post<{ owner: string }>("/schemas/parse", {
  data: { hex },
  schema,
  definitions,
});
if (back.owner !== data.owner) throw new Error("round trip mismatch");
console.log("parsed", back);

// 3. Use it as-is: `datum: { type: "inline", value: hex }` on an output (no `shape`), or
//    `redeemer: { type: "hex", value: hex }` on a scriptInteraction.
console.log(
  JSON.stringify({
    address: "<script_address>",
    lovelace: 2_000_000,
    datum: { type: "inline", value: hex },
  }),
);
