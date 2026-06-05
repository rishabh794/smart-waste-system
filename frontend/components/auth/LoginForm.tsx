"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { getSafeRedirectPath } from "@/lib/authRedirects";
import { getValidationErrorMessage, loginFormSchema } from "@/lib/validation";

interface LoginFormProps {
  showGoogle?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  initialError?: string;
}

function LoginFormInner({
  showGoogle = false,
  submitLabel = "Sign In",
  submittingLabel = "Signing In...",
  initialError = "",
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(initialError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

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

  const handleGoogleSignIn = async () => {
    if (isGoogleSubmitting) return;
    setIsGoogleSubmitting(true);

    try {
      const callbackUrl = getSafeRedirectPath(searchParams.get("callbackUrl"));
      await signIn("google", { callbackUrl });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <>
      {showGoogle && (
        <>
          <GoogleSignInButton
            onClick={handleGoogleSignIn}
            isLoading={isGoogleSubmitting}
          />

          <div className="mt-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8b81]">
            <span className="h-px flex-1 bg-[#dde8e1]" />
            Or use email
            <span className="h-px flex-1 bg-[#dde8e1]" />
          </div>
        </>
      )}

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className={`space-y-4 ${showGoogle ? "mt-6" : "mt-5"}`}>
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
          {isSubmitting ? submittingLabel : submitLabel}
        </button>
      </form>
    </>
  );
}

export default function LoginForm(props: LoginFormProps) {
  return (
    <Suspense
      fallback={
        <p className="mt-5 text-sm text-[#607267]">Loading sign-in form...</p>
      }
    >
      <LoginFormInner {...props} />
    </Suspense>
  );
}
