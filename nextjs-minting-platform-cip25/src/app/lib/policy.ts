import {
  Ed25519KeyHash,
  NativeScript,
  NativeScripts,
  ScriptAll,
  ScriptPubkey,
  TimelockExpiry,
} from "@emurgo/cardano-serialization-lib-asmjs";

const POLICY_KEY_HASH = process.env.POLICY_KEY_HASH;
const EXPIRATION_DATE = '2030-01-01';

export function dateToSlot(date: Date): number {
  return Math.floor(date.getTime() / 1000) - 1596491091 + 4924800;
}

export function createOrLoadPolicy() {
  const slot = dateToSlot(new Date(EXPIRATION_DATE));
  const keyHash = POLICY_KEY_HASH;
  
  if (!keyHash) {
    throw new Error('POLICY_KEY_HASH is not defined in environment variables');
  }
  
  const policy = createPolicyScript(keyHash, slot, true);
  const policyId = Buffer.from(policy.mintScript.hash().to_bytes()).toString("hex");
  return { slot, keyHash, policyId };
}

export function createPolicyScript(
  policyKeyHash: string,
  ttl: number,
  withTimelock = true,
): { mintScript: NativeScript; policyTTL: number } {
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
