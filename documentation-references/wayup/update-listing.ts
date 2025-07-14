// API endpoint for Wayup Marketplace
const BASE_URL = "https://prod.api.ada-anvil.app/marketplace/api";

// NFT listing to update
const POLICY_ID = "6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01";
const TX_HASH_INDEX = "4baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac9#0"; // Format: txHash#outputIndex

// Wallet address to receive change
const SELLER_CHANGE_ADDRESS = "addr1qx33ycd2ymg02dxh6vnnf8dsk54l8ranr9cfjk9qrlj3309c69jc4n8h3uvnczncaqu2sm03pl99h99n75uvtl3mhv0q3z8s8m";

// UTXOs from your wallet to fund the transaction
const SELLER_UTXOS = [
  "828258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac90182583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a001344eea1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a24f4646506f776572436f72657336323901504646506f776572436f7265733132343801",
  "828258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac90282583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e1a005b1fe1",
  "82825820daac1d3b80dcab8817c2f02f2d43ab2b33a4e74419679939eb8aa5f70b03f35c0182583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a007a089da1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a1504646506f776572436f7265733137323001"
];

// New listing price in ADA (minimum 5 ADA)
const NEW_PRICE_ADA = 10; // Update to your desired price

// Step 1: Identify the NFT listing to update
console.log(`Updating listing: Policy ID ${POLICY_ID}, TX Hash Index ${TX_HASH_INDEX}`);
console.log(`New price will be: ${NEW_PRICE_ADA} ADA`);

// Step 2: Prepare the payload for the build-tx endpoint
const payload = {
  changeAddress: SELLER_CHANGE_ADDRESS,
  utxos: SELLER_UTXOS,
  update: [
    {
      policyId: POLICY_ID,
      txHashIndex: TX_HASH_INDEX,
      newPriceAda: NEW_PRICE_ADA
    }
  ]
};

// Step 3: Build the transaction
console.log("Building update listing transaction...");
const response = await fetch(`${BASE_URL}/build-tx`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

// Step 4: Process the response
const result = await response.json();
console.log("Transaction:", result.transactions);

// Next steps: Sign the transaction with your wallet and submit via /submit endpoint
console.log("\nNext steps:");
console.log("1. Sign the transaction with your wallet");
console.log("2. Submit the signed transaction using the /submit endpoint");

// Run this with: deno run --allow-net update-listing.ts

/*

Output:

Updating listing: Policy ID 6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01, TX Hash Index 4baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac9#0
New price will be: 10 ADA
Building update listing transaction...
Transaction: [
  "84ab00d90102828258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac900825820daac1d3b80dcab8817c2f02f2d43ab2b33a4e74419679939eb8aa5f70b03f35c01018283583911a76f0fb801a29f591e9871576508d85b0b5f3c38774f65032f58fdadb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a00144178a1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a14e4646506f776572436f7265733437015820b6817cc908560a974136a66a14a33ca0827306a3559487eb34c3f3a0f58e568782583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a0074a212a1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a1504646506f776572436f7265733137323001021a0005668b031a0974514907582010d70a7bf1ff1ed57b4ac55c6ed323880724390905b3f69b92615166c3ac96990b58209337b517965948c514185958f26e8d55ca49ac21c946eb6f9b1e77d5a5b9c1960dd90102818258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac9020ed9010281581ca31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bc1082583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e1a0043f448111a00172b9912d90102818258201693c508b6132e89b932754d657d28b24068ff5ff1715fec36c010d4d6470b3d00a204d901029fd8799f9fd8799fd8799fd8799f581ca31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcffd8799fd8799fd8799f581cb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1effffffff1a007a1200ffd8799fd8799fd8799f581c5288ee085dc108f6fdc262b9e0cdfa92663b302836830efc0c5b4fdfffd8799fd8799fd8799f581c41ff84ecc10aae4f3ba8526ba742c739de9d513ace95e17170b1f04cffffffff1a000f4240ffff581cb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1effd8799f9fd8799fd8799fd8799f581c5288ee085dc108f6fdc262b9e0cdfa92663b302836830efc0c5b4fdfffd8799fd8799fd8799f581c41ff84ecc10aae4f3ba8526ba742c739de9d513ace95e17170b1f04cffffffff1a000f4240ffd8799fd8799fd8799f581ca31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcffd8799fd8799fd8799f581cb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1effffffff1a002dc6c0ffff581ca31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcffff05a182000082d87a80821a000205a91a02367e62f5a11902a2a1636d7367715761797570205472616e73616374696f6e"
]

Next steps:
1. Sign the transaction with your wallet
2. Submit the signed transaction using the /submit endpoint

*/