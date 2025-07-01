import WalletConnector from './components/WalletConnector';
import MintForm from './components/MintForm';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Cardano NFT Minting Platform
      </h1>
      
      <div className="max-w-2xl mx-auto">
        <WalletConnector />
        <MintForm />
      </div>
    </main>
  );
}