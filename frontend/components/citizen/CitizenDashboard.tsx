"use client";

import Link from "next/link";

const TIMELINE_STEPS = [
  {
    title: "Report logged",
    description: "Your issue is queued for operations review.",
  },
  {
    title: "Team validates",
    description: "Dispatch confirms details and assigns a driver if needed.",
  },
  {
    title: "Status updates",
    description: "Track progress anytime from My Reports.",
  },
];

export default function CitizenDashboard() {
  return (
    <section className="space-y-6">
      <div className="soft-surface rounded-2xl p-5 sm:p-6">
        <span className="soft-pill">Citizen Desk</span>
        <h2 className="mt-3 text-xl font-extrabold text-[#1d3025] sm:text-2xl">
          Report bin issues in minutes
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5f7167]">
          Submit overflowing or damaged bin reports with your location and a photo.
          Everything you file is tracked until resolution.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <Link href="/report" className="btn-primary w-full text-center">
            Report an Issue
          </Link>
          <Link href="/reports" className="btn-secondary w-full text-center">
            Track My Reports
          </Link>
        </div>

        <dl className="mt-5 grid gap-3 border-t border-[#e6efe9] pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#1a7b3a]">Required</dt>
            <dd className="mt-1 text-sm text-[#4f6158]">Location, short title, and a photo.</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-[#1a7b3a]">Optional</dt>
            <dd className="mt-1 text-sm text-[#4f6158]">Bin ID, address notes, and category.</dd>
          </div>
        </dl>
      </div>

      <div className="soft-surface rounded-2xl p-5 sm:p-6">
        <p className="section-eyebrow">What Happens Next</p>
        <h3 className="mt-2 text-lg font-extrabold text-[#1d3025] sm:text-xl">Resolution timeline</h3>
        <ol className="mt-4 space-y-4 border-l-2 border-[#cfe3d7] pl-4">
          {TIMELINE_STEPS.map((step, index) => (
            <li key={step.title}>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1a7b3a]">
                Step {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1d3025]">{step.title}</p>
              <p className="mt-0.5 text-sm text-[#5e7066]">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
