import { Hono, type Context } from "hono";
import { cors } from "hono/cors";

export const ANVIL_API_URL = "https://preprod.api.ada-anvil.app/v2/services";
const HEADERS = {
  "Content-Type": "application/json",
  "X-Api-Key": "CgYuz62xAS7EfM0hCP1gz1aOeHlQ4At36pGwnnLf",
};

const app = new Hono();

app.use(cors());

async function createTransaction(
  changeAddress: string,
  recipient: string,
  utxos: string[],
  lovelace: number,
) {
  const data = {
    changeAddress: changeAddress,
    utxos,
    outputs: [
      {
        address: recipient,
        lovelace,
      },
    ],
  };

  const tx = await fetch(`${ANVIL_API_URL}/transactions/build`, {
    method: "POST",
    body: JSON.stringify(data),
    headers: HEADERS,
  });

  return await tx.json();
}

app.post("/send", async (c: Context) => {
  const { changeAddress, utxos, lovelace, recipient } = await c.req.json();

  const transaction = await createTransaction(
    changeAddress,
    recipient,
    utxos,
    lovelace,
  );

  return c.json({ tx: transaction.complete, hash: transaction.hash });
});

app.post("/submit", async (c: Context) => {
  const { transaction, signature } = await c.req.json();

  console.debug("Transaction to send:", transaction);
  const submitted = await fetch(`${ANVIL_API_URL}/transactions/submit`, {
    method: "POST",
    body: JSON.stringify({
      signatures: [signature],
      transaction: transaction,
    }),
    headers: HEADERS,
  });

  const response = await submitted.json();

  console.debug("Response", response);

  if (submitted.status !== 200) {
    c.status(submitted.status);
  }

  return c.json({ message: response });
});

