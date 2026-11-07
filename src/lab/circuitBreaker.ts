/**
 * Circuit breaker demo — pure state machine (SPEC §4.1, design/CircuitBreaker.dc.html).
 *
 * The UI owns all timers. A request is modelled in two calls, mirroring the
 * design's send()/finish():
 *   beginRequest(state, now)            → decides pass / trial / short-circuit, returns a dot to animate
 *   completeRequest(state, id, now, rng) → resolves it (downstream success/failure) and logs it
 * plus tick(state, now) to move OPEN → HALF-OPEN once the cooldown is over.
 */
import type { LogEntry } from "./registry"
import { pushLog } from "./registry"

// ------------------------------------------------------------- constants

export const WINDOW_SIZE = 6
export const FAILURE_THRESHOLD = 3
export const COOLDOWN_MS = 5000
export const DEFAULT_FAILURE_RATE = 40
export const RATE_HISTORY_LIMIT = 30
/** Design timings (UI convenience): dot travel to downstream / bounce off the gate. */
export const TRAVEL_MS = 580
export const BOUNCE_MS = 560
/** Design's auto-traffic interval (SPEC says 600ms; design uses 900ms). */
export const AUTO_TRAFFIC_INTERVAL_MS = 900

// ----------------------------------------------------------------- types

export type BreakerMode = "closed" | "half-open" | "open"
export type CallResult = "success" | "failure"
/** pass = normal call to downstream; trial = the single HALF-OPEN probe; short-circuit = 503 at the gate. */
export type RequestKind = "pass" | "trial" | "short-circuit"

export type InFlightRequest = {
  readonly id: number
  readonly kind: RequestKind
  readonly startedAt: number
}

export type RequestOutcome = {
  readonly id: number
  readonly kind: RequestKind
  readonly status: 200 | 500 | 503
  readonly ok: boolean
  /** Simulated downstream latency; null for short-circuits. */
  readonly latencyMs: number | null
}

export type CircuitBreakerState = {
  readonly mode: BreakerMode
  /** Breaker window: last ≤6 downstream results while CLOSED (cleared on every state change, as in the design). */
  readonly window: readonly CallResult[]
  /** Downstream failure probability, 0–100. */
  readonly failureRate: number
  /** When the breaker last opened (ms), null unless OPEN. */
  readonly openedAt: number | null
  /** Id of the in-flight HALF-OPEN trial call, if any. */
  readonly trialId: number | null
  readonly inFlight: readonly InFlightRequest[]
  /** Last ≤6 downstream results, never cleared by state changes (feeds the sparkline). */
  readonly recent: readonly CallResult[]
  /** Failure rate (0–1) of `recent` after each downstream call, newest last, ≤30 points. */
  readonly rateHistory: readonly number[]
  readonly log: readonly LogEntry[]
  /** Next id for requests and log entries. */
  readonly seq: number
}

export type Rng = () => number

// ---------------------------------------------------------------- helpers

function countFailures(results: readonly CallResult[]): number {
  return results.filter((r) => r === "failure").length
}

function recordDownstream(state: CircuitBreakerState, result: CallResult): CircuitBreakerState {
  const recent = [...state.recent, result].slice(-WINDOW_SIZE)
  const rate = countFailures(recent) / recent.length
  return { ...state, recent, rateHistory: [...state.rateHistory, rate].slice(-RATE_HISTORY_LIMIT) }
}

function clampRate(pct: number): number {
  if (!Number.isFinite(pct)) return 0
  return Math.min(100, Math.max(0, pct))
}

// ------------------------------------------------------------------- API

export function createCircuitBreaker(now: number, failureRate: number = DEFAULT_FAILURE_RATE): CircuitBreakerState {
  return {
    mode: "closed",
    window: [],
    failureRate: clampRate(failureRate),
    openedAt: null,
    trialId: null,
    inFlight: [],
    recent: [],
    rateHistory: [],
    log: [{ id: 0, at: now, text: "Ready · breaker CLOSED", tone: "muted" }],
    seq: 1,
  }
}

/** Back to CLOSED with an empty window; keeps the failure-rate slider value (as the design does). */
export function reset(state: CircuitBreakerState, now: number): CircuitBreakerState {
  return {
    ...createCircuitBreaker(now, state.failureRate),
    log: [{ id: state.seq, at: now, text: "Reset · breaker CLOSED", tone: "muted" }],
    seq: state.seq + 1,
  }
}

export function setFailureRate(state: CircuitBreakerState, pct: number): CircuitBreakerState {
  return { ...state, failureRate: clampRate(pct) }
}

/** OPEN → HALF-OPEN once COOLDOWN_MS has passed. Safe to call as often as you like. */
export function tick(state: CircuitBreakerState, now: number): CircuitBreakerState {
  if (state.mode !== "open" || state.openedAt === null) return state
  if (now < state.openedAt + COOLDOWN_MS) return state
  return pushLog({ ...state, mode: "half-open", openedAt: null, trialId: null }, "HALF-OPEN · the next call is a trial", "signal", now)
}

