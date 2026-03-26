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

      <div className="relative z-10 w-full px-6 md:px-24 pb-16 flex flex-col items-center text-center gap-5">

        {/* Social proof */}
        <motion.div
          {...fadeUp(0.05)}
          className="liquid-glass rounded-full px-4 py-1.5 mb-2"
        >
          <p className="text-[11px] text-white/55 tracking-widest uppercase">
            2,000+ people exploring nearby connections
          </p>
        </motion.div>

        <motion.div
          {...fadeUp(0.1)}
          className="flex flex-col items-center text-center max-w-5xl mx-auto gap-0"
        >
          <h1
            className="text-7xl md:text-8xl lg:text-9xl font-light leading-[1.0]"
            style={{
              letterSpacing: "-0.04em",
              fontFamily: "var(--font-wide)",
              fontWeight: 300,
              background: "linear-gradient(170deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.3) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 4px 32px rgba(180,220,255,0.2))",
            }}
          >
            Discover people
          </h1>
          <h1
            className="text-7xl md:text-8xl lg:text-9xl font-light leading-[1.0]"
            style={{
              letterSpacing: "-0.04em",
              fontFamily: "var(--font-wide)",
              fontWeight: 300,
              background: "linear-gradient(170deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 4px 32px rgba(180,220,255,0.2))",
            }}
          >
            nearby by <span className="accent-italic lowercase">interest</span>
          </h1>
        </motion.div>

        <motion.p
          {...fadeUp(0.2)}
          className="text-base md:text-lg text-hero-subtle max-w-xl mt-2"
        >
          A globe view, node graph, and AI matching help you find aligned people around you—privacy-first
          and built for real connections.
        </motion.p>

        <motion.form
          {...fadeUp(0.3)}
          className="liquid-glass rounded-full p-1.5 max-w-md w-full flex items-center gap-2 mt-2"
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
