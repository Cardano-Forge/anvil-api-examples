// API endpoint for Wayup Marketplace
const BASE_URL = "https://prod.api.ada-anvil.app/marketplace/api";

// Wallet address to query listings for
const WALLET_ADDRESS = "addr1qx33ycd2ymg02dxh6vnnf8dsk54l8ranr9cfjk9qrlj3309c69jc4n8h3uvnczncaqu2sm03pl99h99n75uvtl3mhv0q3z8s8m";

// Optional parameters
const PAGE_LIMIT = 20; // Number of results to return
const PAGE_CURSOR = null; // Pagination cursor (leave as null for first page)
const POLICY_ID = null; // Optional: filter by policy ID
const SEARCH_TERM = null; // Optional: search term for filtering by name

// Step 2: Build the request URL
const requestUrl = `${BASE_URL}/get-profile-listings?address=${WALLET_ADDRESS}`;

// Step 3: Execute the request
console.log("Fetching user's NFT listings...");
const response = await fetch(requestUrl);

// Step 4: Process the response
const result = await response.json();
// Access the results directly as they're at the top level of the response
const { results, pageState } = result;

// Step 5: Display the results
console.log(`Found ${results.length} listings for address ${WALLET_ADDRESS}`);
console.log("Listings:");
results.forEach((item, index) => {
  console.log(`\n--- Listing ${index + 1} ---`);
  console.log(`Name: ${item.name}`);
  console.log(`Policy ID: ${item.policyId}`);
  console.log(`Asset Name: ${item.assetName}`);
  console.log(`Price: ${Number(item.listing.price) / 1000000} ADA`);
  console.log(`Tx Hash Index: ${item.listing.txHashIndex}`);
  console.log("\nListing Marketplace: " + item.listing.type);

});

// Step 6: Handle pagination
if (pageState) {
  console.log(`\nMore results available. Use this cursor for the next page: ${pageState}`);
}

// Run this with: deno run --allow-net get-profile-listings.ts

/*

Output:

Fetching user's NFT listings...
Found 2 listings for address addr1qx33ycd2ymg02dxh6vnnf8dsk54l8ranr9cfjk9qrlj3309c69jc4n8h3uvnczncaqu2sm03pl99h99n75uvtl3mhv0q3z8s8m
Listings:

--- Listing 1 ---
Name: Serene Power Core
Policy ID: 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01
Asset Name: 4646506f776572436f72657331363630
Price: 25 ADA
Tx Hash Index: daac1d3b80dcab8817c2f02f2d43ab2b33a4e74419679939eb8aa5f70b03f35c#0

Listing Marketplace: wayup

--- Listing 2 ---
Name: Shimmering Power Core
Policy ID: 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01
Asset Name: 4646506f776572436f7265733437
Price: 5 ADA
Tx Hash Index: 4baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac9#0

Listing Marketplace: jpgstore

*/