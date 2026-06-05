export const roleLabels = {
  admin: "Admin",
  driver: "Driver",
  user: "Citizen",
} as const;

export type AppRole = keyof typeof roleLabels;

export const getRoleLabel = (role?: string) =>
  roleLabels[role as AppRole] ?? "User";
