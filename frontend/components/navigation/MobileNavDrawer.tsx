"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { NavLink } from "@/lib/navigationLinks";

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  links: NavLink[];
  pathname: string;
  sessionLabel?: string;
  onSignOut?: () => void;
  isSigningOut?: boolean;
  showAuthActions?: boolean;
}

const isLinkActive = (pathname: string, href: string) => {
  if (href.startsWith("/#")) return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function MobileNavDrawer({
  isOpen,
  onClose,
  links,
  pathname,
  sessionLabel,
  onSignOut,
  isSigningOut = false,
  showAuthActions = false,
}: MobileNavDrawerProps) {
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
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0 bg-[#1b2a22]/40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <nav className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-[#d9e7de] bg-[#f8fcf9] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e5ede7] px-4 py-4">
          <p className="text-sm font-extrabold text-[#1b2a22]">Menu</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d5e3da] text-[#4f6158] transition hover:bg-[#edf5ef]"
            aria-label="Close navigation menu"
          >
            <CloseIcon />
          </button>
        </div>

        {sessionLabel ? (
          <p className="border-b border-[#e5ede7] px-4 py-3 text-xs font-medium text-[#607268]">
            {sessionLabel}
          </p>
        ) : null}

        <ul className="flex-1 space-y-1 overflow-y-auto p-3">
          {links.map((link) => {
            const active = isLinkActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[#e8f5ed] text-[#197443]"
                      : "text-[#4f6158] hover:bg-[#f1f8f3] hover:text-[#197443]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="space-y-2 border-t border-[#e5ede7] p-3">
          {showAuthActions ? (
            <>
              <Link href="/login/citizen" onClick={onClose} className="btn-secondary block w-full text-center">
                Citizen Login
              </Link>
              <Link href="/login/staff" onClick={onClose} className="btn-primary block w-full text-center">
                Staff Login
              </Link>
            </>
          ) : onSignOut ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSignOut();
              }}
              disabled={isSigningOut}
              className="btn-secondary btn-signout w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          ) : null}
        </div>
      </nav>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
