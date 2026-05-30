"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { apiFetchPublic } from "@/lib/apiFetch";
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
        router.push("/login");
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
    <div className="site-container py-10 sm:py-14">
      <div className="grid overflow-hidden rounded-2xl border border-[#dfe9e3] lg:grid-cols-[1.03fr_0.97fr]">
        <div className="relative min-h-105">
          <Image
            src="https://images.pexels.com/photos/3007766/pexels-photo-3007766.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Neighborhood waste collection bins"
            fill
            className="absolute inset-0 h-full w-full object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg, rgba(17,63,38,0.85), rgba(17,63,38,0.45))" }}
          />
          <div className="relative p-8 text-white sm:p-10">
            <p className="soft-pill inline-flex border-white/40 bg-white/10 text-white">Citizen Access</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">Create Your Reporting Account</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/88">
              Submit neighborhood bin issues, upload evidence links, and track resolutions from one secure profile.
            </p>
          </div>
        </div>

        <div className="bg-[#f8fcf9] p-8 sm:p-10">
          <p className="section-eyebrow">Citizen Signup</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#1b2a22]">Create Account</h2>
          <p className="mt-1 text-sm text-[#607267]">Use your details to start reporting issues.</p>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isGoogleSubmitting}
            className="btn-secondary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isGoogleSubmitting ? "Connecting Google..." : "Continue with Google"}
          </button>

          <div className="mt-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#7a8b81]">
            <span className="h-px flex-1 bg-[#dde8e1]" />
            Or use email
            <span className="h-px flex-1 bg-[#dde8e1]" />
          </div>

          {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

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

          <p className="mt-5 text-sm text-[#5f7167]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[#197443] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
