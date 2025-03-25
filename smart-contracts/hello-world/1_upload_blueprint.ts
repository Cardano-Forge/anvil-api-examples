import { Buffer } from "node:buffer";
import {
  FixedTransaction,
  PrivateKey,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1"; // only required due to signing in the backend.

import blueprint from "./aiken-hello-world/plutus.json" with { type: "json" };
import customer from "./customer.json" with { type: "json" };

import { API_URL, HEADERS } from "../../utils/constant.ts";

function getValidators(validators: typeof blueprint.validators) {
  return [
    ...validators
      .reduce(
        (a, b) => a.set(b.hash, b) && a,
        new Map<string, (typeof blueprint.validators)[number]>(),
      )
      .values(),
  ];
}

const blueprintRegistration = await fetch(`${API_URL}/blueprints`, {
  method: "POST",
  headers: HEADERS,
  body: JSON.stringify({ blueprint }),
});

const uploadedBlueprint = await blueprintRegistration.json();
console.debug("uploadedBlueprint", JSON.stringify(uploadedBlueprint, null, 2));

const { scriptAddresses } = uploadedBlueprint;

const contract = {
  changeAddress: customer.base_address_preprod,
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
  PrivateKey.from_bech32(customer.skey),
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
