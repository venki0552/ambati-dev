import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  OAUTH_STEPS,
  callApi,
  createOAuthDemo,
  fastForward,
  hasCode,
  hasToken,
  nextStep,
  preparePkce,
  redeemRefreshToken,
  reset,
  stealCode,
  toggleTamper,
  tokenView,
  type OAuthDemoState,
  type RandomBytes,
} from "@/lab/oauthPkce"
import { getDemo } from "@/lab/registry"
import { Button } from "@/components/ui/button"
import { DemoBody, DemoButton, DemoHeading, EventLog, ResetButton, StatusLine } from "@/components/lab/parts"
import type { DemoProps } from "@/components/lab/demos"
import { demoMinHeight } from "@/components/lab/demos"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/**
 * OAuth 2.0 + PKCE → JWT (SPEC §4.2, design/OAuthJwt.dc.html).
 * Real SHA-256 code_challenge and real HS256 signatures via WebCrypto, all in the browser.
 * Logic: src/lab/oauthPkce.ts + src/lab/jwt.ts.
 */

const randomBytes: RandomBytes = (n) => crypto.getRandomValues(new Uint8Array(n))
const ACTORS = ["BROWSER APP", "AUTH SERVER", "BANKING API"] as const
/** Which actor sends → receives on each step (index into ACTORS); equal = local action. */
const ROUTES: readonly [number, number][] = [
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 1],
  [0, 2],
]
const short = (v: string | null | undefined, n = 28) => (v ? (v.length > n + 2 ? `${v.slice(0, n)}…` : v) : "…")

