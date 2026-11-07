import { useCallback, useEffect, useLayoutEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  AUTO_TRAFFIC_INTERVAL_MS,
  BOUNCE_MS,
  TRAVEL_MS,
  WINDOW_SIZE,
  beginRequest,
  completeRequest,
  cooldownFraction,
  createCircuitBreaker,
  failSummary,
  reset,
  setFailureRate,
  statusText,
  tick,
  type BreakerMode,
  type CircuitBreakerState,
  type InFlightRequest,
} from "@/lab/circuitBreaker"
import { getDemo } from "@/lab/registry"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { DemoBody, DemoButton, DemoHeading, EventLog, Lamp, ResetButton } from "@/components/lab/parts"
import type { DemoProps } from "@/components/lab/demos"
import { demoMinHeight } from "@/components/lab/demos"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/**
 * Circuit breaker (SPEC §4.1, design/CircuitBreaker.dc.html).
 * Logic: src/lab/circuitBreaker.ts. This component only owns timers and renders state.
 * Like the design, one request travels at a time; Send is ignored while a dot is on the track.
 */

const MODE_LABEL: Record<BreakerMode, string> = { closed: "CLOSED", "half-open": "HALF-OPEN", open: "OPEN" }
const gateColor: Record<BreakerMode, string> = { closed: "var(--go)", "half-open": "var(--signal)", open: "var(--stop)" }

type Landed = { id: number; ok: boolean }

