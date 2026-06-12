"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { hasMobileRoleNav } from "@/lib/navigationLinks";

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
    if (!hasMobileRoleNav(role) || isStandaloneMode()) {
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

  if (!deferredPrompt || isDismissed || !hasMobileRoleNav(role) || isStandaloneMode()) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 rounded-2xl border border-[#bfd5c5] bg-[#f8fcf9] p-4 shadow-lg lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm">
      <p className="text-sm font-extrabold text-[#1d3025]">Install Smart Waste</p>
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
