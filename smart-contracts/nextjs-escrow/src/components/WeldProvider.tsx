"use client";

import { WeldProvider, type WeldProviderProps } from "@ada-anvil/weld/react";

export function ClientWeldProvider({
  children,
  lastConnectedWallet,
}: {
  children: React.ReactNode;
  lastConnectedWallet?: NonNullable<
    WeldProviderProps["wallet"]
  >["tryToReconnectTo"];
}) {
  return (
    <WeldProvider
      updateInterval={30_000} // 30 seconds
      wallet={{ tryToReconnectTo: lastConnectedWallet }} // Restore wallet connection state
    >
      {children}
    </WeldProvider>
  );
}
