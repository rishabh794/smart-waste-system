"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useNetworkStatus } from "@/components/offline/NetworkStatusProvider";
import { getNavLinksForRole, hasMobileRoleNav } from "@/lib/navigationLinks";

const isLinkActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export default function MobileRoleNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const { isOnline, pendingCount } = useNetworkStatus();

  if (!hasMobileRoleNav(role)) {
    return null;
  }

  const links = getNavLinksForRole(role);

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d9e7de] bg-[#f8fcf9]/95 backdrop-blur lg:hidden"
    >
      {(!isOnline || pendingCount > 0) && (
        <div className="flex items-center justify-center gap-2 border-b border-[#e6efe9] px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#5f7167]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-[#1a7b3a]" : "bg-[#d97706]"}`}
            aria-hidden="true"
          />
          {!isOnline ? "Offline mode" : "Online"}
          {pendingCount > 0 && <span className="text-[#197443]">{pendingCount} pending</span>}
        </div>
      )}
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {links.map((link) => {
          const active = isLinkActive(pathname, link.href);
          const label = link.shortLabel ?? link.label;

          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={`flex flex-col items-center justify-center rounded-lg px-2 py-2 text-center text-[0.68rem] font-extrabold uppercase tracking-[0.08em] transition ${
                  active
                    ? "bg-[#e8f5ed] text-[#197443]"
                    : "text-[#5f7167] hover:bg-[#f1f8f3] hover:text-[#197443]"
                }`}
              >
                <NavIcon href={link.href} active={active} />
                <span className="mt-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NavIcon({ href, active }: { href: string; active: boolean }) {
  const color = active ? "#197443" : "#7a8b81";

  if (href === "/report") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M10 4V16M6 8H14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.6" />
      </svg>
    );
  }

  if (href === "/reports") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M6 5H14V15H6V5Z" stroke={color} strokeWidth="1.6" />
        <path d="M8 8H12M8 11H12" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (href === "/driver/stats") {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
        <path d="M5 14L8 10L11 12L15 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 16H16" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 8L10 4L16 8V15H4V8Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
