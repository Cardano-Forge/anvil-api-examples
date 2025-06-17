// API endpoint for Wayup Marketplace
const BASE_URL = "https://prod.api.ada-anvil.app/marketplace/api";

// NFT Collection to query
const POLICY_ID = "6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01";

// Step 1: Define the query parameters
console.log(`Querying assets for policy ID: ${POLICY_ID}`);
const input = {
  policyId: POLICY_ID,
  saleType: "listedOnly" as const,  // Options: "all", "listedOnly", "offersOnly"
  orderBy: "priceAsc" as const,     // Options: "priceAsc", "priceDesc", "newest", "oldest"
  limit: 5,                         // Number of results to return
  // Optional parameters:
  // offset: 0,                     // Pagination offset
  // traits: { "Background": "Red" } // Filter by traits
};

// Step 2: Construct the URL with encoded parameters
const url = `${BASE_URL}/get-collection-assets?policyId=${POLICY_ID}&saleType=listedOnly&orderBy=priceAsc&limit=5`;

// Step 3: Fetch the assets
const response = await fetch(url);
const result = await response.json();

// Step 4: Process and display results
const assets = result?.result?.data?.results || [];
console.log(result);
console.log(`Found ${assets.length} assets:`);

// Step 5: Display asset details
assets.forEach((asset, index) => {
  console.log(`\nAsset #${index + 1}:`);
  console.log(`  Policy ID: ${asset.policyId}`);
  console.log(`  Asset Name: ${asset.assetName}`);
  
  if (asset.listing) {

    // 1 ADA = 1_000_000 lovelace
    console.log(`  Listed Price: ${asset.listing.price / 1_000_000} ADA`);
    console.log(`  Listing ID: ${asset.listing.txHashIndex}`);
  } else {
    console.log(`  Not listed for sale`);
  }
  
  // If metadata is available
  if (asset.metadata) {
    console.log(`  Name: ${asset.metadata.name || "N/A"}`);
    
    if (asset.metadata.traits) {
      console.log(`  Traits:`);
      Object.entries(asset.metadata.traits).forEach(([key, value]) => {
        console.log(`    ${key}: ${value}`);
      });
    }
  }
});

// Run this with: deno run --allow-net get-collection-assets.ts