export default function CircuitBreakerDemo({ placement }: DemoProps) {
  const meta = getDemo("circuit-breaker")
  const reduce = useReducedMotion()
  const sliderId = useId()
  const [s, setS] = useState<CircuitBreakerState>(() => createCircuitBreaker(Date.now()))
  const [now, setNow] = useState(() => Date.now())
  const [auto, setAuto] = useState(false)
  const [landed, setLanded] = useState<Landed | null>(null)
  const timers = useRef<number[]>([])
  const stateRef = useRef(s)
  useLayoutEffect(() => {
    stateRef.current = s
  }, [s])

  // Clock: drives OPEN → HALF-OPEN and the countdown ring.
  useEffect(() => {
    const t = window.setInterval(() => {
      const n = Date.now()
      setNow(n)
      setS((prev) => tick(prev, n))
    }, 200)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const send = useCallback(() => {
    if (stateRef.current.inFlight.length > 0) return // one dot at a time (design)
    const started = beginRequest(stateRef.current, Date.now())
    stateRef.current = started.state
    setS(started.state)
    const req = started.request
    const travel = req.kind === "short-circuit" ? BOUNCE_MS : TRAVEL_MS
    timers.current.push(
      window.setTimeout(() => {
        const done = completeRequest(stateRef.current, req.id, Date.now(), Math.random)
        stateRef.current = done.state
        setS(done.state)
        if (done.outcome && done.outcome.kind !== "short-circuit") {
          setLanded({ id: req.id, ok: done.outcome.ok })
          timers.current.push(window.setTimeout(() => setLanded((l) => (l?.id === req.id ? null : l)), 600))
        }
      }, reduce ? 0 : travel),
    )
  }, [reduce])

  // Auto traffic: 1 request per AUTO_TRAFFIC_INTERVAL_MS while on.
  useEffect(() => {
    if (!auto) return
    const t = window.setInterval(send, AUTO_TRAFFIC_INTERVAL_MS)
    return () => window.clearInterval(t)
  }, [auto, send])

  const onReset = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setAuto(false)
    setLanded(null)
    setS((prev) => reset(prev, Date.now()))
  }

  const view = tick(s, now)
  const mode = view.mode
  const ring = cooldownFraction(view, now)
  const dot = view.inFlight[0]
  const cells = Array.from({ length: WINDOW_SIZE }, (_, i) => view.window[i])
  const Heading = placement === "hero" ? "h2" : "h3"

  return (
    <DemoBody className={demoMinHeight["circuit-breaker"]}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <DemoHeading kicker={meta.eyebrow} title={meta.title} as={Heading} />
        <div role="status" aria-label="Breaker state" className="flex gap-4">
          <Lamp label="CLOSED" on={mode === "closed"} tone="go" />
          <Lamp label="HALF-OPEN" on={mode === "half-open"} tone="signal" />
          <Lamp label="OPEN" on={mode === "open"} tone="stop" />
          <span className="sr-only">
            Breaker is <span data-testid="breaker-mode">{MODE_LABEL[mode]}</span>
          </span>
        </div>
      </div>

      {/* Track: Client → Breaker → Core banking API */}
      <div className="relative mt-[22px] mb-1.5 h-[70px]">
        <div aria-hidden="true" className="absolute top-5 right-[13px] left-[13px] h-0.5 bg-line" />
        <Station label="CLIENT" align="start" />
        <div className="absolute top-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
          <span aria-hidden="true" className="relative block size-[26px]">
            <span
              className="absolute inset-0 rounded-[7px] border-[3px] bg-surface transition-[border-color] duration-150"
              style={{ borderColor: gateColor[mode] }}
            />
            {/* Cooldown ring: drains over the 5s OPEN period (SPEC §4.1) */}
            {mode === "open" && (
              <svg className="absolute -inset-[7px] size-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="none" stroke="var(--line)" strokeWidth="2" />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="var(--stop)"
                  strokeWidth="2"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - ring}
                />
              </svg>
            )}
          </span>
          <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground">BREAKER</span>
        </div>
        <Station label="CORE BANKING API" align="end" />

        <div aria-hidden="true" className="absolute top-0 right-[13px] left-[13px] h-10">
          <AnimatePresence>
            {dot && <TravellingDot key={dot.id} req={dot} reduce={reduce} />}
            {landed && !landed.ok && (
              <motion.span
                key={`drop-${landed.id}`}
                className="absolute top-3.5 size-3.5 rounded-full bg-stop"
                style={{ left: "calc(100% - 7px)", boxShadow: "0 0 12px var(--stop)" }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: reduce ? 0 : 26, opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.5, ease: "easeIn" }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="m-0 mt-1 mb-3.5 text-base font-medium">{statusText(view, now)}</p>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">LAST 6 CALLS</span>
        <div className="flex gap-1.5" role="img" aria-label={`Last ${view.window.length} calls: ${view.window.filter((c) => c === "failure").length} failed`}>
          {cells.map((c, i) => (
            <span
              key={i}
              className={cn(
                "size-[18px] rounded border border-line transition-colors duration-150",
                c === "failure" ? "bg-stop" : c === "success" ? "bg-go" : "bg-transparent",
              )}
            />
          ))}
        </div>
        <span className="font-mono text-[10px] tracking-[0.06em] text-muted-foreground">{failSummary(view)}</span>
        <Sparkline points={view.rateHistory} />
      </div>

      <div className="mb-4">
        <label htmlFor={sliderId} className="block text-sm" id={`${sliderId}-label`}>
          Downstream failure rate: <strong>{view.failureRate}%</strong>
        </label>
        <Slider
          id={sliderId}
          aria-label="Downstream failure rate"
          min={0}
          max={100}
          step={10}
          value={[view.failureRate]}
          onValueChange={([v]) => setS((prev) => setFailureRate(prev, v ?? prev.failureRate))}
        />
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button variant="signal" size="md" className="px-[18px] text-[15px]" onClick={send}>
          Send request
        </Button>
        <DemoButton onClick={() => setAuto((a) => !a)} pressed={auto} tone={auto ? "signal" : "line"} className="font-medium">
          {auto ? "Auto traffic: on" : "Auto traffic: off"}
        </DemoButton>
        <ResetButton onClick={onReset} />
      </div>

      <EventLog entries={view.log} label="Circuit breaker event log" />
    </DemoBody>
  )
}

function Station({ label, align }: { label: string; align: "start" | "end" }) {
  return (
    <div className={cn("absolute top-2 flex flex-col gap-2", align === "start" ? "left-0 items-start" : "right-0 items-end")}>
      <span aria-hidden="true" className="size-[26px] rounded-[7px] border-2 border-text bg-surface" />
      <span
        className={cn(
          "font-mono text-[10px] tracking-[0.06em] text-muted-foreground sm:whitespace-nowrap",
          align === "end" ? "max-w-[80px] text-right sm:max-w-none" : "",
        )}
      >
        {label}
      </span>
    </div>
  )
}

/** A request dot: steel while travelling; short-circuits are red and bounce off the gate. */
function TravellingDot({ req, reduce }: { req: InFlightRequest; reduce: boolean }) {
  const blocked = req.kind === "short-circuit"
  const color = blocked ? "var(--stop)" : "var(--steel)"
  return (
    <motion.span
      className="absolute top-3.5 size-3.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 12px ${color}` }}
      initial={{ left: "calc(0% - 7px)", opacity: 1 }}
      animate={
        blocked
          ? { left: ["calc(0% - 7px)", "calc(50% - 21px)", "calc(38% - 7px)"] }
          : { left: "calc(100% - 7px)" }
      }
      exit={{ opacity: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : blocked
            ? { duration: BOUNCE_MS / 1000, times: [0, 0.7, 1], ease: "easeOut" }
            : { duration: TRAVEL_MS / 1000, ease: [0.4, 0, 0.2, 1] }
      }
    />
  )
}

/** Tiny failure-rate sparkline (SPEC §4.1). */
function Sparkline({ points }: { points: readonly number[] }) {
  if (points.length < 2) return null
  const w = 64
  const h = 18
  const d = points
    .map((p, i) => `${(i / (points.length - 1)) * w},${h - 1 - p * (h - 2)}`)
    .join(" ")
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="ml-auto overflow-visible" role="img" aria-label={`Failure rate trend, now ${Math.round((points.at(-1) ?? 0) * 100)}%`}>
      <polyline points={d} fill="none" stroke="var(--stop)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
