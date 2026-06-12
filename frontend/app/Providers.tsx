"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import NetworkStatusProvider from "@/components/offline/NetworkStatusProvider";
import PendingSyncBadge from "@/components/offline/PendingSyncBadge";
import InstallPrompt from "@/components/pwa/InstallPrompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NetworkStatusProvider>
        <PendingSyncBadge />
        {children}
        <InstallPrompt />
        <Toaster
          closeButton
          position="top-right"
          richColors
          toastOptions={{
            duration: 3500,
          }}
        />
      </NetworkStatusProvider>
    </SessionProvider>
  );
}