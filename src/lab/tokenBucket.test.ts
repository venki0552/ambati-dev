import { describe, it, expect } from "vitest"
import {
  CAPACITY,
  REFILL_INTERVAL_MS,
  bucketLabel,
  burst,
  createTokenBucket,
  nextTokenInMs,
  refillLabel,
  refillProgress,
  reset,
  sendRequest,
  tick,
} from "./tokenBucket"
import type { TokenBucketState } from "./tokenBucket"

function lastLog(s: TokenBucketState): string {
  return s.log[s.log.length - 1]?.text ?? ""
}

function drain(now: number): TokenBucketState {
  let s = createTokenBucket(0)
  for (let i = 0; i < CAPACITY; i++) s = sendRequest(s, now).state
  return s
}

describe("token bucket", () => {
  it("starts full", () => {
    const s = createTokenBucket(0)
    expect(s.tokens).toBe(5)
    expect(bucketLabel(s)).toBe("5 of 5 tokens left")
    expect(refillLabel(s, 0)).toBe("BUCKET FULL")
    expect(refillProgress(s, 0)).toBe(1)
    expect(s.status).toBeNull()
    expect(lastLog(s)).toBe("Ready · bucket full")
  })

  it("each request consumes one token and logs 200", () => {
    const r = sendRequest(createTokenBucket(0), 1000)
    expect(r.result).toEqual({ status: 200, tokensLeft: 4 })
    expect(r.state.tokens).toBe(4)
    expect(r.state.status).toEqual({ code: "200", text: "OK · 4 tokens left", tone: "go" })
    expect(lastLog(r.state)).toBe("200 OK · 4 tokens left")
  })

  it("at 0 tokens returns 429 with Retry-After", () => {
    const s = drain(1000)
    expect(s.tokens).toBe(0)
    const r = sendRequest(s, 1000)
    expect(r.result).toEqual({ status: 429, tokensLeft: 0, retryAfterS: 2 })
    expect(r.state.status).toEqual({ code: "429", text: "Too Many Requests · Retry-After: 2", tone: "stop" })
    expect(lastLog(r.state)).toBe("429 Too Many Requests · Retry-After: 2")
    // 1.5s into the cycle the next token is 0.5s away → Retry-After rounds up to 1
    const later = sendRequest(s, 2500)
    expect(later.result).toEqual({ status: 429, tokensLeft: 0, retryAfterS: 1 })
  })

  it("refills one whole token every 2s, timed from when the bucket first dropped below full", () => {
    const s = sendRequest(createTokenBucket(0), 1000).state // cycle starts at 1000
    expect(s.refillStartedAt).toBe(1000)
    expect(tick(s, 2999).tokens).toBe(4)
    expect(nextTokenInMs(s, 2600)).toBe(400)
    expect(refillLabel(s, 2600)).toBe("NEXT TOKEN IN 0.4s")
    expect(refillProgress(s, 2000)).toBeCloseTo(0.5)
    const full = tick(s, 3000)
    expect(full.tokens).toBe(5)
    expect(full.refillStartedAt).toBeNull()
    expect(refillLabel(full, 3000)).toBe("BUCKET FULL")
  })

  it("consuming mid-cycle does not restart the refill cycle (discrete, design model)", () => {
    let s = sendRequest(createTokenBucket(0), 0).state // cycle starts at 0
    s = sendRequest(s, 1500).state // 3 left, still same cycle
    expect(s.refillStartedAt).toBe(0)
    s = tick(s, 2000)
    expect(s.tokens).toBe(4)
    expect(s.refillStartedAt).toBe(2000)
    expect(tick(s, 4000).tokens).toBe(5)
  })

  it("catches up multiple tokens after a long gap and caps at capacity", () => {
    const s = drain(0)
    expect(tick(s, 2 * REFILL_INTERVAL_MS + 100).tokens).toBe(2)
    expect(tick(s, 2 * REFILL_INTERVAL_MS + 100).refillStartedAt).toBe(2 * REFILL_INTERVAL_MS)
    expect(tick(s, 60_000).tokens).toBe(CAPACITY)
    expect(sendRequest(s, 2000).result).toEqual({ status: 200, tokensLeft: 0 })
  })

  it("Burst ×10 from a full bucket: 5 pass, 5 × 429, then the bucket refills", () => {
    const r = burst(createTokenBucket(0), 10, 1000)
    expect(r.results.filter((x) => x.status === 200)).toHaveLength(5)
    const rejected = r.results.filter((x) => x.status === 429)
    expect(rejected).toHaveLength(5)
    expect(rejected.every((x) => x.status === 429 && x.retryAfterS === 2)).toBe(true)
    expect(r.results.slice(0, 5).map((x) => x.tokensLeft)).toEqual([4, 3, 2, 1, 0])
    expect(r.state.tokens).toBe(0)
    expect(r.state.status).toEqual({ code: "429", text: "5 passed · 5 rejected", tone: "stop" })
    expect(lastLog(r.state)).toBe("Burst ×10 → 5 × 200, 5 × 429")
    expect(tick(r.state, 3000).tokens).toBe(1)
    expect(tick(r.state, 11_000).tokens).toBe(5)
  })

  it("a burst that fits is all 200", () => {
    const r = burst(createTokenBucket(0), 3, 0)
    expect(r.state.status?.code).toBe("200")
    expect(lastLog(r.state)).toBe("Burst ×3 → 3 × 200, 0 × 429")
  })

  it("reset refills the bucket", () => {
    const s = reset(drain(0), 500)
    expect(s.tokens).toBe(5)
    expect(s.status).toBeNull()
    expect(s.log.map((e) => e.text)).toEqual(["Reset · bucket full"])
  })
})
