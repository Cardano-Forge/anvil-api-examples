// API endpoint for Wayup Marketplace
const BASE_URL = "https://prod.api.ada-anvil.app/marketplace/api";

// NFT Collection to purchase from
const POLICY_ID = "6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01";

// Wallet address to receive change and NFT
const BUYER_CHANGE_ADDRESS = "addr1qx33ycd2ymg02dxh6vnnf8dsk54l8ranr9cfjk9qrlj3309c69jc4n8h3uvnczncaqu2sm03pl99h99n75uvtl3mhv0q3z8s8m";

// UTXOs from your wallet to fund the transaction
const BUYER_UTXOS: string[] = [
  "828258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac90182583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a001344eea1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a24f4646506f776572436f72657336323901504646506f776572436f7265733132343801",
  "828258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac90282583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e1a005b1fe1",
  "82825820daac1d3b80dcab8817c2f02f2d43ab2b33a4e74419679939eb8aa5f70b03f35c0182583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a007a089da1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a1504646506f776572436f7265733137323001"
];

interface AssetResult {
  policyId: string;
  assetName: string;
  listing?: {
    txHashIndex: string;
    price: number;
  } | null;
}

// Step 1: Define the API request to find the cheapest listing
const url = `${BASE_URL}/get-collection-assets?policyId=${POLICY_ID}&saleType=listedOnly&orderBy=priceAsc&limit=1`;

// Step 2: Fetch the listing
const response = await fetch(url);
const json = await response.json();
const results: AssetResult[] = json?.results ?? [];
const listing = results[0];

if (!listing.listing) {
  throw new Error("No listing found");
}

console.log(`Found asset: ${listing.assetName} | Price: ${listing.listing.price} lovelace`);

// Step 3: Create the purchase payload
const buyPayload = {
  changeAddress: BUYER_CHANGE_ADDRESS,
  utxos: BUYER_UTXOS,
  buy: [
    {
      policyId: listing.policyId,
      txHashIndex: listing.listing.txHashIndex,

      // 1 ADA = 1_000_000 lovelace
      priceAda: listing.listing.price / 1_000_000,
    },
  ],
};

console.log(buyPayload);

// Step 4: Build the transaction
const txResponse = await fetch(`${BASE_URL}/build-tx`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(buyPayload),
});

const txResult = await txResponse.json();
console.log("Transaction:", txResult.transactions);

// Next steps: Sign the hex with your wallet and submit via /submit endpoint

// Run this with: deno run --allow-net purchase-nft-test.ts

/*
Output:

Found asset: 4646506f776572436f7265733437 | Price: 5000000 lovelace
{
  changeAddress: "addr1qx33ycd2ymg02dxh6vnnf8dsk54l8ranr9cfjk9qrlj3309c69jc4n8h3uvnczncaqu2sm03pl99h99n75uvtl3mhv0q3z8s8m",
  utxos: [
    "828258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac90182583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a001344eea1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a24f4646506f776572436f72657336323901504646506f776572436f7265733132343801",
    "828258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac90282583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e1a005b1fe1",
    "82825820daac1d3b80dcab8817c2f02f2d43ab2b33a4e74419679939eb8aa5f70b03f35c0182583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a007a089da1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a1504646506f776572436f7265733137323001"
  ],
  buy: [
    {
      policyId: "6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01",
      txHashIndex: "4baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac9#0",
      priceAda: 5
    }
  ]
}
Transaction: [
  "84aa00d90102838258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac9008258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac902825820daac1d3b80dcab8817c2f02f2d43ab2b33a4e74419679939eb8aa5f70b03f35c010184a30058393184cc25ea4c29951d40b443b95bbc5676bc425470f96376d1984af9ab2c967f4bd28944b06462e13c5e3f5d5fa6e03f8567569438cd833e6d011a0011a008028201d81858225820c7dc7a987b9367993b617821ad64c3506b9015de1744270000a97a8d84e56df0825839015288ee085dc108f6fdc262b9e0cdfa92663b302836830efc0c5b4fdf41ff84ecc10aae4f3ba8526ba742c739de9d513ace95e17170b1f04c1a000f424082583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e1a002dc6c082583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e821a00955df2a1581c6fb0ce0d80bce539333b0b16f4a29a0d40c786249f86850d3a36fa01a24e4646506f776572436f726573343701504646506f776572436f7265733137323001021a000562fc031a09744dc407582010d70a7bf1ff1ed57b4ac55c6ed323880724390905b3f69b92615166c3ac96990b5820ff02484b059bcb0f3c47368c465fa38ebedabae6561eadf02f1eba621f963c470dd90102818258204baa167631a62343cc4f37f9313ee05d6149b1fda39fd563e12832c8dd49fac9021082583901a31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1e1a0043fdbf111a0017222212d90102818258201693c508b6132e89b932754d657d28b24068ff5ff1715fec36c010d4d6470b3d00a204d901029fd8799f9fd8799fd8799fd8799f581c5288ee085dc108f6fdc262b9e0cdfa92663b302836830efc0c5b4fdfffd8799fd8799fd8799f581c41ff84ecc10aae4f3ba8526ba742c739de9d513ace95e17170b1f04cffffffff1a000f4240ffd8799fd8799fd8799f581ca31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcffd8799fd8799fd8799f581cb8d1658accf78f193c0a78e838a86df10fca5b94b3f538c5fe3bbb1effffffff1a002dc6c0ffff581ca31261aa26d0f534d7d327349db0b52bf38fb319709958a01fe518bcffff05a182000082d8799f00ff821a000377541a04c44bfcf5a11902a2a1636d7367715761797570205472616e73616374696f6e"
]
 */