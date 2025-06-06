/**
 * Main dashboard page for the Cardano Smart Escrow application
 * Displays wallet connector and escrow functionality
 */

import WalletConnector from "@/components/WalletConnector";
import LockFundsForm from "@/components/LockFundsForm";
import MyTransactions from "@/components/MyTransactions";

export default function Page() {
  return (
    <main className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-black">Cardano Smart Escrow</h1>
      <WalletConnector />
      <LockFundsForm />
      <MyTransactions />
    </main>
  );
}
