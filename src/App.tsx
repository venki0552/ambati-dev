import { LazyToaster } from "@/components/site/LazyToaster"
import { TopBar } from "@/components/site/TopBar"
import { TrackRail } from "@/components/site/TrackRail"
import { Hero } from "@/components/site/Hero"
import { SignalStrip } from "@/components/site/SignalStrip"
import { Work } from "@/components/site/Work"
import { Projects } from "@/components/site/Projects"
import { Writing } from "@/components/site/Writing"
import { Stack } from "@/components/site/Stack"
import { About } from "@/components/site/About"
import { Contact } from "@/components/site/Contact"
import { Footer } from "@/components/site/Footer"
import { FisDiagrams } from "@/components/diagrams/FisDiagrams"
import { RagDiagram } from "@/components/diagrams/RagDiagram"
import { HeroDemo } from "@/components/lab/HeroDemo"
import { HeroDemoStatic } from "@/components/lab/HeroDemoStatic"
import { LabSlot } from "@/components/lab/LabSlot"
import { useHeroDemo } from "@/hooks/useHeroDemo"

export default function App() {
  const { hero, tryAnother } = useHeroDemo()
  return (
    <>
      <a
        href="#work"
        className="sr-only z-[60] rounded-lg bg-signal px-4 py-3 font-bold text-on-signal focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to work
      </a>
      <TrackRail />
      <div className="mx-auto max-w-[1200px] px-[clamp(18px,4vw,32px)]">
        <TopBar />
        <main>
          <Hero demo={hero ? <HeroDemo id={hero.heroId} onTryAnother={tryAnother} /> : <HeroDemoStatic />} />
          <SignalStrip />
          <LabSlot />
          <Work fisDiagrams={<FisDiagrams />} />
          <Projects ragDiagram={<RagDiagram />} />
          <Writing />
          <Stack />
          <About />
          <Contact />
        </main>
        <Footer />
      </div>
      <LazyToaster />
    </>
  )
}
