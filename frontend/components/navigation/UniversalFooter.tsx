import Link from "next/link";

const footerSections = [
  {
    title: "Resources",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Route Status", href: "/status" },
      { label: "Create Assets", href: "/create" },
      { label: "System Login", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#features" },
      { label: "Workflow", href: "/#steps" },
      { label: "Contact", href: "/#contact" },
      { label: "City Partnerships", href: "/#contact" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "LinkedIn", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "GitHub", href: "#" },
      { label: "Email", href: "mailto:admin@waste.com" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Status", href: "/status" },
    ],
  },
];

export default function UniversalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#2a3730] bg-[#232826] text-[#d6dfd9]">
      <div className="site-container">
        <section className="grid gap-8 border-b border-[#313d36] py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-extrabold tracking-tight text-white">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#4b6a58] bg-[#1b3528] text-[#9ad2ae]">
                <FooterIcon />
              </span>
              <span>SmartWaste.</span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#a4b4ab]">
              Because cleaner cities need synchronized dispatch, collection, and route completion.
            </p>
          </div>

          <div className="rounded-2xl border border-[#3a4a40] bg-[#2b322f] p-5 sm:p-6">
            <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#efbe53]">Demo</p>
            <h3 className="mt-2 text-4xl font-extrabold leading-tight text-white">Request a Demo</h3>
            <form className="mt-4 flex items-center rounded-full border border-[#49574f] bg-[#f7fcf8] p-1">
              <input
                type="email"
                placeholder="Enter your email..."
                suppressHydrationWarning
                className="w-full bg-transparent px-4 py-2 text-sm font-medium text-[#203329] placeholder:text-[#687d72] outline-none"
              />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#efbe53] bg-[#efbe53] text-[#203329] transition hover:bg-[#f6cd74]"
                aria-label="Submit request"
              >
                <ArrowIcon />
              </button>
            </form>
          </div>
        </section>

        <section className="grid gap-8 border-b border-[#313d36] py-9 sm:grid-cols-2 lg:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-extrabold text-white">{section.title}</h4>
              <ul className="mt-3 space-y-2 text-sm text-[#a8b8af]">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.label}`}>
                    <Link href={link.href} className="transition hover:text-[#d8f0e0]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 py-4 text-xs text-[#8fa59a] sm:flex-row sm:items-center sm:justify-between">
          <p>{`© ${year} SmartWaste System.`}</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="transition hover:text-[#d8f0e0]">Support</Link>
            <Link href="#" className="transition hover:text-[#d8f0e0]">Privacy Policy</Link>
            <Link href="#" className="transition hover:text-[#d8f0e0]">Terms</Link>
          </div>
        </section>
      </div>
    </footer>
  );
}

function FooterIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5.8 7.5L10 5.1L14.2 7.5V12.5L10 14.9L5.8 12.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.8 7.5L10 9.9L14.2 7.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 10V14.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 10H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 6L15 10L11 14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}