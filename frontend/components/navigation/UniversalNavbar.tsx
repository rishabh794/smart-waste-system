"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#steps", label: "Steps" },
  { href: "/#contact", label: "Contact" },
];

const adminLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/status", label: "Status" },
  { href: "/create", label: "Create" },
  { href: "/admin/driver-stats", label: "Driver Stats" },
];

const driverLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/driver/stats", label: "My Stats" },
];

export default function UniversalNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const stableSession = isMounted && status !== "loading" ? session : null;

  const navLinks = stableSession?.user?.role === "admin"
    ? adminLinks
    : stableSession?.user?.role === "driver"
      ? driverLinks
      : publicLinks;

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      const result = await signOut({ redirect: false, callbackUrl: "/login" });
      toast.success("Signed out successfully.");
      router.push(result?.url ?? "/login");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign out right now. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const linkClass = (href: string) => {
    const isActive = href.startsWith("/#")
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
    return `relative px-2 py-1 text-sm font-semibold transition-colors after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[#197443] after:transition-transform ${
      isActive
        ? "text-[#197443] after:scale-x-100"
        : "text-[#4f6158] hover:text-[#197443]"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#d9e7de] bg-[#f8fcf9]/95 shadow-sm backdrop-blur">
      <div className="site-container">
        <div className="flex min-h-18 items-center justify-between gap-5">
          <div className="min-w-0">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold leading-none tracking-tight text-[#1a2a22]">
              <PlatformIcon />
              <span>SmartWaste.</span>
            </Link>
            <p className="mt-1 hidden text-xs font-medium text-[#607268] sm:block">
              {stableSession
                ? `Logged in as ${stableSession.user?.name} (${stableSession.user?.role})`
                : "Smart Waste Tracking And Route Coordination"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-4 lg:flex">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {!stableSession ? (
              <Link
                href="/login"
                className="btn-primary"
              >
                Login
              </Link>
            ) : (
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="btn-secondary btn-signout"
              >
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function PlatformIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#b8d4c0] bg-[#e8f4ec] text-[#1b6f3f]">
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
        <path
          d="M9.8 2.2L12.8 3.9L11.8 5.7"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.2 4.9L15.2 8.1L12.9 8.4"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.1 5.6L9.2 3.8L10.3 5.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.8 9.4L6.2 6.5L8 7.8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.2 13.9L7.1 15.7L6.1 13.9"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14.4 12.2L11.3 14L10.2 12.2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
