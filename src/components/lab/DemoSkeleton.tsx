import type { DemoId } from "@/content/content"
import { lab } from "@/content/content"
import { demoMinHeight } from "@/components/lab/demos"
import { cn } from "@/lib/utils"

/** Placeholder with the demo's title and dark lamps, at the demo's final height (no CLS). */
export function DemoSkeleton({ id }: { id: DemoId }) {
  return (
    <div aria-busy="true" className={cn("bg-surface p-[22px]", demoMinHeight[id])}>
      <p className="m-0 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">LOADING DEMO…</p>
      <p className="m-0 mt-1 font-display text-[32px] leading-none font-extrabold uppercase">{lab.notes[id].label}</p>
      <div aria-hidden="true" className="mt-6 flex gap-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-[18px] rounded-full bg-line" />
        ))}
      </div>
      <div aria-hidden="true" className="mt-6 h-[70px] rounded-lg bg-surface-2" />
    </div>
  )
}
