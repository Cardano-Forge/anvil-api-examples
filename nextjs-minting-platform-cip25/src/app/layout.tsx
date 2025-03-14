import type { Metadata } from "next";
import ClientWeldProvider from "./components/ClientWeldProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cardano Mint Platform",
  description: "A platform for minting NFTs on the Cardano blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientWeldProvider>
          {children}
        </ClientWeldProvider>
      </body>
    </html>
  );
}