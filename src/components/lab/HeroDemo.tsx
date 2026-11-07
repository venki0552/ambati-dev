import { Suspense } from "react"
import { RotateCw } from "lucide-react"
import type { DemoId } from "@/content/content"
import { hero, lab } from "@/content/content"
import { DEMOS } from "@/lab/registry"
import { demoComponents } from "@/components/lab/demos"
import { DemoSkeleton } from "@/components/lab/DemoSkeleton"
import { HeroNote } from "@/components/lab/HeroNote"
import { Button } from "@/components/ui/button"

/** The hero's live demo card: "LIVE DEMO n OF 3 · PICKED AT RANDOM" + Try another (design/Main.dc.html). */
export function HeroDemo({ id, onTryAnother }: { id: DemoId; onTryAnother: () => void }) {
  const Demo = demoComponents[id]
  const n = DEMOS.findIndex((d) => d.id === id) + 1
  return (
    <div
      className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-glow"
      data-testid="hero-demo"
      data-demo={id}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-surface-2 py-2.5 pr-3 pl-5">
        <p className="m-0 font-mono text-[11px] tracking-[0.1em] text-muted-foreground">{lab.heroLabel(n, DEMOS.length)}</p>
        <Button variant="plate" size="sm" onClick={onTryAnother} aria-label={`Try another demo (now showing ${lab.notes[id].label.toLowerCase()})`}>
          <RotateCw aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
          {hero.ctas.tryAnother}
        </Button>
      </div>
      <div key={id} className="anim-demo-in">
        <Suspense fallback={<DemoSkeleton id={id} />}>
          <Demo placement="hero" />
        </Suspense>
        <HeroNote id={id} />
      </div>
    </div>
  )
}
