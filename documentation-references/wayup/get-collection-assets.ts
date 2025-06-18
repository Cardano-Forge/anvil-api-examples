// API endpoint for Wayup Marketplace
const BASE_URL = "https://prod.api.ada-anvil.app/marketplace/api";

// NFT Collection to query
const POLICY_ID = "6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01";

// Step 1: Define the query parameters
console.log(`Querying assets for policy ID: ${POLICY_ID}`);

// Step 2: Construct the URL with encoded parameters
const url = `${BASE_URL}/get-collection-assets?policyId=${POLICY_ID}&saleType=listedOnly&orderBy=priceAsc&limit=5`;

// Step 3: Fetch the assets
const response = await fetch(url);
const result = await response.json();

// Step 4: Process and display results
const assets = result.results || [];
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

/*

Output:

Querying assets for policy ID: 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01
Found 5 assets:

Asset #1:
  Policy ID: 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01
  Asset Name: 4646506f776572436f7265733437
  Listed Price: 5 ADA
  Listing ID: 4baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac9#0

Asset #2:
  Policy ID: 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01
  Asset Name: 4646506f776572436f726573373338
  Listed Price: 5 ADA
  Listing ID: b808df86c4bb38072dac95bddb65121c30f2e1cf6190514ddac63eadfe1f7c97#0

Asset #3:
  Policy ID: 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01
  Asset Name: 4646506f776572436f72657331333239
  Listed Price: 10 ADA
  Listing ID: f4a54134caf96b0cdc0f6843e781a6ab4b8d60a3c85adbcabdfd005a2bf7af39#0

Asset #4:
  Policy ID: 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01
  Asset Name: 4646506f776572436f726573393533
  Listed Price: 10 ADA
  Listing ID: c2f6a8ab662fe06596dfa630b0a6d289acde68af9a8b49fb725a367c4f7140c4#0

Asset #5:
  Policy ID: 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01
  Asset Name: 4646506f776572436f72657331363835
  Listed Price: 11 ADA
  Listing ID: cb1d799ec0d9f611594a596c930b1710a7311462246a1b4ed605b333cdbe5b41#0

*/