import { useEffect, useState } from "react"
import { useScrollProgress } from "@/hooks/useScrollProgress"
import { sections } from "@/content/content"
import { cn } from "@/lib/utils"

/**
 * Track rail (SPEC §2.3 / §2.4.2).
 *  ≥1024px: a thin vertical track in the left gutter that draws itself as you scroll
 *           (SVG pathLength + dash offset driven by scroll progress), one station per section; the current
 *           station lights amber. Decorative: the top-bar nav is the accessible route.
 *  <1024px: collapses into a 2px amber progress bar at the top of the screen.
 */

const STATIONS = Object.values(sections)
const TOP = 96 // px from the top of the viewport
const BOTTOM = 48

type Station = { id: string; line: string; title: string; at: number }

function measure(): Station[] {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
  return STATIONS.flatMap((s) => {
    const el = document.getElementById(s.id)
    if (!el) return []
    const top = el.getBoundingClientRect().top + window.scrollY
    return [{ ...s, at: Math.min(1, Math.max(0, (top - window.innerHeight * 0.35) / max)) }]
  })
}

export function TrackRail() {
  const progress = useScrollProgress()
  const [stations, setStations] = useState<Station[]>([])

  useEffect(() => {
    const update = () => setStations(measure())
    update()
    const ro = new ResizeObserver(update)
    ro.observe(document.body)
    return () => ro.disconnect()
  }, [])

  let active = "top"
  for (const s of stations) if (progress + 0.001 >= s.at) active = s.id

  return (
    <>
      {/* Phone / tablet: top progress bar */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-signal lg:hidden"
        style={{ transform: `scaleX(${progress})` }}
      />

      {/* Desktop: the track */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[max(10px,calc((100vw-1200px)/2-44px))] z-40 hidden w-3 lg:block"
        style={{ top: TOP, bottom: BOTTOM }}
      >
        <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 12 100">
          <line x1="6" y1="0" x2="6" y2="100" stroke="var(--line)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {/* pathLength=1 normalises the dash maths: the drawn part = scroll progress */}
          <line
            x1="6"
            y1="0"
            x2="6"
            y2="100"
            stroke="var(--signal)"
            strokeWidth="2"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - progress}
          />
        </svg>
        {stations.map((s) => {
          const on = s.id === active
          return (
            <span
              key={s.id}
              title={`${s.line} · ${s.title}`}
              className={cn(
                "absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-[background-color,box-shadow,border-color] duration-300",
                on ? "border-signal bg-signal shadow-[0_0_10px_var(--signal)]" : "border-line bg-bg",
              )}
              style={{ top: `${s.at * 100}%` }}
            />
          )
        })}
      </div>
    </>
  )
}
