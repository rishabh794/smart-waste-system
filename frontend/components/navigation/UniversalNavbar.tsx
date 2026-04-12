"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const adminLinks = [
  { href: "/dashboard", label: "/dashboard" },
  { href: "/status", label: "/status" },
  { href: "/create", label: "/create" },
];

export default function UniversalNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const isActive = pathname === href;
    return `border border-black px-3 py-2 font-bold text-sm ${isActive ? "bg-gray-100 text-black" : "bg-white text-black hover:bg-black hover:text-white transition-colors"}`;
  };

  return (
    <div className="border-b-2 border-black pb-4 p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Smart Waste System</h1>
          <p className="text-sm font-mono text-gray-600">
            {session
              ? `Logged in as: ${session.user?.name} | Role: ${session.user?.role}`
              : "Welcome. Please sign in to continue."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session?.user?.role === "admin" && (
            <nav className="flex gap-2">
              {adminLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {!session ? (
            <Link href="/login" className="border border-black px-4 py-2 hover:bg-gray-100 font-bold text-sm">
              Login
            </Link>
          ) : (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="border border-black px-4 py-2 hover:bg-gray-100 font-bold text-sm text-red-600"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}