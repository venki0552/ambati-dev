import type { ReactNode } from "react"
import { ArrowUpRight, Mail } from "lucide-react"
import { hero, site } from "@/content/content"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const lampColor = { go: "var(--go)", signal: "var(--signal)" } as const
const nameDelay = ["", "[animation-delay:80ms]", "[animation-delay:160ms]"]
const lampDelay = ["[animation-delay:550ms]", "[animation-delay:700ms]", "[animation-delay:850ms]"]

/** Hero: name + lamps + intro + CTAs on the left, the random live demo on the right (SPEC §3 row 1). */
export function Hero({ demo }: { demo: ReactNode }) {
  return (
    <section id="top" aria-labelledby="hero-name" className="flex flex-wrap items-start gap-12 pt-[72px] pb-16 max-sm:pt-12">
      <div className="min-w-0 flex-[1_1_460px]">
        <p className="anim-fade-up m-0 mb-[22px] font-mono text-xs tracking-[0.12em] text-signal-text [animation-delay:300ms]">
          {hero.eyebrow}
        </p>
        <h1 id="hero-name" className="m-0 font-display text-display font-black uppercase">
          {hero.nameLines.map((line, i) => (
            <span key={line} className={cn("anim-rise block", nameDelay[i], i === 2 && "text-signal-text")}>
              {line}
            </span>
          ))}
        </h1>

        <ul aria-label="Core stack" className="m-0 mt-7 flex list-none flex-wrap gap-x-[22px] gap-y-2.5 p-0 font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
          {hero.lamps.map((lamp, i) => (
            <li key={lamp.label} className={cn("anim-lamp flex items-center gap-2", lampDelay[i])}>
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{ background: lampColor[lamp.tone], boxShadow: `0 0 10px ${lampColor[lamp.tone]}` }}
              />
              {lamp.label}
            </li>
          ))}
        </ul>

        <p className="anim-fade-up m-0 mt-7 max-w-[560px] text-lead [animation-delay:300ms]">{hero.intro}</p>

        <div className="anim-fade-up mt-8 flex flex-wrap gap-3 [animation-delay:300ms]">
          <Button asChild variant="signal" size="lg">
            <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer">
              {hero.ctas.linkedin}
              <ArrowUpRight aria-hidden="true" strokeWidth={2.2} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={site.links.email}>
              <Mail aria-hidden="true" className="size-[18px]" />
              {hero.ctas.email}
            </a>
          </Button>
        </div>
      </div>

      <div className="anim-fade-up min-w-0 flex-[1_1_440px] [animation-delay:1s]">{demo}</div>
    </section>
  )
}
