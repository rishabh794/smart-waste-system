"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import AuthShell from "@/components/auth/AuthShell";
import CitizenAuthFooter from "@/components/auth/CitizenAuthFooter";
import LoginForm from "@/components/auth/LoginForm";
import { CITIZEN_HERO_ALT, CITIZEN_HERO_IMAGE } from "@/lib/authAssets";

const getGoogleErrorMessage = (error: string | null) => {
  if (!error) return "";

  const normalized = error.toLowerCase();
  if (
    normalized.includes("citizenaccessrequired") ||
    normalized.includes("citizen access required") ||
    normalized.includes("accessdenied") ||
    normalized === "access_denied"
  ) {
    return "This Google account is registered as staff. Please use Staff Login with your assigned password.";
  }

  if (normalized === "oauthaccountnotlinked") {
    return "This email is already registered with a password. Sign in with email instead.";
  }

  return "Google sign-in failed. Please try again or use email and password.";
};

function CitizenLoginContent() {
  const searchParams = useSearchParams();
  const initialError = useMemo(
    () => getGoogleErrorMessage(searchParams.get("error")),
    [searchParams],
  );
  const isStaffGoogleError = initialError.includes("registered as staff");

  return (
    <AuthShell
      heroImage={CITIZEN_HERO_IMAGE}
      heroAlt={CITIZEN_HERO_ALT}
      badge="Citizen Access"
      title="Citizen Sign In"
      description="Report neighborhood bin issues, upload evidence, and track resolutions from your secure profile."
      gradient="linear-gradient(90deg, rgba(17,63,38,0.85), rgba(17,63,38,0.45))"
    >
      <p className="section-eyebrow">EcoSync</p>
      <h2 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Sign In</h2>
      <p className="mt-1 text-sm text-[#607267]">Use Google or your citizen account email.</p>

      <LoginForm showGoogle submitLabel="Sign In" submittingLabel="Signing In..." initialError={initialError} />

      {isStaffGoogleError && (
        <p className="mt-3 text-sm text-[#5f7167]">
          <Link href="/login/staff" className="font-semibold text-[#197443] hover:underline">
            Go to Staff Login
          </Link>
        </p>
      )}

      <CitizenAuthFooter variant="login" />
    </AuthShell>
  );
}

export default function CitizenLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="site-container py-10 sm:py-14">
          <p className="text-sm text-[#607267]">Loading citizen sign-in...</p>
        </div>
      }
    >
      <CitizenLoginContent />
    </Suspense>
  );
}
