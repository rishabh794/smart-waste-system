export type NavLink = {
  href: string;
  label: string;
  shortLabel?: string;
};

export const publicLinks: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#steps", label: "Steps" },
  { href: "/#contact", label: "Contact" },
];

export const adminLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home" },
  { href: "/status", label: "Status" },
  { href: "/admin/reports", label: "Reports", shortLabel: "Reports" },
  { href: "/create", label: "Create" },
  { href: "/admin/driver-stats", label: "Driver Stats", shortLabel: "Stats" },
];

export const driverLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Route" },
  { href: "/driver/stats", label: "My Stats", shortLabel: "Stats" },
];

export const citizenLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home" },
  { href: "/report", label: "Report Issue", shortLabel: "Report" },
  { href: "/reports", label: "My Reports", shortLabel: "Reports" },
];

export const getNavLinksForRole = (role?: string): NavLink[] => {
  if (role === "admin") return adminLinks;
  if (role === "driver") return driverLinks;
  if (role === "user") return citizenLinks;
  return publicLinks;
};

export const hasMobileRoleNav = (role?: string) => role === "driver" || role === "user";