/** Remaining OPEN cooldown in ms (0 unless OPEN). */
export function cooldownRemainingMs(state: CircuitBreakerState, now: number): number {
  if (state.mode !== "open" || state.openedAt === null) return 0
  return Math.max(0, state.openedAt + COOLDOWN_MS - now)
}

/** Countdown ring progress: 1 just after opening → 0 when HALF-OPEN is due. 0 unless OPEN. */
export function cooldownFraction(state: CircuitBreakerState, now: number): number {
  return cooldownRemainingMs(state, now) / COOLDOWN_MS
}

/**
 * Starts a request. Applies tick() first. While OPEN — or HALF-OPEN with the
 * trial already in flight — the request is a short-circuit (it never reaches
 * downstream). The first request in HALF-OPEN becomes the trial.
 */
export function beginRequest(
  state: CircuitBreakerState,
  now: number,
): { state: CircuitBreakerState; request: InFlightRequest } {
  const s = tick(state, now)
  let kind: RequestKind
  if (s.mode === "open") kind = "short-circuit"
  else if (s.mode === "half-open") kind = s.trialId === null ? "trial" : "short-circuit"
  else kind = "pass"
  const request: InFlightRequest = { id: s.seq, kind, startedAt: now }
  return {
    request,
    state: {
      ...s,
      seq: s.seq + 1,
      inFlight: [...s.inFlight, request],
      trialId: kind === "trial" ? request.id : s.trialId,
    },
  }
}

/**
 * Resolves an in-flight request. `rng` (→ [0,1)) is called twice for downstream
 * calls: failure = rng()*100 < failureRate, then latency = 40 + floor(rng()*90) ms.
 * Unknown ids (e.g. after reset) return the state unchanged and outcome null.
 */
export function completeRequest(
  state: CircuitBreakerState,
  id: number,
  now: number,
  rng: Rng,
): { state: CircuitBreakerState; outcome: RequestOutcome | null } {
  const req = state.inFlight.find((r) => r.id === id)
  if (!req) return { state, outcome: null }
  let s: CircuitBreakerState = tick({ ...state, inFlight: state.inFlight.filter((r) => r.id !== id) }, now)

  if (req.kind === "short-circuit") {
    s = pushLog(s, "503 · fallback served, downstream not called", "stop", now)
    return { state: s, outcome: { id, kind: req.kind, status: 503, ok: false, latencyMs: null } }
  }

  const fail = rng() * 100 < s.failureRate
  const latencyMs = 40 + Math.floor(rng() * 90)
  const result: CallResult = fail ? "failure" : "success"
  const outcome: RequestOutcome = { id, kind: req.kind, status: fail ? 500 : 200, ok: !fail, latencyMs }
  s = recordDownstream(s, result)

  if (req.kind === "trial") {
    if (s.mode === "half-open" && s.trialId === id) {
      s = fail
        ? pushLog({ ...s, mode: "open", openedAt: now, trialId: null, window: [] }, "Trial failed · breaker OPEN again", "stop", now)
        : pushLog({ ...s, mode: "closed", openedAt: null, trialId: null, window: [] }, "Trial passed · breaker CLOSED", "go", now)
    }
    return { state: s, outcome }
  }

  // pass
  s = pushLog(s, fail ? "500 · downstream error" : `200 OK · ${latencyMs}ms`, fail ? "stop" : "go", now)
  if (s.mode !== "closed") return { state: s, outcome } // breaker already tripped by a concurrent call
  const window = [...s.window, result].slice(-WINDOW_SIZE)
  const fails = countFailures(window)
  if (fails >= FAILURE_THRESHOLD) {
    s = pushLog(
      { ...s, mode: "open", openedAt: now, window },
      `Breaker OPEN · ${fails} of the last ${window.length} calls failed`,
      "stop",
      now,
    )
  } else {
    s = { ...s, window }
  }
  return { state: s, outcome }
}

// ------------------------------------------------------- view helpers (design copy)

export function windowFailures(state: CircuitBreakerState): number {
  return countFailures(state.window)
}

/** "2 FAILED · OPENS AT 3" / "OPENS AT 3 FAILURES". */
export function failSummary(state: CircuitBreakerState): string {
  return state.window.length
    ? `${windowFailures(state)} FAILED · OPENS AT ${FAILURE_THRESHOLD}`
    : `OPENS AT ${FAILURE_THRESHOLD} FAILURES`
}

/** Status sentence under the track. */
export function statusText(state: CircuitBreakerState, now: number): string {
  const s = tick(state, now)
  if (s.mode === "closed") return "Closed: requests flow through to core banking."
  if (s.mode === "half-open") return "Half-open: one trial request is allowed through."
  return `Open: short-circuiting. Trial call in ${Math.ceil(cooldownRemainingMs(s, now) / 1000)}s.`
}
