import { describe, it, expect } from "vitest"
import {
  COOLDOWN_MS,
  beginRequest,
  completeRequest,
  cooldownFraction,
  cooldownRemainingMs,
  createCircuitBreaker,
  failSummary,
  reset,
  setFailureRate,
  statusText,
  tick,
} from "./circuitBreaker"
import type { CircuitBreakerState, RequestOutcome } from "./circuitBreaker"
import { LOG_LIMIT } from "./registry"

/** rng that makes the call fail (0 → 0*100 < rate) or succeed (0.999). Second value drives latency. */
const FAIL = () => 0
const OK = () => 0.999

function call(s: CircuitBreakerState, now: number, rng: () => number): { state: CircuitBreakerState; outcome: RequestOutcome | null } {
  const b = beginRequest(s, now)
  return completeRequest(b.state, b.request.id, now + 580, rng)
}

function lastLog(s: CircuitBreakerState): string {
  return s.log[s.log.length - 1]?.text ?? ""
}

/** Opens the breaker at t≈now with 3 failures. */
function opened(now = 0): CircuitBreakerState {
  let s = setFailureRate(createCircuitBreaker(now), 50)
  for (let i = 0; i < 3; i++) s = call(s, now, FAIL).state
  return s
}

describe("circuit breaker", () => {
  it("starts CLOSED with a ready log line", () => {
    const s = createCircuitBreaker(0)
    expect(s.mode).toBe("closed")
    expect(s.log.map((e) => e.text)).toEqual(["Ready · breaker CLOSED"])
    expect(failSummary(s)).toBe("OPENS AT 3 FAILURES")
    expect(statusText(s, 0)).toBe("Closed: requests flow through to core banking.")
  })

  it("logs 200 OK with simulated latency and 500 on downstream error", () => {
    let s = createCircuitBreaker(0, 50)
    let r = call(s, 0, () => 0.5) // 50 < 50 is false → success, latency 40+45
    expect(r.outcome).toMatchObject({ status: 200, ok: true, latencyMs: 85, kind: "pass" })
    expect(lastLog(r.state)).toBe("200 OK · 85ms")
    s = r.state
    r = call(s, 1000, FAIL)
    expect(r.outcome).toMatchObject({ status: 500, ok: false })
    expect(lastLog(r.state)).toBe("500 · downstream error")
    expect(failSummary(r.state)).toBe("1 FAILED · OPENS AT 3")
  })

  it("0% failure never fails, 100% always fails", () => {
    const r0 = call(createCircuitBreaker(0, 0), 0, FAIL)
    expect(r0.outcome?.ok).toBe(true)
    const r100 = call(createCircuitBreaker(0, 100), 0, () => 0.9999)
    expect(r100.outcome?.ok).toBe(false)
  })

  it("CLOSED → OPEN when 3 of the last 6 calls failed", () => {
    let s = setFailureRate(createCircuitBreaker(0), 50)
    s = call(s, 0, FAIL).state
    s = call(s, 1000, OK).state
    s = call(s, 2000, FAIL).state
    s = call(s, 3000, OK).state
    expect(s.mode).toBe("closed")
    s = call(s, 4000, FAIL).state
    expect(s.mode).toBe("open")
    expect(lastLog(s)).toBe("Breaker OPEN · 3 of the last 5 calls failed")
    expect(s.window).toHaveLength(5)
  })

  it("only the last 6 calls count", () => {
    let s = setFailureRate(createCircuitBreaker(0), 50)
    s = call(s, 0, FAIL).state
    s = call(s, 0, FAIL).state
    for (let i = 0; i < 6; i++) s = call(s, 0, OK).state // pushes both failures out of the window
    expect(s.window).toEqual(Array(6).fill("success"))
    s = call(s, 0, FAIL).state
    s = call(s, 0, FAIL).state
    expect(s.mode).toBe("closed")
    s = call(s, 0, FAIL).state
    expect(s.mode).toBe("open")
    expect(lastLog(s)).toBe("Breaker OPEN · 3 of the last 6 calls failed")
  })

  it("short-circuits instantly while OPEN with 503 · fallback served, never calling downstream", () => {
    const s = opened(0)
    const b = beginRequest(s, 1000)
    expect(b.request.kind).toBe("short-circuit")
    let rngCalls = 0
    const r = completeRequest(b.state, b.request.id, 1560, () => {
      rngCalls++
      return 0
    })
    expect(rngCalls).toBe(0)
    expect(r.outcome).toMatchObject({ status: 503, ok: false, latencyMs: null, kind: "short-circuit" })
    expect(lastLog(r.state)).toBe("503 · fallback served, downstream not called")
    expect(r.state.mode).toBe("open")
    expect(r.state.window).toEqual(s.window)
  })

  it("exposes the cooldown countdown and moves OPEN → HALF-OPEN after 5s", () => {
    const s = opened(0) // openedAt = 580
    expect(s.openedAt).toBe(580)
    expect(cooldownRemainingMs(s, 580)).toBe(COOLDOWN_MS)
    expect(cooldownFraction(s, 580 + 2500)).toBeCloseTo(0.5)
    expect(statusText(s, 580 + 1)).toBe("Open: short-circuiting. Trial call in 5s.")
    expect(statusText(s, 580 + 4001)).toBe("Open: short-circuiting. Trial call in 1s.")
    expect(tick(s, 580 + 4999)).toBe(s)
    const h = tick(s, 580 + 5000)
    expect(h.mode).toBe("half-open")
    expect(lastLog(h)).toBe("HALF-OPEN · the next call is a trial")
    expect(cooldownRemainingMs(h, 580 + 5000)).toBe(0)
    expect(tick(h, 99999)).toBe(h)
  })

  it("beginRequest applies the cooldown itself (no tick needed)", () => {
    const s = opened(0)
    const b = beginRequest(s, 580 + COOLDOWN_MS)
    expect(b.request.kind).toBe("trial")
    expect(b.state.mode).toBe("half-open")
  })

  it("HALF-OPEN lets exactly one trial through; a concurrent second call short-circuits", () => {
    const h = tick(opened(0), 10_000)
    const first = beginRequest(h, 10_000)
    const second = beginRequest(first.state, 10_100)
    expect(first.request.kind).toBe("trial")
    expect(second.request.kind).toBe("short-circuit")
    expect(second.state.inFlight.map((r) => r.kind)).toEqual(["trial", "short-circuit"])
    const r2 = completeRequest(second.state, second.request.id, 10_660, OK)
    expect(lastLog(r2.state)).toBe("503 · fallback served, downstream not called")
    expect(r2.state.mode).toBe("half-open")
  })

  it("HALF-OPEN → CLOSED when the trial passes", () => {
    const h = tick(opened(0), 10_000)
    const b = beginRequest(h, 10_000)
    const r = completeRequest(b.state, b.request.id, 10_580, OK)
    expect(r.outcome).toMatchObject({ kind: "trial", status: 200 })
    expect(r.state.mode).toBe("closed")
    expect(r.state.window).toEqual([])
    expect(lastLog(r.state)).toBe("Trial passed · breaker CLOSED")
    expect(beginRequest(r.state, 11_000).request.kind).toBe("pass")
  })

  it("HALF-OPEN → OPEN again when the trial fails, with a fresh cooldown", () => {
    const h = tick(opened(0), 10_000)
    const b = beginRequest(h, 10_000)
    const r = completeRequest(b.state, b.request.id, 10_580, FAIL)
    expect(r.state.mode).toBe("open")
    expect(r.state.openedAt).toBe(10_580)
    expect(cooldownRemainingMs(r.state, 10_580)).toBe(COOLDOWN_MS)
    expect(lastLog(r.state)).toBe("Trial failed · breaker OPEN again")
    expect(tick(r.state, 15_580).mode).toBe("half-open")
  })

  it("a pass call that lands after the breaker opened is logged but does not touch the window", () => {
    let s = setFailureRate(createCircuitBreaker(0), 50)
    s = call(s, 0, FAIL).state
    s = call(s, 0, FAIL).state
    const late = beginRequest(s, 100) // in flight while the 3rd failure opens the breaker
    s = call(late.state, 200, FAIL).state
    expect(s.mode).toBe("open")
    const windowBefore = s.window
    const r = completeRequest(s, late.request.id, 700, OK)
    expect(lastLog(r.state)).toMatch(/^200 OK · \d+ms$/)
    expect(r.state.mode).toBe("open")
    expect(r.state.window).toBe(windowBefore)
  })

  it("tracks a failure-rate history for the sparkline", () => {
    let s = setFailureRate(createCircuitBreaker(0), 50)
    s = call(s, 0, OK).state
    s = call(s, 0, FAIL).state
    s = call(s, 0, FAIL).state
    s = call(s, 0, OK).state
    expect(s.rateHistory).toEqual([0, 0.5, 2 / 3, 0.5])
  })

  it("unknown ids are ignored and reset clears everything but the rate", () => {
    const s = opened(0)
    const b = beginRequest(s, 1000)
    expect(completeRequest(b.state, 9999, 1000, OK)).toEqual({ state: b.state, outcome: null })
    const r = reset(b.state, 2000)
    expect(r.mode).toBe("closed")
    expect(r.inFlight).toEqual([])
    expect(r.failureRate).toBe(50)
    expect(r.log.map((e) => e.text)).toEqual(["Reset · breaker CLOSED"])
    expect(completeRequest(r, b.request.id, 2100, OK).outcome).toBeNull()
  })

  it("keeps the log bounded with unique ids", () => {
    let s = createCircuitBreaker(0, 0)
    for (let i = 0; i < 50; i++) s = call(s, i * 1000, OK).state
    expect(s.log).toHaveLength(LOG_LIMIT)
    expect(new Set(s.log.map((e) => e.id)).size).toBe(LOG_LIMIT)
    expect(s.log.every((e, i, a) => i === 0 || e.id > (a[i - 1]?.id ?? -1))).toBe(true)
  })

  it("clamps the failure rate", () => {
    expect(setFailureRate(createCircuitBreaker(0), 140).failureRate).toBe(100)
    expect(setFailureRate(createCircuitBreaker(0), -5).failureRate).toBe(0)
  })
})
