import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  CAPACITY,
  DEFAULT_BURST,
  REFILL_INTERVAL_MS,
  bucketLabel,
  burst,
  createTokenBucket,
  refillLabel,
  refillProgress,
  reset,
  sendRequest,
  tick,
  type TokenBucketState,
} from "@/lab/tokenBucket"
import { getDemo } from "@/lab/registry"
import { Button } from "@/components/ui/button"
import { DemoBody, DemoButton, DemoHeading, EventLog, ResetButton, StatusLine } from "@/components/lab/parts"
import type { DemoProps } from "@/components/lab/demos"
import { demoMinHeight } from "@/components/lab/demos"
import { useReducedMotion } from "@/hooks/useReducedMotion"

/**
 * Token bucket (SPEC §4.3, design/TokenBucket.dc.html). Capacity 5, +1 token / 2s,
 * Burst ×10 → 5 × 200 + 5 × 429. Tokens are brass railway tokens that drop into their slots.
 * Logic: src/lab/tokenBucket.ts.
 */
export default function TokenBucketDemo({ placement }: DemoProps) {
  const meta = getDemo("token-bucket")
  const reduce = useReducedMotion()
  const [s, setS] = useState<TokenBucketState>(() => createTokenBucket(Date.now()))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = window.setInterval(() => {
      const n = Date.now()
      setNow(n)
      setS((prev) => tick(prev, n))
    }, 200)
    return () => window.clearInterval(t)
  }, [])

  const view = tick(s, now)
  const Heading = placement === "hero" ? "h2" : "h3"
  const st = view.status

  return (
    <DemoBody className={demoMinHeight["token-bucket"]}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <DemoHeading kicker={meta.eyebrow} title={meta.title} as={Heading} />
        <p className="m-0 text-right font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
          CAPACITY {CAPACITY}
          <br />
          REFILL 1 TOKEN / {REFILL_INTERVAL_MS / 1000}s
        </p>
      </div>

      <div
        role="img"
        aria-label={bucketLabel(view)}
        className="mt-6 mb-2.5 flex items-center gap-3 rounded-[14px] border-2 border-line bg-surface-2 p-4 max-sm:gap-2 max-sm:p-3"
      >
        {Array.from({ length: CAPACITY }, (_, i) => (
          <span
            key={i}
            className="relative size-11 shrink-0 rounded-full border-2 border-dashed border-line max-sm:size-9"
          >
            <AnimatePresence initial={false}>
              {i < view.tokens && (
                <motion.span
                  key="token"
                  className="absolute -inset-0.5 rounded-full border-2 border-brass-ring bg-signal shadow-[0_0_12px_rgb(255_176_32/0.35)]"
                  initial={reduce ? false : { y: -18, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { y: -10, opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 520, damping: 26 }}
                >
                  <span className="absolute inset-[7px] rounded-full border-2 border-brass-ring max-sm:inset-[5px]" />
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        ))}
        <span className="ml-auto font-display text-[34px] leading-none font-extrabold tabular-nums">
          {view.tokens}/{CAPACITY}
        </span>
      </div>

      <div aria-hidden="true" className="mb-1.5 h-1 overflow-hidden rounded-sm bg-line">
        <div className="h-1 bg-signal transition-[width] duration-200 ease-linear" style={{ width: `${refillProgress(view, now) * 100}%` }} />
      </div>
      <p className="m-0 mb-[18px] font-mono text-[10px] tracking-[0.06em] text-muted-foreground">{refillLabel(view, now)}</p>

      <div className="flex flex-wrap gap-2.5">
        <Button variant="signal" size="md" className="px-[18px] text-[15px]" onClick={() => setS((p) => sendRequest(p, Date.now()).state)}>
          Send request
        </Button>
        <DemoButton tone="ink" className="font-bold" onClick={() => setS((p) => burst(p, DEFAULT_BURST, Date.now()).state)}>
          Burst ×{DEFAULT_BURST}
        </DemoButton>
        <ResetButton onClick={() => setS((p) => reset(p, Date.now()))} />
      </div>

      <StatusLine code={st?.code ?? "—"} text={st?.text ?? "No requests yet"} tone={st?.tone ?? "muted"} />
      <EventLog entries={view.log} label="Token bucket event log" max={4} minH="min-h-[96px]" />
    </DemoBody>
  )
}
