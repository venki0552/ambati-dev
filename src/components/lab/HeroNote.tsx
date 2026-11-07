import type { DemoId } from "@/content/content"
import { lab } from "@/content/content"

/** "Where I use this" under the hero demo: ties each demo back to the résumé (moved from the old Lab aside). */
export function HeroNote({ id }: { id: DemoId }) {
  return (
    <div className="border-t border-line bg-surface-2 px-5 py-3.5 max-sm:px-4">
      <p className="m-0 mb-1 font-mono text-[10px] tracking-[0.12em] text-signal-text">WHERE I USE THIS</p>
      <p className="m-0 text-sm leading-normal">{lab.notes[id].use}</p>
    </div>
  )
}
