"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/* ─────────────────────────────────────────────
 *  Reusable inline SVG icons (no font dependency)
 * ───────────────────────────────────────────── */
function VerifiedIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#197443]" aria-hidden="true">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#197443]" aria-hidden="true">
      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 17v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#197443]" aria-hidden="true">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[#197443]" aria-hidden="true">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden="true">
      <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm3.844-8.791a.75.75 0 00-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 10-1.114 1.004l2.25 2.5a.75.75 0 001.15-.043l4.25-5.5z" clipRule="evenodd" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
 *  Animation variants
 * ───────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (d: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: d, duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (d: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: d, duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

/* ─────────────────────────────────────────────
 *  Main Hero Component
 * ───────────────────────────────────────────── */
export default function AnimatedHeroText() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16 items-center">
      {/* ── Left Column: Copy & CTAs ───────── */}
      <div className="flex flex-col gap-7 pt-6 lg:pt-0">
        {/* Eyebrow */}
        <motion.span
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="text-xs font-black uppercase tracking-[0.18em] text-[#4f6158]"
        >
          AI-Powered Waste Management Platform
        </motion.span>

        {/* Heading */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.1}
          className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
        >
          Building Cleaner Cities{" "}
          <br className="hidden lg:block" />
          Through{" "}
          <span className="text-[#197443]">Intelligent</span>{" "}
          <br className="hidden lg:block" />
          Waste Management
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.25}
          className="max-w-xl text-base leading-relaxed text-[#4f6158] sm:text-lg"
        >
          Enables collaboration between municipalities, private waste operators, and citizens
          to report waste issues, optimize collection routes, and improve sanitation using
          AI-assisted validation and smart routing.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.4}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href="/signup"
            className="btn-primary rounded-full px-8 py-3.5 text-center shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300"
          >
            Report an Issue
          </Link>
          <Link
            href="/login/staff"
            className="btn-secondary rounded-full px-8 py-3.5 text-center shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
          >
            Explore Dashboard
          </Link>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.55}
          className="flex flex-wrap gap-x-5 gap-y-2.5 pt-1"
        >
          <TrustBadge icon={<VerifiedIcon />} text="AI-assisted Report Validation" />
          <TrustBadge icon={<GroupsIcon />} text="Citizen Reporting" />
          <TrustBadge icon={<RouteIcon />} text="Route Optimization" />
          <TrustBadge icon={<MonitorIcon />} text="Real-time Monitoring" />
        </motion.div>
      </div>

      {/* ── Right Column: Dashboard Mockup ── */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        custom={0.35}
        className="relative"
      >
        <DashboardMockup />
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 *  Trust Badge
 * ───────────────────────────────────────────── */
function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs font-semibold text-[#4f6158]">{text}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
 *  Dashboard Mockup (glassmorphism + bento cards)
 * ───────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full aspect-[4/4.5] sm:aspect-[4/3] min-h-[320px] rounded-2xl sm:rounded-3xl bg-[#edf5ef] border border-[#d9e7de] shadow-2xl overflow-hidden">
      {/* Faux Browser Chrome */}
      <div className="h-8 sm:h-10 border-b border-[#d9e7de] bg-[#f8fcf9]/80 flex items-center px-3 sm:px-4 gap-1.5 sm:gap-2">
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#a4b4ab]" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#a4b4ab]" />
        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#a4b4ab]" />
      </div>

      {/* ── Map Image Background ── */}
      <div className="absolute inset-0 top-8 sm:top-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/map.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        {/* Soft overlay to let cards pop */}
        <div className="absolute inset-0 bg-[#edf5ef]/30" />
      </div>

      {/* ── Floating Cards ────────────────── */}
      <div className="absolute inset-0 top-8 sm:top-10 p-3 sm:p-4 flex flex-col">
        {/* Top Row */}
        <div className="flex justify-between gap-2 sm:gap-3">
          {/* Citizen Report Tracking */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="glass-panel rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-2 shadow-lg mt-6 sm:mt-10 ml-3 sm:ml-8 max-w-[12rem] sm:max-w-[14rem]"
          >
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#197443] text-white flex items-center justify-center shrink-0">
              <CameraIcon />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm font-bold text-[#1b2a22] leading-tight">Citizen report tracking</p>
              <p className="text-[8px] sm:text-xs text-[#4f6158]">snap, submit & track</p>
            </div>
          </motion.div>

          {/* Analytics Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            className="glass-panel rounded-xl sm:rounded-2xl p-2 sm:p-4 w-28 sm:w-44 shadow-lg mt-1 sm:mt-2 mr-1 sm:mr-4 flex flex-col gap-1"
          >
            <p className="text-[10px] sm:text-sm font-bold text-[#1b2a22]">Admin dashboard</p>
            <p className="text-[8px] sm:text-[10px] text-[#4f6158] mb-1">analytics</p>
            {/* Mini Bar Chart */}
            <div className="flex items-end justify-between h-8 sm:h-14 gap-[2px] sm:gap-[3px] border-b border-[#d9e7de] pb-0.5 sm:pb-1">
              {[30, 60, 40, 90, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-full rounded-t-sm hero-bar"
                  style={{
                    height: `${h}%`,
                    background: i === 3 ? "#197443" : `rgba(25,116,67,${0.15 + i * 0.1})`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Area */}
        <div className="mt-auto flex gap-2 sm:gap-3 justify-between items-end mb-2 sm:mb-3 mx-1 sm:mx-4">
          {/* AI Validation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="glass-panel rounded-xl sm:rounded-2xl p-2 sm:p-4 w-36 sm:w-52 shadow-lg flex flex-col gap-1.5 sm:gap-2"
          >
            <div className="flex justify-between items-center">
              <p className="text-[10px] sm:text-sm font-bold text-[#1b2a22]">AI-assisted validation</p>
              <svg viewBox="0 0 16 4" fill="currentColor" className="h-2.5 w-4 sm:h-3 sm:w-5 text-[#9aa89f]" aria-hidden="true">
                <circle cx="2" cy="2" r="1.5" />
                <circle cx="8" cy="2" r="1.5" />
                <circle cx="14" cy="2" r="1.5" />
              </svg>
            </div>
            <p className="text-[8px] sm:text-xs text-[#4f6158] leading-snug">
              Issue detected and sent to dispatch.
            </p>
            <span className="inline-flex items-center gap-1 bg-[#e8f4ec] text-[#197443] px-1.5 sm:px-2 py-0.5 rounded-full w-fit text-[8px] sm:text-[10px] font-bold">
              <CheckCircleIcon />
              Valid Report
            </span>
          </motion.div>

          {/* Driver Route Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.15, duration: 0.6 }}
            className="glass-panel rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-lg flex flex-col gap-1 sm:gap-2"
          >
            <p className="text-[10px] sm:text-sm font-bold text-[#1b2a22]">Driver route visualization</p>
            <p className="text-[8px] sm:text-xs text-[#4f6158] leading-snug">Optimized turn-by-turn navigation</p>
            <div className="w-20 h-12 sm:w-28 sm:h-16 rounded-lg bg-[#e6efe9] relative overflow-hidden">
              {/* Decorative route lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 112 64" fill="none">
                <path d="M10 50 Q30 10 56 32 T102 14" stroke="#197443" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="10" cy="50" r="3" fill="#197443" />
                <circle cx="56" cy="32" r="2.5" fill="#2f8f59" />
                <circle cx="102" cy="14" r="3" fill="#197443" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

