import { Hono, type Context } from "jsr:@hono/hono@^4.7.4";
import { cors } from "jsr:@hono/hono@^4.7.4/cors";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import { API_URL, HEADERS } from "../utils/constant.ts";

// This is like a faucet in this example.
const HOME =
  "addr_test1qrvx8wgdndrk98qf62vka3q4fglchk7h940vepdtgcv9fuu0e0aeuac6j2xhz77esaaudku68ha89qesqvd29pmuzw6qk8xkcn";

const maxWallets = 51;

type Wallet = { base_address_preprod: string; skey: string };
const wallets: Wallet[] = [];
for (let i = 1; i <= maxWallets; i++) {
  wallets.push(
    JSON.parse(await Deno.readTextFile(`./wallets/customer_${i}.json`)),
  );
}

const database: Wallet[] = structuredClone(
  wallets.map((wallet) => ({
    base_address_preprod: wallet.base_address_preprod,
    skey: wallet.skey,
  })),
);

const app = new Hono();

app.use(cors()); // Note: By default this function does:
// - Send FROM the CUSTOMER wallet to the HOME wallet.
// - BUT you can switch the changeAddress and outputs[0].address to send an initial amount of ADA to all test wallets
async function createTransaction(changeAddress: string) {
  const data = {
    changeAddress: changeAddress,
    outputs: [
      {
        address: HOME,
        lovelace: 1_000_000 * 1,
      },
    ],
  };

  const tx = await fetch(`${API_URL}/transactions/build`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: HEADERS,
  });

  const result = await tx.json();

  return result;
}

function signTransaction(transaction: string, skey: string) {
  // Sign transaction with policy key
  const transactionToSignWithCustomerKey =
    FixedTransaction.from_hex(transaction);
  transactionToSignWithCustomerKey.sign_and_add_vkey_signature(
    PrivateKey.from_bech32(skey),
  );
  return transactionToSignWithCustomerKey;
}

async function submitTransaction(transaction: FixedTransaction) {
  const urlSubmit = `${API_URL}/transactions/submit`;

  try {
    const submitted = await fetch(urlSubmit, {
      method: "POST",
      body: JSON.stringify({
        signatures: [], // This empty because the txToSubmitOnChain has the vkeys
        transaction: transaction.to_hex(),
      }),
      headers: HEADERS,
    });

    const response = await submitted.json();
    return response;
  } catch (e) {
    console.error("e", e);
    throw e;
  }
}

async function distribution(wallet: Wallet) {
  const transaction = await createTransaction(wallet.base_address_preprod);
  const signedTx = signTransaction(transaction.complete, wallet.skey);
  return await submitTransaction(signedTx);
}

// NOTE: using an API Endpoint, but this is totally optional.
app.post("/distribution", async (c: Context) => {
  const responses = await Promise.all(
    database.map((wallet) => distribution(wallet)),
  );

  console.debug("responses", responses);

  return c.json({ message: "Okkkkkk!" });
});

Deno.serve({ port: 1234 }, app.fetch);

// curl -XPOST -H "Content-Type: application/json" -d '{}' http://localhost:1234/distribution
