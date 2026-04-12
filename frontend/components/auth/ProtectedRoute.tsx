"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: (session: Session) => ReactNode;
  allowedRoles?: string[];
  redirectUnauthenticatedTo?: string;
  redirectUnauthorizedTo?: string;
  loadingFallback?: ReactNode;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectUnauthenticatedTo = "/login",
  redirectUnauthorizedTo = "/dashboard",
  loadingFallback = <div className="p-4 font-mono max-w-4xl mx-auto">Loading session...</div>,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthorized =
    !!session &&
    (!allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(session.user?.role ?? ""));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push(redirectUnauthenticatedTo);
      return;
    }

    if (status === "authenticated" && !isAuthorized) {
      router.push(redirectUnauthorizedTo);
    }
  }, [status, isAuthorized, router, redirectUnauthenticatedTo, redirectUnauthorizedTo]);

  if (status === "loading") return <>{loadingFallback}</>;

  if (!session || !isAuthorized) return null;

  return <>{children(session)}</>;
}