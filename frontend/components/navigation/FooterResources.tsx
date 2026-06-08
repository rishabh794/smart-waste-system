"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const publicResourceLinks = [
  { label: "Citizen Login", href: "/login/citizen" },
  { label: "Staff Login", href: "/login/staff" },
  { label: "Create Account", href: "/signup" },
];

const adminResourceLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Route Status", href: "/status" },
  { label: "Issue Reports", href: "/admin/reports" },
  { label: "Create Assets", href: "/create" },
];

export default function FooterResources() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const links = isAdmin
    ? [...adminResourceLinks, { label: "System Login", href: "/login" }]
    : publicResourceLinks;

  return (
    <ul className="mt-3 space-y-2 text-sm text-[#a8b8af]">
      {links.map((link) => (
        <li key={link.label}>
          <Link href={link.href} className="transition hover:text-[#d8f0e0]">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
