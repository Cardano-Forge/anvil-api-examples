'use server'

const { POLICY_KEY_HASH, POLICY_EXPIRATION_DATE } = process.env;
const API_URL = "https://preprod.api.ada-anvil.app/v2/services";
const HEADERS = {
  "Content-Type": "application/json",
};

/**
 * Convert a date to a Cardano slot number
 */
export async function timeToSlot(date: Date): Promise<number> {
  // Current slot number (1655683200) is for PreProd network. Update your value accordingly.
  // Mainnet: 1591566291
  // Preview: 1666656182
  // Preprod: 1655683200
  const currentSlot = 1655683200 + 4924800;
  return Math.floor(date.getTime() / 1000) - currentSlot;
}

/**
 * Create or load policy configuration 
 * 
 * This function establishes the constraints for token minting:
 * - keyHash: Controls who can sign minting transactions
 * - slot: Defines the blockchain slot after which no more tokens can be minted
 * - policyId: A unique identifier derived from the native script that permanently
 *   identifies all tokens minted under this policy
 */
export async function createOrLoadPolicy() {
  if (!POLICY_EXPIRATION_DATE || !POLICY_KEY_HASH) {
    throw new Error('POLICY_EXPIRATION_DATE or POLICY_KEY_HASH is not defined in environment variables');
  }
  
  const slot = await timeToSlot(new Date(POLICY_EXPIRATION_DATE));
  const keyHash = POLICY_KEY_HASH;
  
  if (!keyHash) {
    throw new Error('POLICY_KEY_HASH is not defined in environment variables');
  }
  
  const policy = await createNativeScript(keyHash, slot, true);
  const policyId = policy.hash;
  return { slot, keyHash, policyId };
}

/**
 * Create a native script for minting tokens using Anvil API
 * 
 * See https://dev.ada-anvil.io/guides/nft-and-ft/native-scripts
 * This guide tells you about Native Scripts and how to format them
 */
export async function createNativeScript(
  keyHash: string,
  ttl: number,
  with_timelock = true,
): Promise<{ type: string; script: object; hash: string }> {
  const baseScript = { type: "sig", keyHash };
  let policyScriptSchema: any;

  if (with_timelock) {
    policyScriptSchema = {
      type: "all",
      scripts: [baseScript, { type: "before", slot: ttl }],
    };
  } else {
    policyScriptSchema = baseScript;
  }

  const body = JSON.stringify({ schema: policyScriptSchema });

  const response = await fetch(`${API_URL}/utils/native-scripts/serialize`, {
    method: "POST",
    headers: HEADERS,
    body,
  });

  if (!response.ok) {
    throw new Error(`Failed to create native script: ${await response.text()}`);
  }

  const { policyId } = await response.json();

  return {
    type: "simple",
    script: policyScriptSchema,
    hash: policyId,
  };
}