app.get("/", (c: Context) => {
  return c.html(`<!DOCTYPE html>
  <html lang="en">
      <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Weld x Vanilla JavaScript</title>

          <style>
              /* Root Variables */
              :root {
                  --bg-primary: #333;
                  --bg-secondary: #ebebeb;
                  --bg-accent: #212121;

                  --fg-primary: #fff;
                  --fg-secondary: #000;
                  --fg-variant: #333;

                  --white: #fff;
                  --black: #000;

                  --font: "Mulish", Helvetica, Arial, sans-serif;
              }

              /* Dark Theme Variables */
              .dark {
                  --bg-primary: #ebebeb;
                  --bg-secondary: #333;
                  --bg-accent: #212121;

                  --fg-primary: #000;
                  --fg-secondary: #fff;
                  --fg-variant: #ebebeb;

                  --white: #000;
                  --black: #fff;
              }

              /* Themes */
              .paper {
                  --bg-primary: #000;
                  --bg-secondary: #dfd0b9;
                  --bg-accent: #000;

                  --fg-primary: #fff;
                  --fg-secondary: #000;
                  --fg-variant: #edede7;

                  --white: #edede7;
                  --black: #000;
              }

              /* Global Styles */
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: content-box;
              }

              body {
                  font-family: var(--font);
                  scroll-behavior: smooth;
                  background-color: var(--white);
                  color: var(--black);
              }

              p,
              span {
                  color: var(--fg-secondary);
              }

              .w-300 {
                  max-width: 18.75rem;
                  min-width: 18.75rem;
                  width: 18.75rem;
              }

              .break {
                  word-break: break-word;
              }

              /* Padding Utilities */

              .p-4 {
                  padding: 1rem;
              }

              /* Flexbox Utilities */
              .flex {
                  display: flex;
              }

              .flex-col {
                  flex-direction: column;
              }

              .justify-center {
                  justify-content: center;
              }

              /* Gap Utilities */
              .gap-4 {
                  gap: 1rem;
              }

              .gap-8 {
                  gap: 2rem;
              }

              /* Border Utilities */
              .border {
                  border: 0.125rem solid var(--fg-secondary);
              }

              .rounded {
                  border-radius: 1rem;
              }

              section,
              article {
                  box-shadow: 0.25rem 0.25rem var(--black);
                  padding: 1rem;
                  border: 0.125rem solid var(--fg-secondary);
                  border-radius: 1rem;
              }

              /* Buttons */
              .btn {
                  border: 0.125rem solid var(--fg-secondary);
                  border-radius: 1rem;
                  box-shadow: 0.25rem 0.25rem;
                  background-color: var(--white);
                  color: var(--fg-secondary);
                  padding: 1rem;
                  font-family: var(--font);
                  font-weight: bold;
                  font-size: medium;
                  transition: 0.1s;
              }

              .btn:hover {
                  translate: 0.25rem 0.25rem;
                  box-shadow: none;
                  cursor: pointer;
                  background-color: var(--bg-secondary);
              }
          </style>

          <style>
              /* General styles for inputs and selects */
              input[type="text"],
              select {
                  width: 100%; /* Full width */
                  padding: 10px; /* Padding inside the input/select */
                  margin: 8px 0; /* Margin between elements */
                  display: block; /* Make them block-level for better control */
                  border: 2px solid var(--black); /* Black border */
                  background-color: var(--white); /* White background */
                  color: var(--black); /* Black text */
                  font-size: 16px; /* Larger font size for readability */
                  box-sizing: border-box; /* Include padding and border in the element's total width/height */
              }

              /* Style adjustments on focus */
              input[type="text"]:focus,
              select:focus {
                  outline: none; /* Remove default outline */
                  border-color: var(
                      --black
                  ); /* Darker border color when focused */
              }
          </style>

          <script src="https://unpkg.com/htmx.org@2.0.4"></script>
          <script src="https://cdn.jsdelivr.net/gh/Emtyloc/json-enc-custom@main/json-enc-custom.js"></script>
      </head>

      <body hx-ext="json-enc-custom" parse-types="false" class="paper">
          <div class="p-4 flex gap-8 justify-center">
              <main class="border rounded p-4 flex flex-col gap-4 w-300 shadow">
                  <section>
                      <h2>Connected Wallet</h2>
                      Connected to <b id="connected-to">-</b><br />
                      Balance <b id="balance">-</b><br />
                  </section>

                  <section>
                      <h2>Wallets</h2>
                      <form id="wallet-selector">
                          <select
                              class="select select-bordered select-md max-w-xs rounded"
                              name="wallet-key"
                              value=""
                          >
                              <option value="">Loading...</option>
                          </select>
                          <button type="submit" class="btn text-center">
                              Connect Wallet
                          </button>

                          <input type="hidden" id="changeAddressBech32" />
                          <input type="hidden" id="utxos" />
                      </form>
                  </section>

                  <div id="messages">
                      <div id="error" class="break" />
                      <div id="message" class="break" />
                  </div>

                  <script>
                      function getAddr() {
                          const addr = document.getElementById(
                              "changeAddressBech32",
                          ).value;
                          return addr;
                      }

                      function getUtxos() {
                          const utxos = document.getElementById("utxos").value;
                          console.debug(utxos, typeof utxos);
                          const arr = utxos.split(",");
                          console.debug(arr);
                          return arr;
                      }
                  </script>

                  <form
                      hx-post="http://localhost:8000/send"
                      hx-on::after-request="signAndSubmit(event)"
                      hx-vals='js:{"changeAddress": getAddr(), "utxos": getUtxos(), "lovelace": 1_000_000}'
                      hx-swap="none"
                      hx-trigger="submit"
                  >
                      <input
                          class="rounded"
                          name="recipient"
                          id="recipient"
                          value=""
                          type="text"
                          placeholder="Recipient Address"
                      />

                      <button type="submit" class="btn">Send 1 ADA</button>
                  </form>
              </main>
          </div>

          <script>
              function init() {
                  window.Weld.config.update({ debug: true });

                  window.Weld.extensions.subscribeWithSelector(
                      (s) => s.allArr,
                      (exts) => {
                          const select = document.querySelector(
                              "#wallet-selector select",
                          );
                          if (!(select instanceof HTMLSelectElement)) {
                              console.error("Select not found");
                              return;
                          }

                          const options = [];
                          for (const extension of exts) {
                              const option = document.createElement("option");
                              option.value = extension.info.key;
                              option.innerText = extension.info.displayName;
                              options.push(option);
                          }

                          if (options.length === 0) {
                              const option = document.createElement("option");
                              option.value = "";
                              option.innerText = "No wallets";
                              options.push(option);
                          }

                          select.replaceChildren(...options);
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
                          console.debug("Refreshing UTXOs");
                          document.querySelector("#utxos").value = utxos ?? "-";
                      },
                  );

                  window.Weld.wallet.subscribeWithSelector(
                      (s) => s.changeAddressBech32,
                      (changeAddressBech32) => {
                          document.querySelector("#changeAddressBech32").value =
                              changeAddressBech32 ?? "-";
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

          <script>
              const form = document.querySelector("#wallet-selector");
              if (form instanceof HTMLFormElement) {
                  form.addEventListener("submit", (event) => {
                      event.preventDefault();
                      const data = new FormData(form);
                      const walletKey = data.get("wallet-key")?.toString();
                      if (walletKey) {
                          Weld.wallet.getState().connect(walletKey);
                      }
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
                  let response = null;
                  try {
                      if (!evt.detail.successful) {
                          throw new Error("Response was not successful.");
                      }
                      response = JSON.parse(evt.detail.xhr.response);
                  } catch {
                      // Replace the content of the result-container with the response
                      document.getElementById("error").innerHTML =
                          evt.detail.xhr.response.message.message;
                      return false;
                  }

                  const signature = await Weld.wallet
                      .getState()
                      .handler?.signTx(response.tx, true);

                  const submitted = await fetch("http://localhost:8000/submit", {
                      method: "POST",
                      body: JSON.stringify({
                          signature,
                          transaction: response.tx,
                      }),
                      headers: {
                          "Content-Type": "application/json",
                      },
                  });

                  const json = await submitted.json();

                  if (submitted.status !== 200) {
                      document.getElementById("error").innerHTML =
                          json.message.message;
                      return false;
                  }
                  document.getElementById("message").innerHTML =
                      json.message.txHash;
              }
          </script>
      </body>
  </html>
`);
});

Deno.serve(app.fetch);
