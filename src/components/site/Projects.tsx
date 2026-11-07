import type { ReactNode } from "react"
import { projects, sections } from "@/content/content"
import { ExtLink, Eyebrow, SectionPlate } from "@/components/site/primitives"

/** Memory Palace (featured, with its pipeline) + slg, PageSkim, DevTools (SPEC §3 row 5). */
export function Projects({ ragDiagram }: { ragDiagram: ReactNode }) {
  const [featured, ...rest] = projects
  return (
    <section id="projects" aria-labelledby="projects-title" className="scroll-mt-6 pt-[88px] pb-6">
      <SectionPlate section={sections.projects} className="mb-10" />

      {featured && (
        <article className="mb-5 rounded-[18px] border border-line bg-surface p-7 max-sm:p-5">
          <Eyebrow className="mb-2.5 tracking-[0.1em]">{featured.tags}</Eyebrow>
          <h3 className="m-0 font-display text-[40px] leading-[1.05] font-extrabold uppercase">{featured.name}</h3>
          <p className="m-0 mt-2.5 mb-5 max-w-[780px]">{featured.description}</p>
          <div className="mb-[22px]">{ragDiagram}</div>
          <LinkRow links={featured.links} />
        </article>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
        {rest.map((p) => (
          <article key={p.id} className="flex flex-col rounded-[18px] border border-line bg-surface p-6">
            <Eyebrow className="mb-2.5 tracking-[0.1em]">{p.tags}</Eyebrow>
            <h3 className="m-0 font-display text-[32px] leading-[1.05] font-extrabold uppercase">{p.name}</h3>
            {p.subtitle && <p className="m-0 mt-1 font-mono text-xs text-muted-foreground">{p.subtitle}</p>}
            <p className="m-0 mt-3 mb-4 grow">{p.description}</p>
            {p.metric && (
              <p className="m-0 mb-3.5 font-display text-[28px] leading-none font-extrabold">
                {p.metric.value}{" "}
                <span className="font-mono text-[11px] font-normal tracking-[0.08em] text-muted-foreground">
                  {p.metric.label}
                </span>
              </p>
            )}
            <LinkRow links={p.links} />
          </article>
        ))}
      </div>
    </section>
  )
}

function LinkRow({ links }: { links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-[22px] gap-y-1 font-mono text-xs tracking-[0.04em]">
      {links.map((l) => (
        <ExtLink key={l.href} href={l.href} className="py-2.5">
          {l.label}
        </ExtLink>
      ))}
    </div>
  )
}
