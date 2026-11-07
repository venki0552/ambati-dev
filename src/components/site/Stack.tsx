import { sections, stack } from "@/content/content"
import { SectionPlate } from "@/components/site/primitives"

/** Skill groups from the résumé, as mono lines (design/Main.dc.html "Stack"). */
export function Stack() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="scroll-mt-6 pt-[88px] pb-6">
      <SectionPlate section={sections.stack} className="mb-8" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-x-8 gap-y-7 font-mono text-xs">
        {stack.map((g) => (
          <div key={g.name}>
            <h3 className="m-0 mb-2.5 text-xs font-normal tracking-[0.12em] text-signal-text">{g.name}</h3>
            <p className="m-0 leading-[2]">{g.items.join(" · ")}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
