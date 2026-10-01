// submit-with-wallet-signature.ts — the production flow: build and submit on the server, sign in
// the user's browser with a CIP-30 wallet. No private key ever touches the server.
// node submit-with-wallet-signature.ts
// then open http://localhost:8000
import { type ServerResponse, createServer } from "node:http";
import { text } from "node:stream/consumers";
import { type Built, post } from "./_lib.ts";

// Browser side. The Weld library (github.com/Cardano-Forge/weld) wraps steps 1 and 3 for React apps.
const PAGE = `<!doctype html><meta charset="utf-8"><title>Sign with your wallet</title>
<button id="go">Send 2 ADA to myself</button><pre id="log"></pre>
<script type="module">
  const log = (m) => (document.getElementById("log").textContent += m + "\\n");
  document.getElementById("go").onclick = async () => {
    // 1. Connect a CIP-30 wallet (Lace, Eternl, ...).
    const name = Object.keys(window.cardano ?? {}).find((k) => window.cardano[k]?.enable);
    if (!name) return log("No CIP-30 wallet found");
    const api = await window.cardano[name].enable();
    const [changeAddress] = await api.getUsedAddresses(); // hex address — the builder accepts it
    // 2. Ask the server to build.
    const built = await (await fetch("/build", { method: "POST", body: JSON.stringify({ changeAddress }) })).json();
    if (built.message) return log("build failed: " + built.message);
    // 3. Sign. partialSign = true returns ONLY the wallet's witness set; Anvil's own witnesses are already in complete.
    const witness = await api.signTx(built.complete, true);
    // 4. Hand the witness back; the server merges it and submits.
    const out = await (await fetch("/submit", { method: "POST", body: JSON.stringify({ transaction: built.complete, witness }) })).json();
    log(out.txHash ? "submitted " + out.txHash : "submit failed: " + out.message);
  };
</script>`;

// Server side.
const json = (res: ServerResponse, status: number, body: unknown) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/build") {
      const { changeAddress } = JSON.parse(await text(req));
      // Decide amounts and receivers server-side; never trust them from the browser.
      const built = await post<Built>("/transactions/build", {
        changeAddress,
        outputs: [{ address: changeAddress, lovelace: 2_000_000 }],
      });
      return json(res, 200, { hash: built.hash, complete: built.complete });
    }
    if (req.method === "POST" && req.url === "/submit") {
      const { transaction, witness } = JSON.parse(await text(req));
      // `signatures`: witness sets from wallets — only their vkey witnesses are merged in.
      const out = await post<{ txHash: string }>("/transactions/submit", {
        transaction,
        signatures: [witness],
      });
      return json(res, 200, out);
    }
  } catch (error) {
    return json(res, 422, { message: (error as Error).message });
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(PAGE);
}).listen(8000, () => console.log("open http://localhost:8000"));
