import Link from "next/link";

const audienceCards = [
  {
    href: "/login/citizen",
    title: "Citizen",
    description: "Report bin issues and track resolutions in your neighborhood.",
    note: "Sign in or create a free reporting account.",
    icon: CitizenIcon,
  },
  {
    href: "/login/staff",
    title: "Driver / Operations",
    description: "Access assigned routes, collection tasks, and operations dashboards.",
    note: "Staff accounts are created by your administrator.",
    icon: StaffIcon,
  },
];

export default function LoginGatewayPage() {
  return (
    <div className="site-container py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <p className="section-eyebrow text-center">EcoSync</p>
        <h1 className="mt-2 text-center text-4xl font-extrabold text-[#1b2a22]">Sign in to EcoSync</h1>
        <p className="mt-3 text-center text-sm text-[#607267]">
          Choose how you use the platform. Your account type is set when you register or are invited.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {audienceCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-[#dfe9e3] bg-[#f8fcf9] p-6 transition hover:border-[#b8d4c0] hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#e8f5ed] text-[#197443]">
                <card.icon />
              </span>
              <h2 className="mt-4 text-xl font-extrabold text-[#1d3025]">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f7167]">{card.description}</p>
              <p className="mt-3 text-xs text-[#7a8b81]">{card.note}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#197443] group-hover:underline">
                Continue
                <ArrowIcon />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-[#5f7167]">
          New citizen?{" "}
          <Link href="/signup" className="font-semibold text-[#197443] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

function CitizenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M12 21C16.4183 21 20 17.4183 20 13C20 8.58172 16.4183 5 12 5C7.58172 5 4 8.58172 4 13C4 17.4183 7.58172 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 11V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StaffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
      <path
        d="M3 13H15V19H3V13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M15 15H18L21 18V19H15V15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M6 16H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 13V10C6 8.34315 7.34315 7 9 7H12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M5 10H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M11 6L15 10L11 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
