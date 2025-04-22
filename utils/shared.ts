// This file contains utility functions that will be moved in anvil-api as endpoints

import { Buffer } from "node:buffer";
import {
  Address,
  BaseAddress,
  type Ed25519KeyHash,
  NativeScript,
  NativeScripts,
  ScriptAll,
  ScriptPubkey,
  TimelockExpiry,
} from "npm:@emurgo/cardano-serialization-lib-nodejs@14.1.1";

import { API_URL, HEADERS } from "./constant.ts";

// Note: Tested on mainnet

export async function dateToSlot(date: Date) {
  try {
    // Convert the date to a Unix timestamp in milliseconds
    const timeInMilliseconds = date.getTime();
    
    // Call the Anvil API
    const response = await fetch(`${API_URL}/utils/network/time-to-slot`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ time: timeInMilliseconds }),
    });
    
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    return data.slot;
  } catch (error) {
    console.error('Error in dateToSlot:', error);
    throw error;
  }
}

export function getKeyhash(bech32Address: string): Ed25519KeyHash | undefined {
  return BaseAddress.from_address(Address.from_bech32(bech32Address))
    ?.payment_cred()
    .to_keyhash();
}

export function createPolicyScript(
  policy_key_hash: Ed25519KeyHash,
  ttl: number,
  with_timelock = true,
): { mint_script: NativeScript; policy_ttl: number } {
  const scripts = NativeScripts.new();
  const key_hash_script = NativeScript.new_script_pubkey(
    ScriptPubkey.new(policy_key_hash),
  );
  scripts.add(key_hash_script);

  const policy_ttl: number = ttl;

  if (with_timelock) {
    const timelock = TimelockExpiry.new(policy_ttl);
    const timelock_script = NativeScript.new_timelock_expiry(timelock);
    scripts.add(timelock_script);
  }

  const mint_script = NativeScript.new_script_all(ScriptAll.new(scripts));

  return { mint_script, policy_ttl };
}

export function bytesToHex(input: Uint8Array): string {
  return Buffer.from(input).toString("hex");
}

export function getPolicyId(mint_script: NativeScript): string {
  return bytesToHex(mint_script.hash().to_bytes());
}
