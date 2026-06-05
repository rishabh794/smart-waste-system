"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import CitizenAuthFooter from "@/components/auth/CitizenAuthFooter";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { apiFetchPublic } from "@/lib/apiFetch";
import { CITIZEN_HERO_ALT, CITIZEN_HERO_IMAGE } from "@/lib/authAssets";
import { getApiErrorMessage } from "@/lib/services/apiService";
import { getValidationErrorMessage, signupFormSchema } from "@/lib/validation";

export default function SignupPage() {
  const router = useRouter();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const updateField = (key: keyof typeof formState, value: string) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = signupFormSchema.safeParse(formState);
    if (!parsed.success) {
      setError(getValidationErrorMessage(parsed.error));
      return;
    }

    const trimmedPhone = parsed.data.phone?.trim();
    const payload = {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      ...(trimmedPhone ? { phone: trimmedPhone } : {}),
    };

    setIsSubmitting(true);
    setError("");

    try {
      const res = await apiFetchPublic("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(await getApiErrorMessage(res, "Unable to create account."));
        return;
      }

      const signInResult = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login/citizen");
        return;
      }

      toast.success("Account created successfully.");
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      console.error(submitError);
      setError("Network issue while creating account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (isGoogleSubmitting) return;
    setIsGoogleSubmitting(true);

    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthShell
      heroImage={CITIZEN_HERO_IMAGE}
      heroAlt={CITIZEN_HERO_ALT}
      badge="Citizen Access"
      title="Create Your Reporting Account"
      description="Submit neighborhood bin issues, upload evidence links, and track resolutions from one secure profile."
      gradient="linear-gradient(90deg, rgba(17,63,38,0.85), rgba(17,63,38,0.45))"
    >
      <p className="section-eyebrow">Citizen Signup</p>
      <h2 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Create Account</h2>
      <p className="mt-1 text-sm text-[#607267]">Use Google or your email to start reporting issues.</p>

      <GoogleSignInButton onClick={handleGoogleSignup} isLoading={isGoogleSubmitting} />

      <div className="mt-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8b81]">
        <span className="h-px flex-1 bg-[#dde8e1]" />
        Or use email
        <span className="h-px flex-1 bg-[#dde8e1]" />
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#21412f]">Full Name</label>
          <input
            type="text"
            required
            className="input-clean"
            value={formState.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#21412f]">Email</label>
          <input
            type="email"
            required
            className="input-clean"
            value={formState.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#21412f]">Phone (optional)</label>
          <input
            type="tel"
            className="input-clean"
            value={formState.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#21412f]">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              className="input-clean pr-11"
              value={formState.password}
              onChange={(event) => updateField("password", event.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
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
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-[#7a8b81]">
        By creating an account, you can report issues and track their status.
      </p>

      <CitizenAuthFooter variant="signup" />
    </AuthShell>
  );
}
