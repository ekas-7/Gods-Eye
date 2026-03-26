"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import Image from "next/image";

// use a static image from the public folder (note: folder is `assests` in public/)
const imageSrc = "/assests/footer.png";

export function CtaSection() {

  return (
    <section className="relative overflow-hidden border-t border-border/30">
      <div className="relative w-full aspect-video">
        <Image
          src={imageSrc}
          alt="background"
          className="object-cover opacity-60"
          fill
          priority
        />
        <div className="absolute inset-0 bg-background/45 z-[1]" />

        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center text-center gap-6 px-8 md:px-28">
        

        <motion.h3
          {...fadeUp(0.05)}
          className="text-4xl md:text-5xl font-medium"
        >
          Start your <span className="italic font-serif font-normal">God Eye</span> journey
        </motion.h3>

        <motion.p {...fadeUp(0.1)} className="text-muted-foreground max-w-2xl">
          Join the waitlist to explore the globe, graph, and AI matches built for nearby discovery.
        </motion.p>

        <motion.div {...fadeUp(0.15)} className="flex flex-col sm:flex-row gap-4">
          <button className="bg-foreground text-background rounded-lg px-8 py-3.5 text-sm font-medium">
            Join Waitlist
          </button>
          <button className="liquid-glass rounded-lg px-8 py-3.5 text-sm font-medium">
            View Globe
          </button>
        </motion.div>
        </div>
      </div>


    </section>
  );
}
