// @blocked: numeric validityInterval bounds are ignored; this recipe currently fails
// expiring-transaction.ts — a payment the network refuses after a deadline (validityInterval.end).
// node expiring-transaction.ts
//
// Known issue: numeric validityInterval bounds are currently ignored — `end: 1757300000000` is
// treated as `end: true`, the default bound (now + 2 h). The check below throws while this stands.
import { type Built, loadWallet, post, signAndSubmit } from "./_lib.ts";

const wallet = loadWallet();
const RECEIVER = process.env.RECEIVER ?? wallet.enterprise_address_preprod;
const EXPIRES_IN_MS = 30 * 60 * 1000; // 30 minutes from now
const deadline = Date.now() + EXPIRES_IN_MS;

// A bound is POSIX time in MILLISECONDS when its calendar year is at least the current year minus 2,
// otherwise a slot number. `false` removes a bound; omitting one keeps the default
// (start = slot of the latest indexed block, end = now + 2 h).
const built = await post<Built>("/transactions/build", {
  changeAddress: wallet.base_address_preprod,
  outputs: [{ address: RECEIVER, lovelace: 2_000_000 }],
  validityInterval: { start: false, end: deadline },
});

// Verify the deadline that actually landed in the body before signing (ttl.unixTime is in ms).
type Parsed = { body: { ttl?: { slot: string; unixTime: string } } };
const parsed = await post<Parsed>("/transactions/parse", { transaction: built.complete });
const ttlMs = Number(parsed.body.ttl?.unixTime);
console.log("ttl", new Date(ttlMs).toISOString(), "requested", new Date(deadline).toISOString());
if (!(ttlMs <= deadline + 60_000)) {
  throw new Error("validityInterval.end was ignored — got the default 2 h bound (see line 1)");
}

await signAndSubmit(built.complete, wallet.skey);
