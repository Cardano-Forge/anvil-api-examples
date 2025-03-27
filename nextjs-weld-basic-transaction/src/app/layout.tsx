import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClientWeldProvider } from "@/components/WeldProvider";
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
  title: "Cardano Transaction App",
  description: "Send Cardano transactions using the Anvil API",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientWeldProvider lastConnectedWallet={lastConnectedWallet}>
          {children}
        </ClientWeldProvider>
      </body>
    </html>
  );
}
