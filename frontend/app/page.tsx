import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { SearchSection } from "@/components/search-section";
import { MissionSection } from "@/components/mission-section";
import { SolutionSection } from "@/components/solution-section";
import { CtaSection } from "@/components/cta-section";

export default function Home() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <main className="flex flex-col">
        <Hero />
        <SearchSection />
        <MissionSection />
        <SolutionSection />
        <CtaSection />
      </main>
  {/* Footer moved into CtaSection */}
    </div>
  );
}
