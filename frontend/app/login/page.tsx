"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { getValidationErrorMessage, loginFormSchema } from "@/lib/validation";

const DEFAULT_REDIRECT_PATH = "/dashboard";

const getSafeRedirectPath = (value: string | null) => {
  if (!value) return DEFAULT_REDIRECT_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_REDIRECT_PATH;
  if (value.startsWith("/login")) return DEFAULT_REDIRECT_PATH;
  return value;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedCredentials = loginFormSchema.safeParse({ email, password });
    if (!parsedCredentials.success) {
      setError(getValidationErrorMessage(parsedCredentials.error));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const callbackUrl = getSafeRedirectPath(searchParams.get("callbackUrl"));

      const res = await signIn("credentials", {
        email: parsedCredentials.data.email,
        password: parsedCredentials.data.password,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        toast.success("Signed in successfully.");
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="site-container py-10 sm:py-14">
      <div className="grid overflow-hidden rounded-2xl border border-[#dfe9e3] lg:grid-cols-[1.03fr_0.97fr]">
        <div className="relative min-h-105">
          <Image
            src="https://images.pexels.com/photos/69903/pexels-photo-69903.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Waste collection truck"
            fill
            className="absolute inset-0 h-full w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, rgba(14,79,42,0.85), rgba(14,79,42,0.45))" }}
          />
          <div className="relative p-8 text-white sm:p-10">
            <p className="soft-pill inline-flex border-white/40 bg-white/10 text-white">Secure Access</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">Operations Portal Login</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/88">
              Access your role-based dashboard to assign routes, track progress, and manage city
              waste collection activities.
            </p>
          </div>
        </div>

        <div className="bg-[#f8fcf9] p-8 sm:p-10">
          <p className="section-eyebrow">Smart Waste System</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Sign In</h2>
          <p className="mt-1 text-sm text-[#607267]">Use your assigned account credentials.</p>

          {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#21412f]">Email</label>
              <input
                type="email"
                required
                className="input-clean"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[#21412f]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="input-clean pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-2 my-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[#4c6658] transition hover:bg-[#e9f4ed] hover:text-[#1f6b40]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Accessing Dashboard..." : "Access Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M2 12C3.9 8.5 7.4 6 12 6C16.6 6 20.1 8.5 22 12C20.1 15.5 16.6 18 12 18C7.4 18 3.9 15.5 2 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 6.2C11.1 6.1 11.5 6 12 6C16.6 6 20.1 8.5 22 12C21.1 13.6 19.8 15 18.3 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 8.3C4.7 9.2 3.5 10.5 2.8 12C4.7 15.5 8.1 18 12 18C13.5 18 14.8 17.6 16 16.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.1 14.1C13.6 14.6 12.8 15 12 15C10.3 15 9 13.7 9 12C9 11.2 9.4 10.4 9.9 9.9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}