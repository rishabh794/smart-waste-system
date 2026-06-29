"use client";

import { motion } from "framer-motion";

export default function HeroAmbientAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Top-right soft green orb */}
      <motion.div
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -30, 30, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-12%] right-[-8%] h-[45vw] w-[45vw] rounded-full bg-[#e8f4ec] opacity-60 blur-[100px]"
      />

      {/* Bottom-left sage/green orb */}
      <motion.div
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 50, -30, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-12%] left-[-8%] h-[40vw] w-[40vw] rounded-full bg-[#d4eeda] opacity-45 blur-[100px]"
      />

      {/* Center brand green glow */}
      <motion.div
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.06, 0.12, 0.06],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[25%] left-[30%] h-[50vw] w-[50vw] rounded-full bg-[#197443] blur-[140px]"
      />
    </div>
  );
}
