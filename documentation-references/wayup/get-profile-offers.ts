// API endpoint for Wayup Marketplace
const BASE_URL = "https://prod.api.ada-anvil.app/marketplace/api";

// Wallet address to query offers for
const WALLET_ADDRESS = "addr1qx33ycd2ymg02dxh6vnnf8dsk54l8ranr9cfjk9qrlj3309c69jc4n8h3uvnczncaqu2sm03pl99h99n75uvtl3mhv0q3z8s8m";

// Optional parameters
const PAGE_LIMIT = 20; // Number of results to return
const PAGE_CURSOR = null; // Pagination cursor (leave as null for first page)

// Step 1: Build the request URL
const requestUrl = `${BASE_URL}/get-profile-offers?address=${WALLET_ADDRESS}`;

// Step 2: Execute the request
console.log("Fetching user's NFT offers...");
const response = await fetch(requestUrl);

// Step 3: Process the response
const result = await response.json();
// Access the results directly as they're at the top level of the response
const { results, pageState } = result;

// Step 4: Display the results
console.log(`Found ${results.length} offers made by address ${WALLET_ADDRESS}`);
console.log("Offers:");

results.forEach((item, index) => {
  console.log(`\n--- Offer ${index + 1} ---`);
  console.log(`Policy ID: ${item.policyId}`);
  console.log(`Asset Name: ${item.assetName}`);
  // Offer price is returned in lovelace (1 ADA = 1,000,000 lovelace)
  console.log(`Offer Amount: ${Number(item.price) / 1_000_000} ADA`);
  // txHashIndex contains both the transaction hash and the output index separated by '#'
  const [txHash, outputIndex] = item.txHashIndex.split("#");
  console.log(`Transaction Hash: ${txHash}`);
  console.log(`Output Index: ${outputIndex}`);
  
  if (item.asset) {
    console.log("\nAsset Details:");
    console.log(`Name: ${item.asset.name}`);
    console.log(`Media: ${item.asset.media?.src || item.asset.image || "No media available"}`);
  } else {
    console.log("\nNo asset details available");
  }
});

// Step 5: Handle pagination
if (pageState) {
  console.log(`\nMore results available. Use this cursor for the next page: ${pageState}`);
}

// Run this with: deno run --allow-net get-profile-offers.ts
