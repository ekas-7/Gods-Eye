"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useMemo, useRef, useState, useEffect } from "react";
import { fadeUp } from "@/lib/animations";

const missionVideo =
  "/missonSection.mp4";

const highlightWords = new Set(["globe", "graph", "match", "privacy"]);

const paragraph1 =
  "We are building God Eye a space where a live globe, a node graph, and AI matching work together so you discover nearby people by interest with clarity.";

const paragraph2 =
  "Privacy first, signal over noise, and tools that turn proximity into meaningful conversations instead of endless feeds.";

function getOpacity(progress: number, idx: number, total: number) {
  const start = idx / total;
  const end = (idx + 1) / total;
  const t = Math.min(Math.max((progress - start) / (end - start), 0), 1);
  return 0.15 + t * (1 - 0.15);
}

export function MissionSection() {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { scrollYProgress } = useScroll({ container: ref, target: ref, offset: ["start end", "end start"] });
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setProgress(latest);
  });

  useEffect(() => {
    // Try to programmatically start playback. Some browsers block autoplay unless
    // playback is initiated or meets autoplay rules (muted). We catch the promise
    // rejection so it doesn't throw in older browsers.
    const v = videoRef.current;
    if (!v) return;
    const p = v.play();
    if (p && typeof p.then === "function") {
      p.catch((err) => {
        // Playback was prevented. We'll fall back to showing a static background.
        // Keep the error for debugging.
        // eslint-disable-next-line no-console
        console.debug("Video play prevented:", err);
        setVideoError(true);
      });
    }
  }, []);

  const words1 = useMemo(() => paragraph1.split(" "), []);
  const words2 = useMemo(() => paragraph2.split(" "), []);

  return (
    <section
      ref={ref}
      className="relative px-8 md:px-28 pt-0 pb-32 md:pb-44 flex flex-col items-center gap-14"
    >
      <motion.div {...fadeUp(0)} className="absolute inset-0 -z-20">
        {!videoError ? (
          <video
            ref={videoRef}
            preload="auto"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover pointer-events-none"
            onError={() => setVideoError(true)}
          >
            <source src={missionVideo} type="video/mp4" />
            {/* fallback text for very old browsers */}
            Your browser does not support the video tag.
          </video>
        ) : (
          // fallback: use a static image from public assets if the video can't play
          <div
            className="w-full h-full bg-center bg-cover pointer-events-none"
            style={{ backgroundImage: `url('/assests/footer.png')` }}
            aria-hidden="true"
          />
        )}
      </motion.div>

    {/* subtle overlay so foreground text remains readable */}
    <div className="absolute inset-0 bg-black/30 -z-10 pointer-events-none" aria-hidden="true" />

    <motion.div {...fadeUp(0.2)} className="w-full max-w-5xl flex flex-col gap-10 text-center z-0">
        <motion.p
          className="text-2xl md:text-4xl lg:text-5xl font-medium tracking-[-1px] leading-tight"
        >
          {words1.map((word, idx) => (
            <motion.span
              key={`${word}-${idx}`}
              style={{ opacity: getOpacity(progress, idx, words1.length) }}
              className={highlightWords.has(word.replace(/[^a-zA-Z]/g, "")) ? "text-foreground" : "text-hero-subtle"}
            >
              {word}
              {" "}
            </motion.span>
          ))}
  </motion.p>

  <motion.p className="text-xl md:text-2xl lg:text-3xl font-medium text-hero-subtle">
          {words2.map((word, idx) => (
            <motion.span
              key={`${word}-${idx}`}
              style={{ opacity: getOpacity(progress, idx, words2.length) }}
              className="text-hero-subtle"
            >
              {word}
              {" "}
            </motion.span>
          ))}
        </motion.p>
      </motion.div>
    </section>
  );
}
