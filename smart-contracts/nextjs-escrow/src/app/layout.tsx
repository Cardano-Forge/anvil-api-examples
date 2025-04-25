import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ClientWeldProvider } from "@/components/WeldProvider";
import ReactQueryProvider from '@/components/ReactQueryProvider';
import { cookies } from "next/headers";
import { STORAGE_KEYS } from "@ada-anvil/weld/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cardano Smart Escrow",
  description: "Smart escrow solution for Cardano blockchain",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Retrieve wallet connection state from cookies for SSR
  const cookieStore = await cookies();
  const wallet = cookieStore.get(STORAGE_KEYS.connectedWallet)?.value;
  const changeAddress = cookieStore.get(STORAGE_KEYS.connectedChange)?.value;
  const stakeAddress = cookieStore.get(STORAGE_KEYS.connectedStake)?.value;
  const lastConnectedWallet = wallet ? { wallet, changeAddress, stakeAddress } : undefined;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white`}>
        {/* Wrap the application with the ClientWeldProvider for wallet connectivity */}
        <ReactQueryProvider>
          <ClientWeldProvider lastConnectedWallet={lastConnectedWallet}>
            {children}
          </ClientWeldProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
