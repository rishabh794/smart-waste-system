"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DataLoadingState from "@/components/ui/DataLoadingState";
import { getLoginPathForCallback } from "@/lib/authRedirects";

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
  loadingFallback = (
    <div className="site-container py-10">
      <DataLoadingState
        title="Loading session"
        subtitle="Verifying access and preparing your workspace."
      />
    </div>
  ),
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthorized =
    !!session &&
    (!allowedRoles || allowedRoles.length === 0 || allowedRoles.includes(session.user?.role ?? ""));

  useEffect(() => {
    if (status === "unauthenticated") {
      let destination = redirectUnauthenticatedTo;
      if (redirectUnauthenticatedTo === "/login") {
        const callbackUrl = `${window.location.pathname}${window.location.search}`;
        const loginPath = getLoginPathForCallback(callbackUrl);
        destination = `${loginPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`;
      }
      router.push(destination);
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
