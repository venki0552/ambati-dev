import { lazy, Suspense, useRef } from "react"
import { configLab, sections } from "@/content/content"
import { SectionPlate } from "@/components/site/primitives"
import { useNearViewport } from "@/hooks/useNearViewport"

const ConfigScreensDemo = lazy(() => import("@/components/lab/ConfigScreensDemo"))

/** Reserved space while the playground chunk loads (no layout shift). */
function Placeholder() {
  return <div aria-hidden="true" className="min-h-[640px] bg-surface" />
}

/**
 * LINE 02 · The Lab: the config-driven screens playground. The hero already runs the three
 * back-end demos, so this section shows the front-end architecture instead.
 * Heading, intro and notes are prerendered; the interactive card loads when it nears the viewport.
 */
export function LabSlot() {
  const ref = useRef<HTMLDivElement>(null)
  const near = useNearViewport(ref, "900px")
  return (
    <section id="lab" aria-labelledby="lab-title" className="scroll-mt-6 pt-[88px] pb-6">
      <SectionPlate section={sections.lab} className="mb-4" />
      <p className="m-0 mb-7 max-w-[680px] text-lg text-muted-foreground">{configLab.intro}</p>

      <div ref={ref} className="overflow-hidden rounded-[18px] border border-line" data-testid="config-lab">
        {near ? (
          <Suspense fallback={<Placeholder />}>
            <ConfigScreensDemo />
          </Suspense>
        ) : (
          <Placeholder />
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div>
          <p className="m-0 mb-2 font-mono text-[11px] tracking-[0.12em] text-signal-text">WHERE I USE THIS</p>
          <p className="m-0 text-[17px]">{configLab.use}</p>
        </div>
        <div>
          <p className="m-0 mb-2 font-mono text-[11px] tracking-[0.12em] text-signal-text">WHAT TO TRY</p>
          <p className="m-0 text-[17px] text-muted-foreground">{configLab.tryIt}</p>
        </div>
        <p className="m-0 self-start border-line pt-0 font-mono text-[11px] leading-[1.7] text-muted-foreground md:border-l md:pl-6">
          {configLab.disclaimer}
        </p>
      </div>
    </section>
  )
}
