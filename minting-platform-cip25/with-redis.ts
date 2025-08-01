import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { createClient } from "redis";
import { 
  createNativeScript,
  dateToSlot,
} from "../utils/shared.ts";
import {
  FixedTransaction,
  PrivateKey,
} from "@emurgo/cardano-serialization-lib-nodejs";

import policyWallet from "./policy.json" with { type: "json" };
import treasuryWallet from "./treasury.json" with { type: "json" };

type CharacterName = string;
type Character = {
  attributes: Record<string, string>;
  name: CharacterName;
};

const EXPIRATION_DATE = "2030-01-01";
const ANVIL_API_URL = "https://preprod.api.ada-anvil.app/v2/services";

const HEADERS = {
  "Content-Type": "application/json",
  "X-Api-Key": "testnet_EyrkvCWDZqjkfLSe1pxaF0hXxUcByHEhHuXIBjt9",
};

// localhost:6379
const client = await createClient()
  .on("error", (err: Error) => console.log("Redis Client Error", err))
  .connect();

const app = new Hono();

app.use(cors());

/**
 * You can create the NFT on the fly using any algorithm you desire, or fetch a database to use existing assets and so on.
 */
function generateUniqueNFT() {
  const character: Character = {
    attributes: {
      part1: randomBytes(8).toString("hex"),
      part2: randomBytes(8).toString("hex"),
      part3: randomBytes(8).toString("hex"),
    },
    name: `0x${new Date().getTime()}`,
  };

  return character;
}

async function createOrLoadPolicy() {
  const slot = await dateToSlot(new Date(EXPIRATION_DATE));
  const keyHash = await getKeyhash(policyWallet.base_address_preprod);
  if (!keyHash) {
    throw new Error("Unable to get key hash for policy, missing or invalid skey");
  }
  const policy = await createNativeScript(keyHash, slot);

  return { policy, slot, keyHash };
}

async function createTransaction(
  changeAddress: string,
  asset: object,
  policy: object,
) {
  const data = {
    changeAddress: changeAddress,
    mint: [asset],
    outputs: [
      {
        address: treasuryWallet.base_address_preprod,
        lovelace: 1_000_000,
      },
      {
        address: changeAddress,
        assets: [
          {
            assetName: asset.assetName,
            policyId: asset.policyId,
            quantity: asset.quantity,
          },
        ],
      },
    ],
    preloadedScripts: [policy],
  };

  console.debug(data);

  const tx = await fetch(`${ANVIL_API_URL}/transactions/build`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: HEADERS,
  });

  return await tx.json();
}

// Step 1: Create Minting TX
// Step 2: Send to Frontend for Signature (Without metadata)
// Step 3: Bring back Metadata and submit on-chain

app.post("/mint", async (c: Context) => {
  const { changeAddress, utxos } = await c.req.json();

  const { policy } = await createOrLoadPolicy();
  const metadata = generateUniqueNFT();

  const asset = {
    version: "cip25",
    utxos,
    assetName: { name: metadata.name, format: "utf8" },
    metadata: {
      name: metadata.name,
      image: [
        "https://ada-anvil.s3.ca-central-1.amazonaws.com/",
        "logo_pres_V2_3.png",
      ],
      mediaType: "image/png",
      description: "Minting Platform Example using Anvil API",
      attributes: metadata.attributes,
    },
    policyId: policy.hash,
    quantity: 1,
  };

  // database.assetsGenerated.set(metadata.name, metadata);

  const transaction = await createTransaction(
    changeAddress,
    asset,
    policy,
  );

  console.debug(transaction);

  // ususally it is a redis + TTL to avoid blocking all available assets.
  await client.set(transaction.hash, JSON.stringify(transaction), {
    EX: 60 * 5,
    NX: true,
  });

  // console.log(database.pendingTx);
  return c.json({ tx: transaction.stripped, hash: transaction.hash }); // rewquired customer signature
});

app.post("/submit", async (c: Context) => {
  const { transactionHash, signature } = await c.req.json();

  const rawTx = await client.get(transactionHash);
  let tx = undefined;
  try {
    tx = JSON.parse(rawTx);
  } catch (e) {
    console.error("Transaction hash not found in redis.");
    throw e;
  }

  if (tx) {
    const urlSubmit = `${ANVIL_API_URL}/transactions/submit`;

    // Sign transaction with policy key
    const transactionToSubmit = FixedTransaction.from_bytes(
      Buffer.from(tx.complete, "hex"),
    );
    transactionToSubmit.sign_and_add_vkey_signature(
      PrivateKey.from_bech32(policyWallet.skey),
    );

    const submitted = await fetch(urlSubmit, {
      method: "POST",
      body: JSON.stringify({
        signatures: [signature], // A1000 returned from weld or whatever
        transaction: transactionToSubmit.to_hex(),
      }),
      headers: HEADERS,
    });

    const response = await submitted.json();

    console.log("Hourray !", response);
    return c.json({ message: response });
  }

  return c.json({
    message: "Please try again later, no tx has been submitted.",
  });
});

