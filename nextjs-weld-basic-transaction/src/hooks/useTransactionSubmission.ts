"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@ada-anvil/weld/react";

// Transaction states for managing the flow
export type TransactionStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "success"
  | "error";

export interface TransactionParams {
  recipient: string;
  ada: number;
}

export function useTransactionSubmission() {
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wallet = useWallet();

  const submitTransaction = useCallback(
    async ({ recipient, ada }: TransactionParams) => {
      // Convert ADA to lovelace (1 ADA = 1,000,000 lovelace)
      const lovelace = Math.floor(ada * 1_000_000);

      try {
        // Reset states
        setError(null);
        setTxHash(null);
        setStatus("building");

        // Validate wallet connection
        if (
          !wallet.isConnected ||
          !wallet.changeAddressBech32 ||
          !wallet.handler
        ) {
          throw new Error("Please connect your wallet first");
        }

        // Step 1: Build transaction
        const buildResponse = await fetch("/api/transaction/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            changeAddress: wallet.changeAddressBech32,
            utxos: await wallet.handler.getUtxos(),
            outputs: [{ address: recipient, lovelace }],
          }),
        });

        if (!buildResponse.ok) {
          const errorData = await buildResponse.json();
          throw new Error(errorData.error || "Failed to build transaction");
        }

        const buildData = await buildResponse.json();

        // Step 2: Sign transaction
        setStatus("signing");
        const signature = await wallet.handler.signTx(buildData.complete);

        if (!signature) {
          throw new Error("Failed to sign transaction");
        }

        // Step 3: Submit transaction
        setStatus("submitting");
        const submitResponse = await fetch("/api/transaction/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction: buildData.complete,
            signatures: [signature],
          }),
        });

        if (!submitResponse.ok) {
          const errorData = await submitResponse.json();
          throw new Error(errorData.error || "Failed to submit transaction");
        }

        const submitData = await submitResponse.json();

        setTxHash(submitData.hash);
        setStatus("success");
        return submitData.hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
        return null;
      }
    },
    [wallet],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  return {
    status,
    txHash,
    error,
    submitTransaction,
    reset,
    isProcessing:
      status !== "idle" && status !== "error" && status !== "success",
  };
}
