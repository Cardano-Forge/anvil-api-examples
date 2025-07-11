// deno run --allow-net --allow-read cip68.ts
import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import {
  dateToSlot,
  getKeyhash,
  createPolicyScript,
  getPolicyId,
} from "../utils/shared.ts";
import { API_URL, HEADERS } from "../utils/constant.ts";
import { getUtxos } from "../fetch-utxos-from-the-backend/utxos/blockfrost.ts";

const customerWallet = JSON.parse(Deno.readTextFileSync("wallet-customer.json"));
const treasuryWallet = JSON.parse(Deno.readTextFileSync("wallet-treasury.json"));
const policyWallet = JSON.parse(Deno.readTextFileSync("wallet-policy.json"));
const metaManagerWallet = JSON.parse(Deno.readTextFileSync("wallet-metaManager.json"));

//string like below or object with name, format and label
// string example: "000de140616e76696c61706963697036385f31373532323532313433383638"
// object example: { name: "anvil-api-1752252143868", format: "utf8", label: 222 }
const assetName = "000de140616e76696c61706963697036385f31373532323532313433383638";

//get policy simple script varaibles. Usually we wouldn't need these and you can just pass the policy ID from mint. 
const expirationDate = "2026-01-01";
const slot = await dateToSlot(new Date(expirationDate));
const keyhash = getKeyhash(policyWallet.base_address_preprod);
if (!keyhash) {
  throw new Error("Unable to get key hash for policy, missing or invalid skey");
}
const policyAnvilApi = createPolicyScript(keyhash, slot);
const policyAnvilApiScript = {
  type: "all",
  scripts: [
    {
      type: "sig",
      keyHash: keyhash.to_hex(),
    },
    {
      type: "before",
      slot: slot,
    },
  ],
};

//get utxos for treasury wallet since we need to pay for the transaction
const BLOCKFROST_BASE_URL = "https://cardano-preprod.blockfrost.io/api/v0";
const BLOCKFROST_PROJECT_ID = Deno.env.get("BLOCKFROST_PROJECT_ID");
if (!BLOCKFROST_PROJECT_ID) {
  throw new Error("Missing BLOCKFROST_PROJECT_ID env var");
}
const utxos = await getUtxos(
  BLOCKFROST_BASE_URL,
  BLOCKFROST_PROJECT_ID,
  treasuryWallet.base_address_preprod,
);

//build transaction payload
const data = {
  changeAddress: treasuryWallet.base_address_preprod,
  utxos,
  //automatically handles finding the UTxO output reference for the assiciated asset. 
  //Adds appropriate inputs and outputs as well as updates the (100) reference token 
  cip68Updates: [ // Will be updated to cip68MetadataUpdates (soon)
    {
      policyId: getPolicyId(policyAnvilApi.mint_script),
      assetName: assetName,
      metadata: {
        name: "Updated Name",
        description: "This is the updated description.",
        image: "ipfs://new-image-hash",
      },
      action: "update",
    },
  ],
  preloadedScripts: [ //only needed on First mint
    {
      type: "simple",
      script: policyAnvilApiScript,
      hash: getPolicyId(policyAnvilApi.mint_script),
    },
  ],
};

console.debug("data", data);

//build transaction
const urlTx = `${API_URL}/transactions/build`;
const response = await fetch(urlTx, {
  method: "POST",
  body: JSON.stringify(data),
  headers: HEADERS,
});

console.debug(response);
const output = await response.json();
console.log(output);

if (response.status !== 200) {
  throw new Error(`Unable to build tx ${response.statusText}`);
}

const transaction = FixedTransaction.from_bytes(
  Buffer.from(output.complete, "hex"),
);  

//Sign transaction with MetaManager wallet
transaction.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(metaManagerWallet.skey),
);

//Sign transaction with Treasury wallet
transaction.sign_and_add_vkey_signature(
  PrivateKey.from_bech32(treasuryWallet.skey),
);

//submit transaction
const urlSubmit = `${API_URL}/transactions/submit`;
const submitted = await fetch(urlSubmit, {
  method: "POST",
  body: JSON.stringify({
    signatures: [],
    transaction: transaction.to_hex(),
  }),
  headers: HEADERS,
});

const submittedOutput = await submitted.json();

