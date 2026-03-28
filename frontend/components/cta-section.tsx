"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import Image from "next/image";
import Link from "next/link";

// use a static image from the public folder (note: folder is `assests` in public/)
const imageSrc = "/assests/footer.png";

export function CtaSection() {

  return (
    <section className="relative overflow-hidden">
      {/* Gradient fade from the section above into the image */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-background to-transparent z-10" />

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
            <Link href="/discover" className="liquid-glass rounded-lg px-8 py-3.5 text-sm font-medium">
              View Globe
            </Link>
          </motion.div>
        </div>

        {/* Gradient fade out at the bottom of the image into the footer */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[3]" />
      </div>

      {/* Footer */}
      <div className="relative z-[4] border-t border-border/20 bg-transparent px-8 md:px-28 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tracking-wide">
          © {new Date().getFullYear()} God Eye. All rights reserved.
        </span>
        <span className="text-xs text-muted-foreground">
          Built to find the people who matter.
        </span>
      </div>
    </section>
  );
}