export default function OAuthJwtDemo({ placement }: DemoProps) {
  const meta = getDemo("oauth-jwt")
  const reduce = useReducedMotion()
  const [s, setS] = useState<OAuthDemoState>(() => createOAuthDemo(Date.now()))
  const [busy, setBusy] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const ref = useRef(s)
  useLayoutEffect(() => {
    ref.current = s
  }, [s])
  const generation = useRef(0)

  /** Run one async transition; ignore clicks while busy and drop results that a Reset made stale. */
  const run = useCallback(async (fn: (st: OAuthDemoState) => Promise<OAuthDemoState> | OAuthDemoState) => {
    const gen = generation.current
    setBusy(true)
    try {
      const next = await fn(ref.current)
      if (gen !== generation.current) return
      ref.current = next
      setS(next)
      setNow(Date.now())
    } finally {
      if (gen === generation.current) setBusy(false)
    }
  }, [])

  useEffect(() => {
    void run((st) => preparePkce(st, randomBytes))
  }, [run])

  // Play all: one step every 900ms (design).
  useEffect(() => {
    if (!playing) return
    const t = window.setInterval(() => {
      if (ref.current.step >= 6) {
        setPlaying(false)
        return
      }
      void run((st) => nextStep(st, { now: Date.now(), randomBytes }))
    }, reduce ? 300 : 900)
    return () => window.clearInterval(t)
  }, [playing, run, reduce])

  const onReset = () => {
    generation.current += 1
    setPlaying(false)
    setBusy(false)
    const fresh = reset(ref.current, Date.now())
    ref.current = fresh
    setS(fresh)
    void run((st) => preparePkce(st, randomBytes))
  }

  const step = s.step
  const token = hasToken(s)
  const view = tokenView(s, now)
  const Heading = placement === "hero" ? "h2" : "h3"
  const activeRoute = step >= 1 ? ROUTES[step - 1] : undefined
  const st = s.status

  return (
    <DemoBody className={demoMinHeight["oauth-jwt"]}>
      <DemoHeading kicker={meta.eyebrow} title={meta.title} as={Heading} />

      {/* Actors + the active arrow (sequence lane) */}
      <div className="mt-4 mb-3.5">
        <div className="grid grid-cols-3 gap-2 text-center font-mono text-[10px] tracking-[0.06em]">
          {ACTORS.map((a, i) => (
            <span
              key={a}
              className={cn(
                "rounded-lg border bg-surface-2 px-1 py-2 transition-colors duration-200",
                activeRoute && (activeRoute[0] === i || activeRoute[1] === i) ? "border-signal" : "border-line",
              )}
            >
              {a}
            </span>
          ))}
        </div>
        <SequenceLane route={activeRoute} stepKey={step} reduce={reduce} />
      </div>

      <ol className="m-0 mb-3.5 flex list-none flex-col gap-1.5 p-0" aria-label="Sign-in steps">
        {OAUTH_STEPS.map((d, i) => {
          const done = step > i + 1 || (step === 6 && i === 5)
          const active = step === i + 1 && step !== 6
          return (
            <li
              key={d.text}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-start gap-3 rounded-[10px] border px-2.5 py-2 transition-[border-color,background-color] duration-200",
                active ? "border-signal bg-surface-2" : "border-line bg-transparent",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 flex-none items-center justify-center rounded-full font-mono text-[11px]",
                  done ? "bg-go text-on-signal" : active ? "bg-signal text-on-signal" : "bg-surface-2 text-muted-foreground",
                )}
              >
                {done ? "✓" : i + 1}
                <span className="sr-only">{done ? " (done)" : ""}</span>
              </span>
              <span className="min-w-0 flex-auto">
                <span className={cn("block text-sm", done || active ? "text-text" : "text-muted-foreground")}>{d.text}</span>
                <span className="block font-mono text-[9px] tracking-[0.06em] text-muted-foreground">{d.route}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <div className="mb-4 flex flex-wrap gap-2.5">
        <Button
          variant="signal"
          size="md"
          className="px-[18px] text-[15px]"
          disabled={busy || step >= 6}
          onClick={() => void run((st) => nextStep(st, { now: Date.now(), randomBytes }))}
        >
          {step >= 6 ? "Done" : step === 0 ? "Start" : "Next step"}
        </Button>
        <DemoButton onClick={() => step < 6 && setPlaying(true)} disabled={playing || step >= 6}>
          Play all
        </DemoButton>
        <ResetButton onClick={onReset} />
      </div>

      <dl className="m-0 rounded-[10px] border border-line bg-surface-2 p-3 font-mono text-[10px] leading-[1.7] break-all">
        <Row k="code_verifier" v={short(s.pkce?.verifier)} />
        <Row k="code_challenge (S256)" v={s.pkce ? short(s.pkce.challenge) : "computing…"} />
        {s.authorizeUrl && <Row k="GET" v={short(s.authorizeUrl, 64)} />}
        {s.code && <Row k="code (one-time)" v={short(s.code)} />}
      </dl>

      {!token || !view ? (
        <p className="m-0 mt-3.5 font-mono text-[11px] text-muted-foreground">The access token appears after step 5.</p>
      ) : (
        <div className={cn("mt-3.5 rounded-[10px] border p-3", s.tampered || view.expired ? "border-stop" : "border-line")}>
          <div className="mb-2 flex flex-wrap justify-between gap-2 font-mono text-[10px] tracking-[0.08em]">
            <span className="text-muted-foreground">ACCESS TOKEN · HS256 · DEMO KEY</span>
            <span className={view.expired ? "text-stop" : "text-go"}>{view.expLabel}</span>
          </div>
          <p className="m-0 mb-2.5 font-mono text-[10px] leading-relaxed break-all" aria-label="JWT: header, payload and signature">
            <span className="text-steel">{view.decoded.segments.header}</span>.
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={s.tampered ? "t" : "o"}
                className={cn("inline", s.tampered ? "text-stop" : "text-signal-text")}
                initial={reduce ? false : { rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { rotateX: -90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ display: "inline-block", transformOrigin: "50% 50%" }}
              >
                {view.decoded.segments.payload}
              </motion.span>
            </AnimatePresence>
            .<span className="text-go">{view.decoded.segments.signature}</span>
          </p>
          <pre
            className={cn(
              "m-0 rounded-lg bg-surface-2 p-2.5 font-mono text-[10px] leading-normal whitespace-pre-wrap",
              s.tampered ? "text-stop" : "text-signal-text",
            )}
          >
            {JSON.stringify(view.decoded.payload, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2">
        <DemoButton tone="ink" className="px-3.5 text-sm font-bold" disabled={!token || busy} onClick={() => void run((st) => callApi(st, Date.now()))}>
          Call API
        </DemoButton>
        <DemoButton
          tone={s.tampered ? "stop" : "line"}
          className="px-3.5 text-sm"
          disabled={!token || busy}
          pressed={s.tampered}
          onClick={() => void run((st) => toggleTamper(st, Date.now()))}
        >
          Tamper: role → admin
        </DemoButton>
        <DemoButton className="px-3.5 text-sm" disabled={!token || busy} onClick={() => void run((st) => fastForward(st, Date.now()))}>
          Fast-forward 15 min
        </DemoButton>
        <DemoButton
          className="px-3.5 text-sm"
          disabled={!token || busy}
          onClick={() => void run((st) => redeemRefreshToken(st, { now: Date.now(), randomBytes }))}
        >
          Use refresh token
        </DemoButton>
        <DemoButton
          className="px-3.5 text-sm"
          disabled={!hasCode(s) || busy}
          onClick={() => void run((st) => stealCode(st, { now: Date.now(), randomBytes }))}
        >
          Replay stolen code
        </DemoButton>
      </div>

      <StatusLine testId="api-status" code={st?.code ?? "—"} text={st?.text ?? "No API call yet"} tone={st?.tone ?? "muted"} />
      <EventLog entries={s.log} label="OAuth event log" max={4} minH="min-h-[96px]" />
      <p className="m-0 mt-2.5 text-xs text-muted-foreground">
        Simulated in your browser with a demo key. Real systems sign with asymmetric keys (RS256 or ES256) published at a JWKS endpoint.
      </p>
    </DemoBody>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="inline text-muted-foreground">{k} </dt>
      <dd className="m-0 inline">{v}</dd>
    </div>
  )
}

/** Arrow between actor columns for the active step; a dot runs along it in the direction of the call. */
function SequenceLane({ route, stepKey, reduce }: { route: readonly [number, number] | undefined; stepKey: number; reduce: boolean }) {
  const col = (i: number) => (i * 2 + 1) * (100 / 6) // column centre, %
  return (
    <div aria-hidden="true" className="relative mt-1 h-6">
      {route &&
        (route[0] === route[1] ? (
          <motion.span
            key={`self-${stepKey}`}
            className="absolute top-[7px] size-2.5 -translate-x-1/2 rounded-full bg-signal shadow-[0_0_10px_var(--signal)]"
            style={{ left: `${col(route[0])}%` }}
            initial={reduce ? false : { scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <span key={`arrow-${stepKey}`}>
            <span
              className="absolute top-[11px] h-0.5"
              style={{
                left: `${Math.min(col(route[0]), col(route[1]))}%`,
                width: `${Math.abs(col(route[1]) - col(route[0]))}%`,
                backgroundImage: "repeating-linear-gradient(90deg, var(--signal) 0 6px, transparent 6px 12px)",
              }}
            />
            <motion.span
              className="absolute top-[7px] size-2.5 -translate-x-1/2 rounded-full bg-signal shadow-[0_0_10px_var(--signal)]"
              initial={{ left: `${reduce ? col(route[1]) : col(route[0])}%` }}
              animate={{ left: `${col(route[1])}%` }}
              transition={{ duration: reduce ? 0 : 0.6, ease: [0.4, 0, 0.2, 1] }}
            />
          </span>
        ))}
    </div>
  )
}
