import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import {
  Ed25519KeyHash,
  FixedTransaction,
  NativeScript,
  NativeScripts,
  PrivateKey,
  ScriptAll,
  ScriptPubkey,
  TimelockExpiry,
} from "@emurgo/cardano-serialization-lib-nodejs";

import policyWallet from "./policy.json" with { type: "json" };
import treasuryWallet from "./treasury.json" with { type: "json" };

type TransactionHash = string;
type CompleteTransactionHex = string;

type CharacterName = string;
type Character = {
  attributes: Record<string, string>;
  name: CharacterName;
};

const EXPIRATION_DATE = "2030-01-01";
const ANVIL_API_URL = "https://preprod.api.ada-anvil.app/v2/services";

const HEADERS = {
  "Content-Type": "application/json",
  "X-Api-Key": "CgYuz62xAS7EfM0hCP1gz1aOeHlQ4At36pGwnnLf",
};

const database: {
  assetsGenerated: Map<CharacterName, Character>;
  pendingTx: Map<TransactionHash, CompleteTransactionHex>;
} = {
  assetsGenerated: new Map(),
  pendingTx: new Map(),
};

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

export function dateToSlot(date: Date) {
  return Math.floor(date.getTime() / 1000) - 1596491091 + 4924800;
}

export function createPolicyScript(
  policyKeyHash: string,
  ttl: number,
  withTimelock = true,
): { mintScript: NativeScript; policyTTL: number } {
  const scripts = NativeScripts.new();
  const keyHashScript = NativeScript.new_script_pubkey(
    ScriptPubkey.new(Ed25519KeyHash.from_hex(policyKeyHash)),
  );
  scripts.add(keyHashScript);

  const policyTTL: number = ttl;

  if (withTimelock) {
    const timelock = TimelockExpiry.new(policyTTL);
    const timelockScript = NativeScript.new_timelock_expiry(timelock);
    scripts.add(timelockScript);
  }

  const mintScript = NativeScript.new_script_all(ScriptAll.new(scripts));

  return { mintScript, policyTTL };
}

export function getPolicyId(mintScript: NativeScript): string {
  return Buffer.from(mintScript.hash().to_bytes()).toString("hex");
}

function createOrLoadPolicy() {
  const slot = dateToSlot(new Date(EXPIRATION_DATE));
  const keyHash = policyWallet.key_hash;
  const policy = createPolicyScript(keyHash, slot, true);

  return { policy, slot, keyHash };
}

async function createTransaction(
  changeAddress: string,
  utxos: string[],
  asset: object,
  keyHash: string,
  slot: number,
  policyId: string,
) {
  const data = {
    changeAddress: changeAddress,
    utxos, // If passed, the backend will SKIP fetching UTXOS from the changeAddress.
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
    preloadedScripts: [
      {
        type: "simple",
        script: {
          type: "all",
          scripts: [
            {
              type: "sig",
              keyHash: keyHash,
            },
            {
              type: "before",
              slot: slot,
            },
          ],
        },
        hash: policyId,
      },
    ],
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

  const { policy, keyHash, slot } = createOrLoadPolicy();
  const policyId = getPolicyId(policy.mintScript);
  const metadata = generateUniqueNFT();

  const asset = {
    version: "cip25",
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
    policyId,
    quantity: 1,
  };

  database.assetsGenerated.set(metadata.name, metadata);

  const transaction = await createTransaction(
    changeAddress,
    utxos,
    asset,
    keyHash,
    slot,
    policyId,
  );

  console.debug(transaction);

  // ususally it is a redis + TTL to avoid blocking all available assets.
  database.pendingTx.set(transaction.hash, transaction);

  console.log(database.pendingTx);
  return c.json({ tx: transaction.stripped, hash: transaction.hash }); // rewquired customer signature
});

app.post("/submit", async (c: Context) => {
  const { transactionHash, signature } = await c.req.json();

  const tx = database.pendingTx.get(transactionHash);

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
  return c.html(`
    <!DOCTYPE html>
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

                <script>
                    function getAddr() {
                        const addr = document.getElementById(
                            "changeAddressBech32",
                        ).innerHTML;
                        return addr;
                    }

                    function getUtxos() {
                        const utxos = document.getElementById("utxos").innerHTML;
                        console.debug(utxos, typeof utxos);
                        const arr = utxos.split(",");
                        console.debug(arr);
                        return arr;
                    }
                </script>

                <button
                    hx-post="http://localhost:8000/mint"
                    hx-vals='js:{"changeAddress": getAddr(), "utxos": getUtxos()}'
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
                    window.Weld.wallet.subscribeWithSelector(
                        (s) => s.utxos,
                        (utxos) => {
                            document.querySelector("#utxos").textContent =
                                utxos ?? "-";
                        },
                    );

                    window.Weld.wallet.subscribeWithSelector(
                        (s) => s.changeAddressBech32,
                        (changeAddressBech32) => {
                            document.querySelector(
                                "#changeAddressBech32",
                            ).textContent = changeAddressBech32 ?? "-";
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
