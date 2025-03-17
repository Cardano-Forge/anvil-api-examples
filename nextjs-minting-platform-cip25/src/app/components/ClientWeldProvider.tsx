'use client';

import {
  WeldProvider as DefaultWeldProvider,
  type WeldProviderProps,
} from "@ada-anvil/weld/react";

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
    <DefaultWeldProvider
      updateInterval={30_000}
      customWallets={{ blacklist: ["nufiSnap"] }}
      wallet={{ tryToReconnectTo: lastConnectedWallet }}
    >
      {children}
    </DefaultWeldProvider>
  );
}
