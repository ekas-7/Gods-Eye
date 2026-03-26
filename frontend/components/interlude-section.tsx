"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

const lines = [
  "You scroll past 300 people a day.",
  "None of them know you exist.",
  "One of them could change your life.",
];

export function InterludeSection() {
  return (
    <section className="relative py-40 md:py-56 overflow-hidden flex items-center justify-center">
      {/* Horizontal rule feel — faint lines top and bottom */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* Radial glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[300px] rounded-full bg-cyan-500/[0.04] blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center gap-8 px-8 md:px-28">
        {lines.map((line, idx) => (
          <motion.p
            key={line}
            {...fadeUp(idx * 0.12)}
            className={
              idx === 2
                ? "text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-foreground"
                : "text-3xl md:text-5xl lg:text-6xl font-medium tracking-tight text-muted-foreground/40"
            }
          >
            {line}
          </motion.p>
        ))}
      </div>
    </section>
  );
}
