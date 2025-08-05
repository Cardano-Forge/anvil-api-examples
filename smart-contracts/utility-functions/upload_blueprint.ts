/**
 * Generic Blueprint Upload Utility
 * 
 * This utility uploads smart contract blueprints to the Anvil API and deploys them on-chain.
 * It can be used from any contract directory by specifying the correct file paths.
 * 
 * USAGE:
 * deno run --allow-net --allow-read upload_blueprint.ts --blueprint=<path> --wallet=<path>
 * 
 * PARAMETERS:
 * --blueprint: Path to the plutus.json file (default: ./plutus.json)
 * --wallet: Path to the wallet JSON file (default: ./admin.json)
 * --network: Target network for deployment (default: preprod, options: preview, preprod, mainnet)
 * 
 * REQUIREMENTS:
 * - Blueprint file must contain validators array
 * - Wallet file must contain base_address_preprod/base_address_mainnet and skey fields
 * - Network access for Anvil API calls
 */
import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { X_API_KEY } from "../../utils/constant.ts";

// Parse command line arguments
const args = parseArgs(Deno.args, {
  string: ["blueprint", "wallet", "network"],
  default: {
    blueprint: "./plutus.json",
    wallet: "./admin.json",
    network: "preprod",
  },
});

// Validate required arguments
if (!args.blueprint || !args.wallet) {
  console.error("Usage: deno run --allow-net --allow-read upload_blueprint.ts --blueprint=<path> --wallet=<path> --network=<network>");
  console.error("Example: deno run --allow-net --allow-read upload_blueprint.ts --blueprint=./plutus.json --wallet=./admin.json --network=preprod");
  Deno.exit(1);
}

// Validate network parameter
const validNetworks = ["preview", "preprod", "mainnet"];
if (!validNetworks.includes(args.network)) {
  console.error(`Invalid network: ${args.network}. Valid options are: ${validNetworks.join(", ")}`);
  Deno.exit(1);
}

// Map network names to URL prefixes
const networkUrlMap: Record<string, string> = {
  preview: "preview",
  preprod: "preprod", 
  mainnet: "prod"
};

// Construct API URL and headers based on selected network
const urlPrefix = networkUrlMap[args.network];
const API_URL = `https://${urlPrefix}.api.ada-anvil.app/v2/services`;
const HEADERS = {
  "Content-Type": "application/json",
  "x-api-key": X_API_KEY,
};

// Load blueprint and wallet data from specified paths
console.log(`Loading blueprint from: ${args.blueprint}`);
const blueprint = JSON.parse(Deno.readTextFileSync(args.blueprint));
console.log(`Loading wallet from: ${args.wallet}`);
const admin = JSON.parse(Deno.readTextFileSync(args.wallet));

// Select the appropriate wallet address based on network
const walletAddressField = `base_address_${args.network}`;
const walletAddress = admin[walletAddressField];

if (!walletAddress) {
  console.error(`Wallet does not contain address for network '${args.network}'. Expected field: ${walletAddressField}`);
  Deno.exit(1);
}

console.log(`✅ Successfully loaded blueprint with ${blueprint.validators?.length || 0} validators`);
console.log(`✅ Successfully loaded wallet for ${args.network} network`);
console.log(`✅ Using API URL: ${API_URL}`);

async function main() {

  function getValidators(validators: typeof blueprint.validators) {
    const result = [
      ...validators
        .reduce(
          (a: Map<string, (typeof blueprint.validators)[number]>, b: (typeof blueprint.validators)[number]) => a.set(b.hash, b) && a,
          new Map<string, (typeof blueprint.validators)[number]>(),
        )
        .values(),
    ];
    
    return result;
  }

  console.log("API_URL", API_URL);
  const blueprintRegistration = await fetch(`${API_URL}/blueprints`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ blueprint }),
  });

  const uploadedBlueprint = await blueprintRegistration.json();
  console.debug("uploadedBlueprint", JSON.stringify(uploadedBlueprint, null, 2));

  const { scriptAddresses } = uploadedBlueprint;
  console.log("scriptAddresses:", JSON.stringify(scriptAddresses, null, 2));

  const contract = {
    changeAddress: walletAddress,
    message: "Smart contract deployed using anvil API",
    outputs: getValidators(blueprint.validators).map((validator) => ({
      address: scriptAddresses[validator.hash],
      datum: {
        type: "script",
        hash: validator.hash,
      },
    })),
  };

  const contractDeployed = await fetch(`${API_URL}/transactions/build`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(contract),
  });

  const contractToDeployTransaction = await contractDeployed.json();
  console.log(
    "contractToDeployTransaction",
    JSON.stringify(contractToDeployTransaction),
  );

  // Sign the transaction using CSL.
  const txToSubmitOnChain = FixedTransaction.from_bytes(
    Buffer.from(contractToDeployTransaction.complete, "hex"),
  );
  txToSubmitOnChain.sign_and_add_vkey_signature(
    PrivateKey.from_bech32(admin.skey),
  );

  console.log(txToSubmitOnChain.transaction_hash().to_hex());

  const urlSubmit = `${API_URL}/transactions/submit`;
  const submitted = await fetch(urlSubmit, {
    method: "POST",
    body: JSON.stringify({
      signatures: [], // no signature required as it is part of the `txToSubmitOnChain`.
      transaction: txToSubmitOnChain.to_hex(),
    }),
    headers: HEADERS,
  });

  const response = await submitted.json();
  console.debug("response", response);

  const { txHash } = response;

  const linkBlueprintAndTxHash = await fetch(`${API_URL}/blueprints`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      blueprint,
      refs: getValidators(blueprint.validators).reduce(
        (a, b, index) => {
          a[b.hash] = { txHash, index };
          return a;
        },
        {} as Record<string, { txHash: string; index: number }>,
      ),
    }),
  });

  const updatedBlueprint = await linkBlueprintAndTxHash.json();
  console.log("updatedBlueprint", updatedBlueprint);
}

// Execute the main function
main().catch(error => {
  console.error("Error executing script:", error);
  process.exit(1);
});
