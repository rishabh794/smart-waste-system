"use client";

import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export default function StaffLoginPage() {
  return (
    <AuthShell
      heroImage="https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1600"
      heroAlt="Waste collection truck"
      badge="Operations Access"
      title="Operations Sign In"
      description="Access your role-based dashboard to assign routes, track progress, and manage city waste collection activities."
    >
      <p className="section-eyebrow">EcoSync</p>
      <h2 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Staff Sign In</h2>
      <p className="mt-1 text-sm text-[#607267]">
        Use the email and password provided by your administrator.
      </p>

      <LoginForm
        submitLabel="Sign In to Dashboard"
        submittingLabel="Signing In..."
      />

      <div className="mt-5 space-y-2 text-sm text-[#5f7167]">
        <p>
          Reporting a bin issue?{" "}
          <Link href="/login/citizen" className="font-semibold text-[#197443] hover:underline">
            Citizen login
          </Link>
        </p>
        <p>
          <Link href="/login" className="font-semibold text-[#197443] hover:underline">
            Back to sign-in options
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
