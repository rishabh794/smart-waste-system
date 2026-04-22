import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="bg-[#f1f8f3]">
      <section className="site-container py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="section-eyebrow">City Waste Operations Platform</p>
            <h1 className="section-title mt-3">
              Cleaner Streets Through
              <br />
              Coordinated Waste Collection
            </h1>
            <p className="section-subtitle max-w-xl">
              Plan routes, monitor bins, and track collection progress in one unified control
              system for administrators and drivers.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                Open Dashboard
              </Link>
              <a href="#steps" className="btn-secondary">
                View Workflow
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-[#e4ece6] pt-5 text-sm">
              <div>
                <p className="text-2xl font-extrabold text-[#197443]">10+</p>
                <p className="text-[#61736a]">Seeded Bins</p>
              </div>
              <div className="h-10 w-px bg-[#dbe5de]" />
              <div>
                <p className="text-2xl font-extrabold text-[#197443]">3+</p>
                <p className="text-[#61736a]">Available Drivers</p>
              </div>
              <div className="h-10 w-px bg-[#dbe5de]" />
              <div>
                <p className="text-2xl font-extrabold text-[#197443]">Live</p>
                <p className="text-[#61736a]">Status Monitoring</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-[#dfebe3] bg-[#f7fbf8] p-3">
            <Image
              src="https://images.pexels.com/photos/18216395/pexels-photo-18216395.jpeg?auto=compress&cs=tinysrgb&w=1600"
              alt="Workers and truck at a waste sorting plant"
              width={1000}
              height={650}
              className="h-105 w-full rounded-xl object-cover"
              priority
            />
            <div className="absolute bottom-8 left-7 rounded-md bg-[#f5faf6]/90 px-4 py-3 shadow-md backdrop-blur">
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#197443]">Daily Dispatch</p>
              <p className="mt-1 text-sm font-semibold text-[#2a4235]">Smart routes for faster collection cycles</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[#e6efe9] bg-[#f8fcf9] py-14">
        <div className="site-container grid gap-8 lg:grid-cols-3">
          <article>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8f5ed]">
              <svg className="h-6 w-6 text-[#197443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m0 18l4 0a2 2 0 002-2m-6 2V9m6 12l4 0a2 2 0 002-2m-6 2V9m-6 0h.01M9 3h.01M15 3h.01M21 21H3" />
              </svg>
            </div>
            <p className="section-eyebrow">Live Map Visibility</p>
            <p className="mt-3 text-sm leading-6 text-[#5d6f65]">
              Monitor bin locations, assignment locks, and current statuses directly on the map.
            </p>
          </article>
          <article>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8f5ed]">
              <svg className="h-6 w-6 text-[#197443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="section-eyebrow">Route Progress Tracking</p>
            <p className="mt-3 text-sm leading-6 text-[#5d6f65]">
              View pending operations and completion readiness by driver and route.
            </p>
          </article>
          <article>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#e8f5ed]">
              <svg className="h-6 w-6 text-[#197443]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p className="section-eyebrow">Driver Field Updates</p>
            <p className="mt-3 text-sm leading-6 text-[#5d6f65]">
              Drivers update collection outcomes in real time for immediate status synchronization.
            </p>
          </article>
        </div>
      </section>

      <section className="site-container py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="section-eyebrow">Waste Segregation 101</p>
            <h2 className="section-title mt-3">Proper Sorting Is The Foundation</h2>
            <p className="section-subtitle max-w-lg">
              Effective waste management begins at the source. Segregation ensures recyclables
              reach processing facilities, organic waste composts properly, and hazardous materials
              are handled safely. Your platform enables drivers to understand collection priorities.
            </p>

            <ul className="mt-8 space-y-4 border-l-2 border-[#dfe9e3] pl-5">
              <li>
                <p className="font-semibold text-[#1d3025]">Organic & Compostables</p>
                <p className="text-sm text-[#5e7066]">Food waste and biodegradable materials for composting programs.</p>
              </li>
              <li>
                <p className="font-semibold text-[#1d3025]">Recyclables</p>
                <p className="text-sm text-[#5e7066]">Paper, cardboard, plastics, and metals routed to recovery facilities.</p>
              </li>
              <li>
                <p className="font-semibold text-[#1d3025]">Inert & Sanitary</p>
                <p className="text-sm text-[#5e7066]">Construction debris and non-recyclables requiring landfill management.</p>
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#dfebe3]">
            <Image
              src="https://images.pexels.com/photos/36751337/pexels-photo-36751337.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt="Team of workers sorting waste on an industrial conveyor belt at a processing facility"
              width={1000}
              height={700}
              className="h-80 w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="site-container py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="section-eyebrow">Field-Focused Design</p>
            <h2 className="section-title mt-3">Built For Operational Teams, Not Generic Dashboards</h2>
            <p className="section-subtitle max-w-lg">
              The system is structured around dispatch, collection, and closure loops with role-based
              interfaces for admin and drivers.
            </p>

            <div className="mt-8 space-y-5 border-l-2 border-[#dfe9e3] pl-5" id="steps">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#197443]">Step 01</p>
                <h3 className="mt-1 text-lg font-extrabold text-[#1d3025]">Select Bins And Assign Driver</h3>
                <p className="mt-1 text-sm text-[#5e7066]">Admin dispatches routes from the control center.</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#197443]">Step 02</p>
                <h3 className="mt-1 text-lg font-extrabold text-[#1d3025]">Driver Executes Collection</h3>
                <p className="mt-1 text-sm text-[#5e7066]">Stops are updated as collected or missed, with overflow observed as a separate field signal.</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#197443]">Step 03</p>
                <h3 className="mt-1 text-lg font-extrabold text-[#1d3025]">Monitor And Complete Routes</h3>
                <p className="mt-1 text-sm text-[#5e7066]">Pending routes close once all assigned bins are resolved.</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <Image
              src="https://images.pexels.com/photos/36751332/pexels-photo-36751332.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt="Workers sorting recyclable waste at a processing facility"
              width={1000}
              height={650}
              className="h-64 w-full rounded-2xl border border-[#dfe9e3] object-cover"
            />
            <Image
              src="https://images.pexels.com/photos/32246634/pexels-photo-32246634.jpeg?auto=compress&cs=tinysrgb&w=1400"
              alt="Colorful outdoor recycling bins for waste segregation"
              width={1000}
              height={650}
              className="h-64 w-full rounded-2xl border border-[#dfe9e3] object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f8fcf9] py-16">
        <div className="site-container">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="order-2 lg:order-1 overflow-hidden rounded-2xl border border-[#dfebe3]">
              <Image
                src="https://images.pexels.com/photos/4454065/pexels-photo-4454065.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Aerial view of waste management facility with heavy machinery and landfill operations"
                width={1000}
                height={700}
                className="h-80 w-full object-cover"
              />
            </div>

            <div className="order-1 lg:order-2">
              <p className="section-eyebrow">Infrastructure & Impact</p>
              <h2 className="section-title mt-3">Built To Scale With Your City&apos;s Growth</h2>
              <p className="section-subtitle max-w-lg">
                From collection points to processing facilities, waste management is a system. Our
                platform orchestrates thousands of daily collection cycles across multiple zones,
                ensuring nothing falls through the cracks.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-[#f1f8f3] p-4 border border-[#dfe9e3]">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#197443]">Real-Time Sync</p>
                  <p className="mt-2 text-sm text-[#5e7066]">Every dispatch updates across all devices instantly.</p>
                </div>
                <div className="rounded-lg bg-[#f1f8f3] p-4 border border-[#dfe9e3]">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#197443]">Complete Traceability</p>
                  <p className="mt-2 text-sm text-[#5e7066]">Audit trail from collection through final disposition.</p>
                </div>
                <div className="rounded-lg bg-[#f1f8f3] p-4 border border-[#dfe9e3]">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#197443]">Adaptive Routing</p>
                  <p className="mt-2 text-sm text-[#5e7066]">Optimize routes based on bin capacity and current loads.</p>
                </div>
                <div className="rounded-lg bg-[#f1f8f3] p-4 border border-[#dfe9e3]">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#197443]">Multi-Zone Support</p>
                  <p className="mt-2 text-sm text-[#5e7066]">Manage unlimited collection zones from one dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-[#e6efe9] bg-[#113f26] py-12 text-white">
        <div className="site-container flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.17em] text-[#f0c765]">Get Started</p>
            <h3 className="mt-2 text-3xl font-extrabold">Launch Your Waste Operations Control Center</h3>
          </div>
          <Link href="/login" className="btn-primary">
            Login To Continue
          </Link>
        </div>
      </section>
    </main>
  );
}
