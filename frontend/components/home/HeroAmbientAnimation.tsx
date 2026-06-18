"use client";

import { motion } from "framer-motion";

export default function HeroAmbientAnimation() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Soft Green Glowing Orb */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -50, 50, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] h-[50vw] w-[50vw] rounded-full bg-[#e8f4ec] opacity-50 blur-[100px]"
      />
      
      {/* Soft Yellow/Gold Glowing Orb */}
      <motion.div
        animate={{
          x: [0, -80, 60, 0],
          y: [0, 80, -40, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute right-[-10%] bottom-[-10%] h-[40vw] w-[40vw] rounded-full bg-[#fce8d5] opacity-40 blur-[100px]"
      />

      {/* Subtle Brand Green Glowing Orb in Center */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[20%] left-[25%] h-[60vw] w-[60vw] rounded-full bg-[#197443] blur-[140px]"
      />
    </div>
  );
}
