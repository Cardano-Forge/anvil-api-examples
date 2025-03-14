'use client';
import { WeldProvider } from '@ada-anvil/weld/react';

interface ClientWeldProviderProps {
  children: React.ReactNode;
}

export default function ClientWeldProvider({ children }: ClientWeldProviderProps) {
  return (
    <WeldProvider
      extensions={{
        updateOnWindowFocus: true,
        updateInterval: 30000, // Update wallet extensions every 30 seconds
      }}
      customWallets={{ blacklist: ["nufiSnap"] }}
    >
      {children}
    </WeldProvider>
  );
}
