"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function AnimatedHeroText() {
  return (
    <div className="mx-auto max-w-4xl text-center">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl relative z-10"
      >
        Clean Cities,{" "}
        <motion.span 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="inline-block text-[#197443]"
        >
          Synchronized.
        </motion.span>
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 1 }}
        className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg lg:text-xl text-[#4f6158] leading-relaxed px-4"
      >
        EcoSync unifies citizens, drivers, and administrators into one seamless platform. Report issues instantly, optimize collection routes, and orchestrate city-wide operations.
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
        className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 px-4"
      >
        <Link href="/signup" className="btn-primary rounded-full px-8 py-3.5 shadow-lg hover:-translate-y-0.5 hover:shadow-xl w-full sm:w-auto text-center">
          Report an Issue
        </Link>
        <Link href="/login/staff" className="btn-secondary rounded-full px-8 py-3.5 shadow-sm hover:-translate-y-0.5 hover:shadow-md w-full sm:w-auto text-center">
          Staff Login
        </Link>
      </motion.div>
    </div>
  );
}
