'use server'

import {
  Ed25519KeyHash,
  NativeScript,
  NativeScripts,
  ScriptAll,
  ScriptPubkey,
  TimelockExpiry,
} from "@emurgo/cardano-serialization-lib-asmjs-gc";

const { POLICY_KEY_HASH, POLICY_EXPIRATION_DATE, ANVIL_API_URL, ANVIL_API_KEY } = process.env;
const API_URL = ANVIL_API_URL || "https://preprod.api.ada-anvil.app/v2/services";
const HEADERS = {
  'Content-Type': 'application/json',
  'X-Api-Key': ANVIL_API_KEY || "",
};

/**
 * Convert a date to a Cardano slot number via Anvil API
 */
export async function dateToSlot(date: Date) {
  try {
    const timeInMilliseconds = date.getTime();
    const response = await fetch(`${API_URL}/utils/network/time-to-slot`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ time: timeInMilliseconds }),
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.slot;
  } catch (error) {
    console.error('Error in dateToSlot:', error);
    throw error;
  }
}

/**
 * Create or load policy configuration 
 * 
 * This function establishes the constraints for token minting:
 * - keyHash: Controls who can sign minting transactions
 * - slot: Defines the blockchain slot after which no more tokens can be minted
 * - policyId: A unique identifier derived from the policy script that permanently
 *   identifies all tokens minted under this policy
 */
export async function createOrLoadPolicy() {
  if (!POLICY_EXPIRATION_DATE || !POLICY_KEY_HASH) {
    throw new Error('POLICY_EXPIRATION_DATE or POLICY_KEY_HASH is not defined in environment variables');
  }
  
  const slot = await dateToSlot(new Date(POLICY_EXPIRATION_DATE));
  const keyHash = POLICY_KEY_HASH;
  
  if (!keyHash) {
    throw new Error('POLICY_KEY_HASH is not defined in environment variables');
  }
  
  const policy = await createPolicyScript(keyHash, slot, true);
  const policyId = Buffer.from(policy.mintScript.hash().to_bytes()).toString("hex");
  return { slot, keyHash, policyId };
}

/**
 * Create a policy script for minting tokens
 */
export async function createPolicyScript(
  policyKeyHash: string,
  ttl: number,
  withTimelock = true,
): Promise<{ mintScript: NativeScript; policyTTL: number }> {
  const scripts = NativeScripts.new();
  const keyHashScript = NativeScript.new_script_pubkey(
    ScriptPubkey.new(Ed25519KeyHash.from_hex(policyKeyHash)),
  );
  scripts.add(keyHashScript);

  const policyTTL: number = ttl;

  if (withTimelock) {
    const timelock = TimelockExpiry.new(policyTTL);
    const timelockScript = NativeScript.new_timelock_expiry(timelock);
    scripts.add(timelockScript);
  }

  const mintScript = NativeScript.new_script_all(ScriptAll.new(scripts));

  return { mintScript, policyTTL };
}
