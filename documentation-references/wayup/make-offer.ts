// API endpoint for Wayup Marketplace
const NFT_BASE_URL = "https://prod.api.ada-anvil.app/marketplace/api";

// NFT Collection and asset to bid on
const NFT_POLICY_ID = "6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01";
const NFT_ASSET_NAME_HEX = "4646506f776572436f726573373338";

// Wallet address to receive change
const BIDDER_CHANGE_ADDRESS = "addr1qx33ycd2ymg02dxh6vnnf8dsk54l8ranr9cfjk9qrlj3309c69jc4n8h3uvnczncaqu2sm03pl99h99n75uvtl3mhv0q3z8s8m";

// UTXOs from your wallet to fund the transaction
const BIDDER_UTXOS: string[] = [
  "82825820fa7a8f907051db7783be036684481fdce2a5fbcf19f6e5ea5f9f09128288dd1f0382583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a0092b832a1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a2504646506f776572436f7265733136363001504646506f776572436f7265733137323001",
  "82825820fd43f693f0cd4c690ca3adde613262fc41530e62b3cacc906a0056603f5514ae0082583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a0085b174a1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a34e4646506f776572436f7265733437014f4646506f776572436f72657336323901504646506f776572436f7265733132343801"
];

// Offer amount in ADA (minimum 5 ADA)
const OFFER_AMOUNT_ADA = 6;

// Step 1: Identify the NFT to bid on
console.log(`NFT to bid on: Policy ID ${NFT_POLICY_ID}, Asset Name ${NFT_ASSET_NAME_HEX}`);

// Step 2: Create the offer payload
const offerPayload = {
  changeAddress: BIDDER_CHANGE_ADDRESS,
  utxos: BIDDER_UTXOS,
  createOffer: [
    {
      policyId: NFT_POLICY_ID,
      assetName: NFT_ASSET_NAME_HEX,
      priceAda: OFFER_AMOUNT_ADA,
    },
  ],
};

console.log(`Creating offer for ${OFFER_AMOUNT_ADA} ADA`);

// Step 3: Build the transaction
const response = await fetch(`${NFT_BASE_URL}/build-tx`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(offerPayload),
});

const result = await response.json();
console.log("Transaction:", result.transactions);

// Next steps: Sign the hex with your wallet and submit via /submit endpoint

// Run this with: deno run --allow-net make-offer.ts
