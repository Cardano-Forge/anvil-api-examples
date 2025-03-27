"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@ada-anvil/weld/react";
import { useTransactionSubmission } from "@/hooks/useTransactionSubmission";
const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "preprod";

export default function TransactionForm() {
  // Form state
  const [recipient, setRecipient] = useState("");
  const [adaAmount, setAdaAmount] = useState(0);

  // Use our custom hook for transaction management
  const {
    status,
    txHash,
    error,
    submitTransaction,
    reset: resetTransaction,
  } = useTransactionSubmission();

  // Get wallet information from the Weld hook
  const wallet = useWallet();

  // Handle the transaction submission process
  const handleSendTransaction = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await submitTransaction({ recipient, ada: adaAmount });
    },
    [submitTransaction, recipient, adaAmount],
  );

  // Render success state if transaction completed
  if (status === "success" && txHash) {
    return (
      <section className="paper">
        <h2>Transaction Successful</h2>
        <span>Transaction ID:</span>
        <br />
        <a
          href={`https://${NETWORK}.cexplorer.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="break mt-1 font-mono text-sm text-blue-600 underline"
        >
          <b>{txHash}</b>
        </a>
        <div className="mt-6">
          <button onClick={resetTransaction} className="btn">
            Send Another
          </button>
        </div>
      </section>
    );
  }

  function getButtonText() {
    if (status === "building") return "Building...";
    if (status === "signing") return "Signing...";
    if (status === "submitting") return "Submitting...";
    if (adaAmount === 0) return "Send ADA";
    return `Send ${adaAmount} ADA`;
  }

  const isFormDisabled =
    !wallet.isConnected || (status !== "idle" && status !== "error");

  // Render transaction form
  return (
    <section className="paper">
      <h2>Send Transaction</h2>
      <form onSubmit={handleSendTransaction}>
        {/* Wallet connection status */}
        {!wallet.isConnected && (
          <div className="break mb-2 text-red-600">
            Please connect your wallet first.
          </div>
        )}

        {/* Recipient address input */}
        <input
          className="custom-rounded mb-2"
          name="recipient"
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          type="text"
          placeholder="Recipient Address"
          required
          disabled={isFormDisabled}
        />

        {/* ADA amount input */}
        <div className="mb-4">
          <input
            className="custom-rounded"
            name="ada-amount"
            id="ada-amount"
            value={adaAmount || ""}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              setAdaAmount(isNaN(value) ? 0 : value);
            }}
            type="number"
            min="1"
            step="1"
            placeholder="Amount (ADA)"
            required
            disabled={isFormDisabled}
          />
        </div>

        {/* Submit button */}
        <button type="submit" className="btn" disabled={isFormDisabled}>
          {getButtonText()}
        </button>

        {error && (
          <div className="break mt-2 text-red-600">
            <strong>Error:</strong> {error}
          </div>
        )}
      </form>
    </section>
  );
}
