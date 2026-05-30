"use client";

import Link from "next/link";

export default function CitizenDashboard() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-[#e4ece6] bg-white/80 p-6 shadow-sm">
        <span className="soft-pill">Citizen Desk</span>
        <h2 className="mt-3 text-2xl font-extrabold text-[#1d3025]">Report bin issues in minutes</h2>
        <p className="mt-2 text-sm text-[#5f7167]">
          Submit an overflowing or damaged bin report with location details and a photo link.
          Your submission is tracked until resolution.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/report" className="btn-primary">
            Report an Issue
          </Link>
          <Link href="/reports" className="btn-secondary">
            Track My Reports
          </Link>
        </div>

        <div className="mt-6 grid gap-3 rounded-xl border border-[#e6efe9] bg-[#f8fcf9] p-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1a7b3a]">Required</p>
            <p className="mt-1 text-sm text-[#4f6158]">Location, short title, and a hosted image URL.</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1a7b3a]">Optional</p>
            <p className="mt-1 text-sm text-[#4f6158]">Bin ID, address notes, and category refinements.</p>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-[#dfe9e3] p-6 text-[#1d3025]"
        style={{
          background:
            "linear-gradient(160deg, rgba(228, 246, 235, 0.9) 0%, rgba(250, 252, 249, 0.9) 70%)",
        }}
      >
        <p className="section-eyebrow">What Happens Next</p>
        <h3 className="mt-2 text-xl font-extrabold">Resolution timeline</h3>
        <ul className="mt-4 space-y-4 border-l-2 border-[#cfe3d7] pl-4">
          <li>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1a7b3a]">Step 01</p>
            <p className="mt-1 text-sm text-[#5e7066]">Your report is logged and queued for review.</p>
          </li>
          <li>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1a7b3a]">Step 02</p>
            <p className="mt-1 text-sm text-[#5e7066]">Operations team validates and routes it to a driver.</p>
          </li>
          <li>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1a7b3a]">Step 03</p>
            <p className="mt-1 text-sm text-[#5e7066]">Status changes appear in your report history.</p>
          </li>
        </ul>
      </div>
    </section>
  );
}
