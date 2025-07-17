// This file contains utility functions that will be moved in anvil-api as endpoints
import { Buffer } from "node:buffer";

import { API_URL, HEADERS } from "./constant.ts";

export async function dateToSlot(date: Date) {
  try {
    const timeInMilliseconds = date.getTime();
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

export async function getKeyhash(bech32Address: string): Promise<string | undefined> {
  const response = await fetch(`${API_URL}/utils/addresses/parse`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ address: bech32Address }),
  });

  if (!response.ok) {
    console.error(`Failed to get key hash for address: ${bech32Address}`);
    return undefined;
  }

  const { payment } = await response.json();
  return payment;
}

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
    const errorText = await response.text();
    throw new Error(`API call failed: ${errorText}`);
  }

  const { policyId } = await response.json();

  return {
    type: "simple",
    script: policyScriptSchema,
    hash: policyId,
  };
}

export function bytesToHex(input: Uint8Array): string {
  return Buffer.from(input).toString("hex");
}

export async function getPolicyId(hexScript: string): Promise<string> {
  const response = await fetch(`${API_URL}/utils/native-scripts/parse`,
    {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ script: hexScript }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to parse native script: ${await response.text()}`);
  }

  const { policyId } = await response.json();
  return policyId;
}
