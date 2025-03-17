import type { Metadata } from "next";
import { ClientWeldProvider } from "./components/ClientWeldProvider";
import { cookies } from "next/headers";
import { STORAGE_KEYS } from "@ada-anvil/weld/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardano Mint Platform",
  description: "A platform for minting NFTs on the Cardano blockchain",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const wallet = cookieStore.get(STORAGE_KEYS.connectedWallet)?.value;
  const change = cookieStore.get(STORAGE_KEYS.connectedChange)?.value;
  const stake = cookieStore.get(STORAGE_KEYS.connectedStake)?.value;
  const lastConnectedWallet = wallet ? { wallet, change, stake } : undefined;

  return (
    <html lang="en">
      <body>
        <ClientWeldProvider lastConnectedWallet={lastConnectedWallet}>
          {children}
        </ClientWeldProvider>
      </body>
    </html>
  );
}