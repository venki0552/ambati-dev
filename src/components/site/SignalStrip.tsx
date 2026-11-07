import { useEffect, useRef, useState } from "react"
import { useNearViewport } from "@/hooks/useNearViewport"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { stats, type Stat } from "@/content/content"
import { cn } from "@/lib/utils"

/** Counts up once when 50% visible (SPEC §2.4.3). Reduced motion → final value only. */
function CountUp({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useNearViewport(ref, "0px", 0.5)
  const reduce = useReducedMotion()
  const [n, setN] = useState(stat.value)

  useEffect(() => {
    if (!inView || reduce) return
    const start = performance.now()
    const DURATION = 750
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / DURATION)
      const eased = 1 - Math.pow(1 - k, 3) // ease-out
      setN(Math.round(stat.value * eased))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduce, stat.value])

  return (
    <span ref={ref} aria-hidden="true" className="tabular-nums">
      {stat.prefix}
      {n}
      {stat.suffix}
    </span>
  )
}

export function SignalStrip() {
  return (
    <section aria-label="Key numbers" className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] border-y border-line max-sm:grid-cols-2">
      {stats.map((s) => (
        <div key={s.label} className="pt-[26px] pr-5 pb-[22px]">
          <p className={cn("m-0 font-display text-[52px] leading-none font-extrabold", s.highlight && "text-signal-text")}>
            <CountUp stat={s} />
            <span className="sr-only">{s.full}</span>
          </p>
          <p className="m-0 mt-2 font-mono text-[11px] tracking-[0.08em] text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </section>
  )
}
