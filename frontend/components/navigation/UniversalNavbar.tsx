"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import MobileNavDrawer from "@/components/navigation/MobileNavDrawer";
import { getNavLinksForRole } from "@/lib/navigationLinks";
import { clearOfflineDb } from "@/lib/offline/db";
import { getRoleLabel } from "@/lib/roles";

/**
 * Normalizes window.location.hash to always return a clean single-segment
 * hash like "#drivers". Handles edge cases like "#drivers#drivers" that can
 * occur when Next.js Link re-navigates to the same hash URL.
 */
function normalizeHash(raw: string): string {
  if (!raw || raw === "#") return "";
  const withoutLeading = raw.startsWith("#") ? raw.slice(1) : raw;
  const firstSegment = withoutLeading.split("#")[0];
  return firstSegment ? `#${firstSegment}` : "";
}

export default function UniversalNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [activeHash, setActiveHash] = useState("");

  // Mount + hash event listeners
  useEffect(() => {
    setIsMounted(true);
    setActiveHash(normalizeHash(window.location.hash));

    const updateHash = () => setActiveHash(normalizeHash(window.location.hash));

    // hashchange fires for same-page hash navigation
    window.addEventListener("hashchange", updateHash);
    // popstate fires for browser back/forward through hash history
    window.addEventListener("popstate", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, []);

  // Re-sync hash whenever the pathname changes (e.g. navigating away and back)
  useEffect(() => {
    if (isMounted) {
      setActiveHash(normalizeHash(window.location.hash));
    }
  }, [pathname, isMounted]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isSessionLoading = !isMounted || status === "loading";
  const stableSession = isSessionLoading ? null : session;
  const navLinks = getNavLinksForRole(stableSession?.user?.role);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      await clearOfflineDb();
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

  /**
   * Immediately update activeHash on click so the underline moves
   * right away — without waiting for hashchange/popstate to fire.
   * This is the primary fix: Next.js Link doesn't always fire hashchange.
   */
  const handleNavClick = (href: string) => {
    if (href.startsWith("/#")) {
      setActiveHash(href.slice(1)); // "/#drivers" → "#drivers"
    } else if (href.startsWith("#")) {
      setActiveHash(href);          // "#drivers"  → "#drivers"
    } else if (href === "/") {
      setActiveHash("");
    } else {
      // Regular path — clear hash so hash-based links deactivate
      setActiveHash("");
    }
  };

  const checkIsActive = (href: string) => {
    // Hash links anchored to root: "/#drivers"
    if (href.startsWith("/#")) {
      return pathname === "/" && activeHash === href.slice(1);
    }
    // Bare hash links: "#drivers"
    if (href.startsWith("#")) {
      return pathname === "/" && activeHash === href;
    }
    // Root with no hash
    if (href === "/") {
      return pathname === "/" && !activeHash;
    }
    // Regular path links
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const sessionLabel = stableSession
    ? `Logged in as ${stableSession.user?.name} (${getRoleLabel(stableSession.user?.role)})`
    : undefined;

  const logoHref = stableSession ? "/dashboard" : "/";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#d9e7de] bg-[#f8fcf9]/95 shadow-sm backdrop-blur">
        <div className="site-container">
          <div className="flex min-h-16 items-center justify-between gap-3 sm:min-h-18 sm:gap-5">
            <div className="min-w-0">
              <Link
                href={logoHref}
                className="inline-flex items-center gap-2 text-xl font-extrabold leading-none tracking-tight text-[#1a2a22] sm:text-2xl"
              >
                <PlatformIcon />
                <span>EcoSync.</span>
              </Link>
              <p className="mt-1 hidden text-xs font-medium text-[#607268] sm:block">
                {isSessionLoading ? (
                  <span className="inline-block h-3 w-56 max-w-full animate-pulse rounded bg-[#e6efe9]" />
                ) : stableSession ? (
                  sessionLabel
                ) : (
                  "EcoSync Tracking And Route Coordination"
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isSessionLoading ? (
                <div className="hidden items-center gap-3 lg:flex">
                  <span className="h-4 w-16 animate-pulse rounded bg-[#e6efe9]" />
                  <span className="h-4 w-20 animate-pulse rounded bg-[#e6efe9]" />
                  <span className="h-4 w-16 animate-pulse rounded bg-[#e6efe9]" />
                </div>
              ) : (
                <nav
                  className="hidden items-center gap-2 lg:flex"
                  onMouseLeave={() => setHoveredPath(null)}
                >
                  {navLinks.map((link) => {
                    const isActive = checkIsActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`relative px-3 py-1.5 text-sm font-semibold transition-colors ${isActive
                          ? "text-[#197443]"
                          : "text-[#4f6158] hover:text-[#197443]"
                          }`}
                        onMouseEnter={() => setHoveredPath(link.href)}
                        onClick={() => handleNavClick(link.href)}
                      >
                        <span className="relative z-10">{link.label}</span>

                        {isActive && (
                          <motion.div
                            layoutId="navbar-active"
                            className="absolute bottom-0 left-0 h-[2px] w-full bg-[#197443]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}

                        {hoveredPath === link.href && !isActive && (
                          <motion.div
                            layoutId="navbar-hover"
                            className="absolute inset-0 z-0 rounded-md bg-[#e6efe9]/60"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 380,
                              damping: 30,
                            }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              )}

              {isSessionLoading ? (
                <div className="hidden h-9 w-24 animate-pulse rounded-md bg-[#e6efe9] sm:block" />
              ) : !stableSession ? (
                <div className="hidden items-center gap-2 sm:flex">
                  <Link href="/login/citizen" className="btn-secondary">
                    Citizen Login
                  </Link>
                  <Link href="/login/staff" className="btn-primary">
                    Staff Login
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="btn-secondary btn-signout hidden sm:inline-flex disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSigningOut ? "Signing Out..." : "Sign Out"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d5e3da] text-[#4f6158] transition hover:bg-[#edf5ef] lg:hidden"
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNavDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
        pathname={pathname}
        sessionLabel={sessionLabel}
        onSignOut={stableSession ? handleSignOut : undefined}
        isSigningOut={isSigningOut}
        isSessionLoading={isSessionLoading}
        showAuthActions={!isSessionLoading && !stableSession}
      />
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4 6H16M4 10H16M4 14H16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlatformIcon() {
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#1b6f3f] to-[#124d2b] shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4 text-[#e8f4ec]"
        aria-hidden="true"
      >
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8 14L12 10L16 14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 22V10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}