import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import {
  COSESign1,
  COSEKey,
  BigNum,
  Label,
  Int,
} from "npm:@emurgo/cardano-message-signing-nodejs";
import {
  Ed25519Signature,
  RewardAddress,
  PublicKey,
  Address,
} from "npm:@emurgo/cardano-serialization-lib-nodejs";
import { Hono, type Next, type Context } from "npm:hono";
import { HTTPException } from "npm:hono/http-exception";
import { createMiddleware } from "npm:hono/factory";
import { cors } from "npm:hono/cors";
import { getCookie, setCookie, deleteCookie } from "npm:hono/cookie";

const app = new Hono();
app.use(cors());

// Acts like an allowed list for gated content
const registeredUsers = [
  "stake_test1uz8uh7u7wudf9rt300vcw77xmwdrm7njsvcqxx4zsa7p8dq9jyy9a",
  // ... Append new users
];

type User = {
  stake: string;
  ex: Date; // not implemented, just to show the idea
};
const shouldBeRedis: Map<string, User> = new Map();

// generate Session

function authenticate(c: Context, sigData: { signature: string; key: string }) {
  const decoded = COSESign1.from_bytes(Buffer.from(sigData.signature, "hex"));
  const headermap = decoded.headers().protected().deserialized_headers();
  if (!headermap) {
    throw new Error("No headermap");
  }
  const addressHex = Buffer.from(
    headermap.header(Label.new_text("address")).to_bytes(),
  )
    .toString("hex")
    .substring(4);
  const address = Address.from_bytes(Buffer.from(addressHex, "hex"));
  const key = COSEKey.from_bytes(Buffer.from(sigData.key, "hex"));
  const pubKeyBytes = key
    .header(Label.new_int(Int.new_negative(BigNum.from_str("2"))))
    .as_bytes();
  const publicKey = PublicKey.from_bytes(pubKeyBytes);
  const payload = decoded.payload();
  const signature = Ed25519Signature.from_bytes(decoded.signature());
  const receivedData = decoded.signed_data().to_bytes();
  const signerStakeAddrBech32 = RewardAddress.from_address(address)
    .to_address()
    .to_bech32();
  const utf8Payload = Buffer.from(payload).toString("utf8");
  const expectedPayload = `account: ${signerStakeAddrBech32}`; // reconstructed message
  // verify:
  const isVerified = publicKey.verify(receivedData, signature);
  const payloadAsExpected = utf8Payload === expectedPayload;
  const signerIsRegistered = registeredUsers.includes(signerStakeAddrBech32);
  const isAuthSuccess = isVerified && payloadAsExpected && signerIsRegistered;
  if (isAuthSuccess) {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 1);
    const sessionId = randomUUID();
    shouldBeRedis.set(sessionId, {
      stake: signerStakeAddrBech32,
      ex: expiration,
    });
    setCookie(c, "anvil_auth", sessionId);
  } else {
    deleteCookie(c, "anvil_auth");
  }

  return c.json({
    success: isAuthSuccess,
    message: isAuthSuccess
      ? "✅ Authentication success!"
      : "❌ Authentication failed.",
  });
}

app.post("/authenticate", async (c: Context) =>
  authenticate(c, await c.req.json()),
);

app.get(
  "/private",
  createMiddleware((c: Context, next: Next) => {
    const cookie = getCookie(c, "anvil_auth");
    if (cookie) {
      const session = shouldBeRedis.get(cookie); // TTL defined by EX is our duration
      if (session) {
        c.set("user", session);
        return next();
      }
    }

    throw new HTTPException(401, { message: "You are not authenticated" });
  }),
  (c: Context) => {
    return c.json({
      message: `Welcome ${c.get("user").stake} to the billionaires club !`,
    });
  },
);

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

                <script async defer>
                    function utf8ToHex(message) {
                      // Create an ArrayBuffer with enough space for two bytes per character
                      const buffer = new Uint16Array(message.length);

                      // Encode the message as UTF-16 (which is what JavaScript uses internally)
                      for (let i = 0; i < message.length; i++) {
                        buffer[i] = message.charCodeAt(i);
                      }

                      // Convert the UTF-16 encoded array into a Uint8Array
                      const uint8Buffer = new Uint8Array(buffer.buffer);

                      // Use TextEncoder to get the proper UTF-8 bytes for multibyte characters
                      const encoder = new TextEncoder();
                      const utf8Array = encoder.encode(message);

                      // Create an array to hold the hex representation
                      let hexStr = '';

                      // Convert each byte into its hexadecimal form
                      for (let i = 0; i < utf8Array.length; i++) {
                        const byte = utf8Array[i];
                        hexStr += ('00' + byte.toString(16)).slice(-2);
                      }

                      return hexStr;
                    }

                    async function authenticate(){
                        const stakeAddrBech32 = await Weld.wallet.handler.getStakeAddressBech32();
                        const stakeAddrHex = await Weld.wallet.handler.getStakeAddressHex();
                        const messageUtf = \`account: \${stakeAddrBech32}\`;
                        const messageHex = utf8ToHex(messageUtf);
                        const sigData = await Weld.wallet.handler.signData(messageHex);
                        const result = await submitToBackend(sigData);
                    }

                    async function submitToBackend(sigData){
                      const submitted = await fetch("http://localhost:8000/authenticate", {
                          method: "POST",
                          body: JSON.stringify(sigData),
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

                <button onclick="authenticate()">Login</button>

                <button
                    hx-get="http://localhost:8000/private"
                    hx-target="#message"
                    hx-swap="innetHTML"
                >
                    Get me to the club
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
        </body>
    </html>`);
});

Deno.serve(app.fetch);
