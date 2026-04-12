"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        closeButton
        position="top-right"
        richColors
        toastOptions={{
          duration: 3500,
        }}
      />
    </SessionProvider>
  );
}