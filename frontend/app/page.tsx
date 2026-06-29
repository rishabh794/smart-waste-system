import Link from "next/link";
import Image from "next/image";
import AnimatedHeroText from "@/components/home/AnimatedHeroText";
import HeroAmbientAnimation from "@/components/home/HeroAmbientAnimation";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="bg-[#f8fcf9] text-[#1b2a22]">
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-bg-pattern min-h-[calc(100vh-4.5rem)] flex items-center py-16 sm:py-20 lg:py-28">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#f8fcf9]/60 via-[#f8fcf9]/30 to-[#f8fcf9]" />
        </div>

        <HeroAmbientAnimation />

        <div className="site-container relative z-10 w-full">
          <AnimatedHeroText />
        </div>
      </section>

      {/* For Citizens Section */}
      <section id="citizens" className="border-t border-[#e6efe9] bg-white py-16 lg:py-24 transition-all duration-500 hover:bg-[#fafdfb]">
        <div className="site-container grid gap-8 lg:gap-12 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-3xl shadow-sm">
              <Image
                src="https://images.pexels.com/photos/32246634/pexels-photo-32246634.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Citizens reporting waste"
                width={800} height={600}
                className="w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#197443]">For Citizens</p>
            <h2 className="mt-3 sm:mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Your Voice Keeps the Neighborhood Clean</h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#4f6158] leading-relaxed">
              Notice an overflowing bin or an illegal dump? EcoSync empowers you to report issues in seconds. Just snap a photo, and we automatically capture your location to dispatch the nearest available driver.
            </p>
            <ul className="mt-8 space-y-4 text-[#4f6158]">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f4ec] text-[#197443] font-bold text-xs">1</span>
                <span><strong className="text-[#1b2a22]">Snap & Send:</strong> No long forms. Take a photo and we do the rest.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f4ec] text-[#197443] font-bold text-xs">2</span>
                <span><strong className="text-[#1b2a22]">Track Resolution:</strong> See when your report is assigned, in-progress, and resolved.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e8f4ec] text-[#197443] font-bold text-xs">3</span>
                <span><strong className="text-[#1b2a22]">Community Impact:</strong> Join thousands of neighbors making a visible difference.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* For Drivers Section */}
      <section id="drivers" className="border-t border-[#e6efe9] bg-[#f8fcf9] py-16 lg:py-24 transition-all duration-500 hover:bg-[#f1f8f3]">
        <div className="site-container grid gap-8 lg:gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#197443]">For Drivers</p>
            <h2 className="mt-3 sm:mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Focus on the Road, We Handle the Route</h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#4f6158] leading-relaxed">
              No more paper manifests or inefficient backtracking. The EcoSync driver app provides real-time, optimized turn-by-turn routes based on live traffic and prioritized community reports.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="font-bold text-[#1b2a22]">Dynamic Routing</h3>
                <p className="mt-2 text-sm text-[#4f6158]">Routes automatically adjust when urgent reports are verified nearby.</p>
              </div>
              <div>
                <h3 className="font-bold text-[#1b2a22]">One-Tap Updates</h3>
                <p className="mt-2 text-sm text-[#4f6158]">Mark stops complete with a single tap. The dispatch center knows instantly.</p>
              </div>
              <div>
                <h3 className="font-bold text-[#1b2a22]">Offline Mode</h3>
                <p className="mt-2 text-sm text-[#4f6158]">Keep working in dead zones. Your progress syncs seamlessly when reconnected.</p>
              </div>
              <div>
                <h3 className="font-bold text-[#1b2a22]">Route Stats</h3>
                <p className="mt-2 text-sm text-[#4f6158]">Track your daily efficiency and collection volumes at a glance.</p>
              </div>
            </div>
          </div>
          <div>
            <div className="overflow-hidden rounded-3xl shadow-sm">
              <Image
                src="https://images.pexels.com/photos/18216395/pexels-photo-18216395.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Drivers using the system"
                width={800} height={600}
                className="w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* For Admins Section */}
      <section id="admins" className="border-t border-[#e6efe9] bg-white py-16 lg:py-24 transition-all duration-500 hover:bg-[#fafdfb]">
        <div className="site-container grid gap-8 lg:gap-12 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-3xl shadow-sm">
              <Image
                src="https://images.pexels.com/photos/4454065/pexels-photo-4454065.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Admin dispatch center"
                width={800} height={600}
                className="w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#197443]">For Admins</p>
            <h2 className="mt-3 sm:mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Total Command Over City Operations</h2>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-[#4f6158] leading-relaxed">
              Transform chaos into choreography. EcoSync gives administrators a bird's-eye view of every truck, every route, and every citizen report across multiple city zones.
            </p>
            <ul className="mt-8 space-y-4 text-[#4f6158]">
              <li className="flex items-start gap-3">
                <svg className="mt-1 h-5 w-5 shrink-0 text-[#197443]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong className="text-[#1b2a22]">Live Map Visibility:</strong> Monitor fleet positions and assignment locks in real time.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-1 h-5 w-5 shrink-0 text-[#197443]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong className="text-[#1b2a22]">AI-Assisted Triage:</strong> Automatically filter and categorize citizen reports by severity.</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="mt-1 h-5 w-5 shrink-0 text-[#197443]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span><strong className="text-[#1b2a22]">Performance Analytics:</strong> Generate actionable reports on driver efficiency and response times.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-[#e6efe9] bg-[#113f26] py-16 lg:py-20 text-center text-white px-4">
        <div className="site-container">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">Ready to modernize your city's waste operations?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-[#a4b4ab]">
            Join the growing network of municipalities utilizing EcoSync to keep streets cleaner, operations leaner, and citizens happier.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login/citizen" className="btn-secondary rounded-full px-8 py-3.5 hover:-translate-y-0.5 w-full sm:w-auto text-center">
              Citizen Portal
            </Link>
            <Link href="/login/staff" className="btn-primary rounded-full px-8 py-3.5 hover:-translate-y-0.5 border-transparent w-full sm:w-auto text-center">
              Staff Portal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
