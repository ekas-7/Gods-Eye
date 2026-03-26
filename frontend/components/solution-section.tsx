"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

const solutionVideo =
   "/missonSection.mp4";

const features = [
  {
    title: "Recruiters",
    description: "Find candidates who genuinely fit your team's culture and skills — not just keyword matches.",
  },
  {
    title: "Soulmates",
    description: "Meet people who share your values and passions, not just your zip code.",
  },
  {
    title: "Friends",
    description: "Discover real friendships with people nearby who vibe with who you actually are.",
  },
  {
    title: "Collaborators",
    description: "Link up with builders, creatives, and founders who are working on the same problems as you.",
  },
];

export function SolutionSection() {
  return (
    <section className="relative px-8 md:px-28 py-32 md:py-44 border-t border-border/30 space-y-10">
      <div className="space-y-4">
        <motion.p {...fadeUp(0)} className="text-xs tracking-[3px] uppercase text-muted-foreground">
          Solution
        </motion.p>
        <motion.h3
          {...fadeUp(0.05)}
          className="text-4xl md:text-6xl font-medium max-w-4xl"
        >
          If you don't connect with the right people,<span className="italic font-serif font-normal">someone else</span> will.
        </motion.h3>
      </div>

      <motion.div
        {...fadeUp(0.1)}
        className="w-full overflow-hidden rounded-2xl aspect-[3/1] bg-black/40"
      >
        <video
          src={solutionVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </motion.div>

      <div className="grid md:grid-cols-4 gap-8 pt-4">
        {features.map((feature, idx) => (
          <motion.div key={feature.title} {...fadeUp(0.15 + idx * 0.05)} className="space-y-2">
            <h4 className="font-semibold text-base">{feature.title}</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
