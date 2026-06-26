"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const DISMISS_KEY = "smart-waste-pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandaloneMode = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)));

export default function InstallPrompt() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsDismissed(localStorage.getItem(DISMISS_KEY) === "true");
  }, []);

  useEffect(() => {
    if (isStandaloneMode()) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, [role]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || isStandaloneMode()) {
    return null;
  }

  if (isDismissed) {
    return (
      <button
        onClick={handleInstall}
        className="fixed bottom-20 right-4 z-50 flex items-center justify-center gap-2 rounded-full border border-[#bfd5c5] bg-[#f8fcf9] px-4 py-2 text-sm font-bold text-[#1a7b3a] shadow-lg lg:bottom-6 lg:right-6 hover:bg-[#e4ece6] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        Install App
      </button>
    );
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 rounded-2xl border border-[#bfd5c5] bg-[#f8fcf9] p-4 shadow-lg lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm">
      <p className="text-sm font-extrabold text-[#1d3025]">Install EcoSync</p>
      <p className="mt-1 text-sm text-[#5f7167]">
        Add to your home screen for faster access and offline support in the field.
      </p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={handleInstall} className="btn-primary flex-1">
          Install
        </button>
        <button type="button" onClick={handleDismiss} className="btn-secondary flex-1">
          Not now
        </button>
      </div>
    </div>
  );
}
