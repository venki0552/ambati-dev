import type { ReactNode } from "react"
import { experience, sections } from "@/content/content"
import { SectionPlate } from "@/components/site/primitives"
import { cn } from "@/lib/utils"

/** Work timeline on the track: FIS → Zenmonics → JNET (SPEC §3 row 4). */
export function Work({ fisDiagrams }: { fisDiagrams: ReactNode }) {
  return (
    <section id="work" aria-labelledby="work-title" className="scroll-mt-6 pt-[88px] pb-6">
      <SectionPlate section={sections.work} className="mb-10" />
      <ol className="m-0 ml-[9px] list-none border-l-2 border-line p-0 pl-[34px] max-sm:pl-6">
        {experience.map((job, i) => {
          const last = i === experience.length - 1
          return (
            <li key={job.company} className={cn("relative", !last && "pb-16")}>
              {/* Station marker on the track; the current job is lit amber */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-2 -left-[46px] size-[18px] rounded-full border-4 bg-bg max-sm:-left-[34px]",
                  job.current ? "border-signal shadow-[0_0_12px_var(--signal)]" : "border-muted-foreground",
                )}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1.5">
                <h3 className="m-0 font-display text-[38px] leading-[1.05] font-extrabold uppercase max-sm:text-[32px]">
                  {job.company}{" "}
                  <span className="font-sans text-lg font-medium normal-case text-muted-foreground">
                    {job.role}
                    {job.note ? ` · ${job.note}` : ""}
                  </span>
                </h3>
                <p
                  className={cn(
                    "m-0 font-mono text-xs tracking-[0.08em]",
                    job.current ? "text-signal-text" : "text-muted-foreground",
                  )}
                >
                  <time>{job.start}</time> — <time>{job.end}</time>
                </p>
              </div>
              {job.summary && <p className="m-0 mt-2.5 mb-4 max-w-[820px] text-muted-foreground">{job.summary}</p>}
              <ul className={cn("m-0 flex max-w-[900px] list-disc flex-col gap-1.5 pl-5 marker:text-muted-foreground", !job.summary && "mt-3.5")}>
                {job.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              {job.current && fisDiagrams}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
