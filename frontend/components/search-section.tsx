"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

const platforms = [
  {
    name: "Globe View",
    description: "See nearby interest clusters on a live globe to spot who’s around you.",
    icon: "/assests/image4.png",
  },
  {
    name: "Node Graph",
    description: "Visualize relationships and mutual interests with a clean graph view.",
    icon: "/assests/image5.png",
  },
  {
    name: "AI Matching",
    description: "Embeddings-driven matching surfaces the people most aligned to you.",
    icon: "/assests/image6.png",
  },
];

export function SearchSection() {
  return (
    <section className="relative px-8 md:px-28 pt-52 md:pt-64 pb-6 md:pb-9 text-center">
      <motion.h2
        {...fadeUp(0)}
        className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-[-2px]"
      >
        Discovery has <span className="italic font-serif font-normal">changed.</span> Are you in?
      </motion.h2>
      <motion.p
        {...fadeUp(0.1)}
        className="text-muted-foreground text-lg max-w-2xl mx-auto mt-6 mb-24"
      >
        God Eye blends spatial context, graph intelligence, and AI so you can find aligned people nearby
        without drowning in noise.
      </motion.p>

      <div className="grid md:grid-cols-3 gap-12 md:gap-8 mb-20">
        {platforms.map((platform, idx) => (
          <motion.div
            key={platform.name}
            {...fadeUp(0.15 + idx * 0.05)}
            className="flex flex-col items-center gap-5"
          >
            
            <div className="w-[200px] h-[200px] relative rounded-xl overflow-hidden border shadow-[0_0_20px_rgba(34,211,238,0.8)] bg-cyan-400/10 ">
              {platform.icon.startsWith("http") ? (
                // Use plain img for external URLs (Unsplash) to avoid Next/Image host config
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={platform.icon}
                  alt={`${platform.name} icon`}
                  className="object-cover w-full h-full"
                  loading="eager"
                />
              ) : (
                <Image
                  src={platform.icon}
                  alt={`${platform.name} icon`}
                  fill
                  priority
                  className="object-cover"
                  sizes="200px"
                />
              )}
            </div>
            <div className="text-base font-semibold">{platform.name}</div>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
              {platform.description}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.p {...fadeUp(0.25)} className="text-muted-foreground text-sm">
        Cutting edge tech + human curation = the most magical, serendipitous, and real connections you’ve ever made.
      </motion.p>
    </section>
  );
}
