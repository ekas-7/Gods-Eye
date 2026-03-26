"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

const videoSrc = "/HeroSection.mp4";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 w-full px-6 md:px-24 pt-6 md:pt-8 pb-12 flex flex-col items-center text-center gap-6">

        <motion.div
          {...fadeUp(0.1)}
          className="flex flex-col items-center text-center max-w-4xl mx-auto gap-0"
        >
          <h1
            className="text-6xl md:text-7xl font-light tracking-tighter uppercase md:normal-case text-transparent headline-shadow"
            style={{ letterSpacing: "-0.03em", fontFamily: "var(--font-wide)", fontWeight: 300 }}
          >
            <span className="headline-outline">Discover people</span>
          </h1>
          <h1
            className="text-6xl md:text-7xl font-light tracking-tighter text-white/90 -mt-4"
            style={{ letterSpacing: "-0.03em", fontFamily: "var(--font-wide)", fontWeight: 300 }}
          >
            nearby by <span className="accent-italic lowercase">interest</span>
          </h1>
        </motion.div>

        <motion.p
          {...fadeUp(0.2)}
          className="text-lg text-hero-subtle max-w-3xl"
        >
          A globe view, node graph, and AI matching help you find aligned people around you—privacy-first
          and built for real connections.
        </motion.p>

        <motion.form
          {...fadeUp(0.3)}
          className="liquid-glass rounded-full p-2 max-w-lg w-full flex items-center gap-2"
        >
          <input
            type="email"
            required
            placeholder="Enter your email"
            className="flex-1 bg-transparent text-sm px-4 py-3 outline-none placeholder:text-muted-foreground"
          />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="bg-foreground text-background rounded-full px-8 py-3 text-sm font-medium tracking-[0.08em]"
          >
            JOIN WAITLIST
          </motion.button>
        </motion.form>
      </div>
    </section>
  );
}
