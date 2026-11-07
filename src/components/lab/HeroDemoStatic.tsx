import { RotateCw } from "lucide-react"
import { hero } from "@/content/content"
import { DEMOS } from "@/lab/registry"
import { DemoSkeleton } from "@/components/lab/DemoSkeleton"
import { HeroNote } from "@/components/lab/HeroNote"

/**
 * Prerendered stand-in for the hero demo card. All three skeletons are in the HTML; CSS shows
 * the one matching <html data-hero-demo> (picked pre-paint), so the reserved height is right
 * before any JS runs and swapping in the live demo causes no layout shift.
 */
export function HeroDemoStatic() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-glow" aria-busy="true">
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-surface-2 py-2.5 pr-3 pl-5">
        <p className="m-0 font-mono text-[11px] tracking-[0.1em] text-muted-foreground">LIVE DEMO · PICKED AT RANDOM</p>
        <span className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-surface px-3.5 font-mono text-[11px] tracking-[0.06em] text-muted-foreground">
          <RotateCw aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
          {hero.ctas.tryAnother}
        </span>
      </div>
      {DEMOS.map((d) => (
        <div key={d.id} data-hero-skeleton={d.id}>
          <DemoSkeleton id={d.id} />
          <HeroNote id={d.id} />
        </div>
      ))}
    </div>
  )
}
