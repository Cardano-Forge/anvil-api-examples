import TransactionForm from "@/components/TransactionForm";
import WalletConnector from "@/components/WalletConnector";

export default function Home() {
  return (
    <main className="custom-border custom-rounded paper container-spacing flex w-300 flex-col gap-4 p-4">
      <WalletConnector />
      <TransactionForm />
    </main>
  );
}
