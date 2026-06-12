"use client";

import { useNetworkStatus } from "@/components/offline/NetworkStatusProvider";

export default function PendingSyncBadge() {
  const { isOnline, isSyncing, pendingCount } = useNetworkStatus();

  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4 lg:top-[4.5rem]"
      aria-live="polite"
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-[#bfd5c5] bg-[#f8fcf9]/95 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1d3025] shadow-sm backdrop-blur">
        <span
          className={`h-2 w-2 rounded-full ${isOnline ? "bg-[#1a7b3a]" : "bg-[#d97706]"}`}
          aria-hidden="true"
        />
        {!isOnline ? "Offline" : "Online"}
        {isSyncing && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5ed] px-2 py-0.5 text-[0.65rem] text-[#197443]">
            <SyncSpinner />
            Syncing
          </span>
        )}
        {!isSyncing && pendingCount > 0 && (
          <span className="rounded-full bg-[#e8f5ed] px-2 py-0.5 text-[0.65rem] text-[#197443]">
            {pendingCount} pending
          </span>
        )}
      </div>
    </div>
  );
}

function SyncSpinner() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3 w-3 animate-spin"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" className="opacity-25" />
      <path
        d="M17 10a7 7 0 0 0-7-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
