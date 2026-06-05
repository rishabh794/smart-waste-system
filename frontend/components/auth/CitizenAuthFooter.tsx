import Link from "next/link";

type CitizenAuthFooterVariant = "login" | "signup";

interface CitizenAuthFooterProps {
  variant: CitizenAuthFooterVariant;
}

export default function CitizenAuthFooter({ variant }: CitizenAuthFooterProps) {
  const isLogin = variant === "login";

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-[#e4ece6] bg-white p-4">
        <p className="text-sm font-semibold text-[#1d3025]">
          {isLogin ? "New to reporting?" : "Already registered?"}
        </p>
        <p className="mt-1 text-sm text-[#5f7167]">
          {isLogin
            ? "Create a free account to submit and track bin issues in your area."
            : "Sign in to continue reporting and view your open cases."}
        </p>
        <Link
          href={isLogin ? "/signup" : "/login/citizen"}
          className="btn-primary mt-4 inline-flex w-full justify-center"
        >
          {isLogin ? "Create Citizen Account" : "Sign In"}
        </Link>
      </div>

      <div className="flex flex-col gap-2 border-t border-[#e4ece6] pt-4 text-center text-xs text-[#7a8b81]">
        <p>
          City staff or driver?{" "}
          <Link href="/login/staff" className="font-semibold text-[#197443] hover:underline">
            Use staff login instead
          </Link>
        </p>
        <Link href="/login" className="inline-flex items-center justify-center gap-1 font-semibold text-[#5f7167] hover:text-[#197443]">
          <span aria-hidden="true">←</span>
          All sign-in options
        </Link>
      </div>
    </div>
  );
}
