"use client";

import { useEffect, type ReactNode } from "react";

interface ReportSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  ariaLabel?: string;
  layer?: "default" | "top";
  children: ReactNode;
}

export default function ReportSlideOver({
  isOpen,
  onClose,
  eyebrow,
  title,
  ariaLabel = "Close panel",
  layer = "default",
  children,
}: ReportSlideOverProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 ${layer === "top" ? "z-[70]" : "z-[60]"}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        className="absolute inset-0 bg-[#1b2a22]/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside className="absolute right-0 top-0 flex h-full w-[min(100%,28rem)] flex-col border-l border-[#d9e7de] bg-[#f8fcf9] shadow-xl">
        <header className="flex items-center justify-between border-b border-[#e5ede7] px-4 py-4">
          <div>
            {eyebrow && (
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#527065]">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-1 text-lg font-extrabold text-[#1b2a22]">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d5e3da] text-[#4f6158] transition hover:bg-[#edf5ef]"
            aria-label="Close panel"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
