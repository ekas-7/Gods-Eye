"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const links = ["Home", "Globe", "Graph", "Onboarding", "Vision"];

export function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 px-8 md:px-28 py-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center">
          <div className="w-7 h-7 rounded-full border-2 border-foreground/60 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full border border-foreground/60" />
          </div>
        </div>
  <span className="font-semibold text-base tracking-tight">God Eye</span>
      </div>

      <div className="hidden md:flex items-center text-muted-foreground text-sm gap-2 font-medium opacity-80 tracking-tight">
        {links.map((link, idx) => (
          <div key={link} className="flex items-center gap-2">
            <button className="hover:text-foreground transition-colors text-[14px] font-medium tracking-tight">
              {link}
            </button>
            {idx !== links.length - 1 && <span className="text-xs">•</span>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {[
          {
            label: "Instagram",
            icon: (
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                <path d="M16.5 7.5h.01" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            ),
          },
          {
            label: "LinkedIn",
            icon: (
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M6.94 9.5V18" />
                <path d="M17 18v-4.5a3 3 0 0 0-6 0V18" />
                <circle cx="6.94" cy="6.5" r="1.25" />
                <path d="M9.5 10h1.99" />
              </svg>
            ),
          },
          {
            label: "Twitter",
            icon: (
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M22 5.5c-.7.3-1.4.5-2.1.6a3.2 3.2 0 0 0-5.6 2v.6a9.1 9.1 0 0 1-7.4-3.7s-3 6.8 3.7 9.6A9.5 9.5 0 0 1 2 16.6c6.7 3.8 15 0 15-8a3 3 0 0 0-.06-.6A5 5 0 0 0 22 5.5Z" />
              </svg>
            ),
          },
        ].map(({ icon, label }) => (
          <button
            key={label}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center liquid-glass text-foreground/80 hover:text-foreground transition-transform",
              "hover:scale-105"
            )}
            aria-label={label}
          >
            {icon}
          </button>
        ))}
      </div>
    </motion.nav>
  );
}
