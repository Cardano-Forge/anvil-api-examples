// API endpoint for Wayup Marketplace
const BASE_URL = "https://prod.api.ada-anvil.app/marketplace/api";

// Replace these with your actual signature and transaction hex
// The signature comes from your wallet after signing the transaction hex
// The transaction is the hex output from a previous build-tx call
const SIGNATURE = "a100818258209abd3a76d10735677af247ae7b415de96af28852...";
const TRANSACTION = "84a900d9010281825820fa7a8f907051db7783be036684481fdce2a5fbcf19f6e5ea5f9f09128288dd1f03...";

// Step 1: Prepare the payload with signature and transaction
console.log("Preparing submission payload...");
const payload = {
  signature: SIGNATURE.trim(),
  transaction: TRANSACTION.trim(),
};

// Step 2: Submit the transaction
console.log("Submitting signed transaction...");
const response = await fetch(`${BASE_URL}/submit`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

// Step 3: Process the response
const result = await response.json();
console.log("Transaction submission result:", result);

// Next step: Check the transaction status on chain explorers
console.log("Check transaction status on Cardanoscan or similar explorer");

// Run this with: deno run --allow-net submit-tx.ts