console.debug(submittedOutput);

// Expected Output:
// {
//   hash: "e359b420e31d28250d353d94259a9b662c763901740ae2206c1c8e6d26b5a7bb",
//   complete: "84a700d901028282582056b0a4174d51175a24ba4f889bcf46b2e299d376a0df65a6ed8b411a2c5cfc49028258207834bdb918a08eb633c5e333ba7b5c63323e38b98f3f1765d4f966f96631f34100018482581d6097b71f14def2ff4a007a12f825a658e471be48e6197e4a529109cb46821a00114bdaa1581ce050a7ea28b7b52e8196cb8acaa39164652e14243960861b1cd971fba1581e000643b0616e76696c61706963697036385f3230323530313137313634330182581d6030f4e824283240d2ca66f3e09b0b7adfc5d37816c072279b31f090a4821a00114bdaa1581ce050a7ea28b7b52e8196cb8acaa39164652e14243960861b1cd971fba1581e000de140616e76696c61706963697036385f32303235303131373136343301a300581d6018033ebcf6b5d20fa3e16589cbbccae56b0593b80c5f9d46460c5e40011a00124f80028201d8184a49616e76696c2d74616782581d6030f4e824283240d2ca66f3e09b0b7adfc5d37816c072279b31f090a41a05ccf57b021a00034691031a05225621081a05223a0109a1581ce050a7ea28b7b52e8196cb8acaa39164652e14243960861b1cd971fba2581e000643b0616e76696c61706963697036385f32303235303131373136343301581e000de140616e76696c61706963697036385f323032353031313731363433010ed9010281581c18033ebcf6b5d20fa3e16589cbbccae56b0593b80c5f9d46460c5e40a200d90102818258207aaca699b8b0f3b405e76bdc0d02608e91634c77925eaa7cc6ee9ab7573e70c4584018a0f7ccba0a41c468c44dc9e3f6c945f4dd457b96edacb1899c593f75437b8d4a09857688d56a3478050a378032844e3c93dee4c76cbbccf5c813f2c003300201d90102818201828200581c4b8e61956c9b3628ed32c73bc1e4989e693e311c2713327f3db16b6782051a0a78592df5f6",
//   stripped: "84a700d901028282582056b0a4174d51175a24ba4f889bcf46b2e299d376a0df65a6ed8b411a2c5cfc49028258207834bdb918a08eb633c5e333ba7b5c63323e38b98f3f1765d4f966f96631f34100018482581d6097b71f14def2ff4a007a12f825a658e471be48e6197e4a529109cb46821a00114bdaa1581ce050a7ea28b7b52e8196cb8acaa39164652e14243960861b1cd971fba1581e000643b0616e76696c61706963697036385f3230323530313137313634330182581d6030f4e824283240d2ca66f3e09b0b7adfc5d37816c072279b31f090a4821a00114bdaa1581ce050a7ea28b7b52e8196cb8acaa39164652e14243960861b1cd971fba1581e000de140616e76696c61706963697036385f32303235303131373136343301a300581d6018033ebcf6b5d20fa3e16589cbbccae56b0593b80c5f9d46460c5e40011a00124f80028201d8184a49616e76696c2d74616782581d6030f4e824283240d2ca66f3e09b0b7adfc5d37816c072279b31f090a41a05ccf57b021a00034691031a05225621081a05223a0109a1581ce050a7ea28b7b52e8196cb8acaa39164652e14243960861b1cd971fba2581e000643b0616e76696c61706963697036385f32303235303131373136343301581e000de140616e76696c61706963697036385f323032353031313731363433010ed9010281581c18033ebcf6b5d20fa3e16589cbbccae56b0593b80c5f9d46460c5e40a0f5f6",
//   witnessSet: "a200d90102818258207aaca699b8b0f3b405e76bdc0d02608e91634c77925eaa7cc6ee9ab7573e70c4584018a0f7ccba0a41c468c44dc9e3f6c945f4dd457b96edacb1899c593f75437b8d4a09857688d56a3478050a378032844e3c93dee4c76cbbccf5c813f2c003300201d90102818201828200581c4b8e61956c9b3628ed32c73bc1e4989e693e311c2713327f3db16b6782051a0a78592d"
// }
