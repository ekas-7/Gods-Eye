import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MapView } from "@/components/map-view";

export default async function DiscoverPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="God Eye" className="w-5 h-5 object-contain opacity-60" />
          <span className="text-sm font-medium text-muted-foreground tracking-tight">Discover</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          10 km radius
        </div>
      </div>

      {/* Mapbox 3D map */}
      <div className="flex-1 relative">
        <MapView />
      </div>

      {/* Bottom match feed hint */}
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-8">
        <div
          className="rounded-2xl border border-white/10 px-5 py-4 flex items-center justify-between"
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)" }}
        >
          <div>
            <p className="text-sm font-medium text-foreground/80">Match feed</p>
            <p className="text-xs text-muted-foreground mt-0.5">AI-ranked by semantic alignment</p>
          </div>
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40">
            <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3v10M3 8l5 5 5-5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