app.get("/", (c: Context) => {
  return c.html(`<!DOCTYPE html>
  <html lang="en">
      <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Weld x Vanilla JavaScript</title>

          <script src="https://unpkg.com/htmx.org@2.0.4"></script>
          <script src="https://cdn.jsdelivr.net/gh/Emtyloc/json-enc-custom@main/json-enc-custom.js"></script>
      </head>

      <body hx-ext="json-enc-custom" parse-types="false">
          <main>
              <section>
                  <h2>Wallets</h2>
                  <ul id="wallets"></ul>
              </section>
              <section>
                  <h2>Connection</h2>
                  Connecting to <span id="connecting-to">-</span><br />
                  Connected to <span id="connected-to">-</span><br />
                  Balance <span id="balance">-</span><br />
                  Change Address <span id="changeAddressBech32">-</span><br />
                  <span id="utxos"></span>
                  <button onclick="window.Weld.wallet.connect('eternl')">
                      Connect eternl
                  </button>
              </section>

              <div>
                  <div id="error" />
                  <div id="message" />
              </div>

              <button
                  hx-post="http://localhost:8000/mint"
                  hx-vals='js:{"changeAddress": Weld.wallet.changeAddressBech32, "utxos": Weld.wallet.utxos}'
                  hx-on::after-request="signAndSubmit(event)"
                  hx-swap="none"
              >
                  Mint Me
              </button>
          </main>

          <script>
              function init() {
                  window.Weld.config.update({ debug: true });

                  window.Weld.extensions.subscribeWithSelector(
                      (s) => s.allArr,
                      (exts) => {
                          const list = document.querySelector("#wallets");
                          for (const ext of exts) {
                              const item = document.createElement("li");
                              item.textContent = ext.info.displayName;
                              list?.appendChild(item);
                          }
                      },
                  );

                  window.Weld.wallet.subscribeWithSelector(
                      (s) => s.isConnectingTo,
                      (isConnectingTo) => {
                          document.querySelector("#connecting-to").textContent =
                              isConnectingTo ?? "-";
                      },
                  );

                  window.Weld.wallet.subscribeWithSelector(
                      (s) => s.displayName,
                      (displayName) => {
                          document.querySelector("#connected-to").textContent =
                              displayName ?? "-";
                      },
                  );

                  window.Weld.wallet.subscribeWithSelector(
                      (s) => s.balanceAda,
                      (balance) => {
                          document.querySelector("#balance").textContent =
                              balance?.toFixed(2) ?? "-";
                      },
                  );

                  window.addEventListener("load", () => {
                      window.Weld.init();
                  });

                  window.addEventListener("unload", () => {
                      window.Weld.cleanup();
                  });
              }
          </script>

          <script
              onload="init()"
              src="https://unpkg.com/@ada-anvil/weld@0.5.0/cdn.min.js"
              defer
          ></script>
          <script async defer>
              async function signAndSubmit(evt) {
                  console.log("signAndSubmit");

                  let response = null;
                  try {
                      if (!evt.detail.successful) {
                          throw new Error("Response was not successful.");
                      }
                      response = JSON.parse(evt.detail.xhr.response);
                  } catch {
                      const tempDiv = document.createElement("div");
                      tempDiv.innerHTML = evt.detail.xhr.response;

                      // Use htmx to swap the content
                      htmx.process(tempDiv);

                      // Replace the content of the result-container with the response
                      document.getElementById("error").innerHTML =
                          tempDiv.innerHTML;
                      return;
                  }
                  console.log(response);

                  const signature = await Weld.wallet
                      .getState()
                      .handler?.signTx(response.tx, true);

                  console.log(signature, response.hash);

                  const submitted = await fetch("http://localhost:8000/submit", {
                      method: "POST",
                      body: JSON.stringify({
                          signature,
                          transactionHash: response.hash,
                      }),
                      headers: {
                          "Content-Type": "application/json",
                      },
                  });

                  const text = await submitted.text();
                  const tempDiv = document.createElement("div");
                  tempDiv.innerHTML = text;

                  // Use htmx to swap the content
                  htmx.process(tempDiv);

                  if (submitted.status !== 200) {
                      // Replace the content of the result-container with the response
                      document.getElementById("error").innerHTML =
                          tempDiv.innerHTML;
                      return;
                  }

                  document.getElementById("message").innerHTML =
                      tempDiv.innerHTML;
              }
          </script>
      </body>
  </html>
`);
});

Deno.serve(app.fetch);
