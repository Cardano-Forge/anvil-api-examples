import { API_URL, HEADERS } from "../utils/constant.ts";

const stakeAddress = "stake_test1uqfu74w3wh4gfzu8m6e7j987h4lq9r3t7ef5gaw497uu85qsqfy27";

const response = await fetch(`${API_URL}/wallets/utxos?stakeAddress=${stakeAddress}`, {
  method: "GET",
  headers: HEADERS,
});

console.log(await response.json());

// Expected Output (array of hex-encoded CBOR UTXOs per CIP-30):
// ["8282582056a393244dfd5f6d8b1c83751f6f513f317af785c93a70007dfea6f6fee0dda500...", ...]
