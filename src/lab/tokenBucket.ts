/**
 * Token bucket demo — pure state machine (SPEC §4.3, design/TokenBucket.dc.html).
 *
 * Refill model matches the design: DISCRETE. Whole tokens only; while the
 * bucket is below capacity a refill cycle runs, and every REFILL_INTERVAL_MS
 * one whole token drops in. The cycle starts when the bucket first drops below
 * full; consuming tokens mid-cycle does not restart it. A full bucket has no cycle.
 */
import type { LogEntry, LogTone } from "./registry"
import { pushLog } from "./registry"

export const CAPACITY = 5
export const REFILL_INTERVAL_MS = 2000
export const DEFAULT_BURST = 10

export type BucketStatus = {
  readonly code: "200" | "429"
  readonly text: string
  readonly tone: LogTone
}

export type TokenBucketState = {
  readonly tokens: number
  /** Start (ms) of the current refill cycle; null while the bucket is full. */
  readonly refillStartedAt: number | null
  /** Big status readout (design: "200" / "429" + text); null before any request. */
  readonly status: BucketStatus | null
  readonly log: readonly LogEntry[]
  readonly seq: number
}

export type BucketResult =
  | { readonly status: 200; readonly tokensLeft: number }
  | { readonly status: 429; readonly tokensLeft: 0; readonly retryAfterS: number }

export function createTokenBucket(now: number): TokenBucketState {
  return {
    tokens: CAPACITY,
    refillStartedAt: null,
    status: null,
    log: [{ id: 0, at: now, text: "Ready · bucket full", tone: "muted" }],
    seq: 1,
  }
}

export function reset(state: TokenBucketState, now: number): TokenBucketState {
  return {
    ...createTokenBucket(now),
    log: [{ id: state.seq, at: now, text: "Reset · bucket full", tone: "muted" }],
    seq: state.seq + 1,
  }
}

/** Adds every whole token earned up to `now`. Refills are silent (no log line), as in the design. */
export function tick(state: TokenBucketState, now: number): TokenBucketState {
  if (state.refillStartedAt === null || state.tokens >= CAPACITY) return state
  const earned = Math.floor((now - state.refillStartedAt) / REFILL_INTERVAL_MS)
  if (earned <= 0) return state
  const tokens = Math.min(CAPACITY, state.tokens + earned)
  return {
    ...state,
    tokens,
    refillStartedAt: tokens >= CAPACITY ? null : state.refillStartedAt + earned * REFILL_INTERVAL_MS,
  }
}

/** ms until the next token lands (0 when full). */
export function nextTokenInMs(state: TokenBucketState, now: number): number {
  const s = tick(state, now)
  if (s.refillStartedAt === null) return 0
  return Math.max(0, s.refillStartedAt + REFILL_INTERVAL_MS - now)
}

/** Refill bar 0–1 (1 when full). */
export function refillProgress(state: TokenBucketState, now: number): number {
  const s = tick(state, now)
  if (s.refillStartedAt === null) return 1
  return Math.min(1, (now - s.refillStartedAt) / REFILL_INTERVAL_MS)
}

/** Seconds a 429 tells the client to wait: ceil(ms until next token), at least 1. */
export function retryAfterSeconds(state: TokenBucketState, now: number): number {
  return Math.max(1, Math.ceil(nextTokenInMs(state, now) / 1000))
}

/** "BUCKET FULL" / "NEXT TOKEN IN 1.4s" (design copy). */
export function refillLabel(state: TokenBucketState, now: number): string {
  const s = tick(state, now)
  if (s.refillStartedAt === null) return "BUCKET FULL"
  return `NEXT TOKEN IN ${(nextTokenInMs(s, now) / 1000).toFixed(1)}s`
}

/** "3 of 5 tokens left" (design copy). */
export function bucketLabel(state: TokenBucketState): string {
  return `${state.tokens} of ${CAPACITY} tokens left`
}

/** Consumes one token without logging. */
function take(state: TokenBucketState, now: number): { state: TokenBucketState; result: BucketResult } {
  if (state.tokens > 0) {
    const tokens = state.tokens - 1
    return {
      state: { ...state, tokens, refillStartedAt: state.refillStartedAt ?? now },
      result: { status: 200, tokensLeft: tokens },
    }
  }
  return { state, result: { status: 429, tokensLeft: 0, retryAfterS: retryAfterSeconds(state, now) } }
}

export function sendRequest(state: TokenBucketState, now: number): { state: TokenBucketState; result: BucketResult } {
  const { state: s, result } = take(tick(state, now), now)
  if (result.status === 200) {
    const text = `OK · ${result.tokensLeft} tokens left`
    return { result, state: pushLog({ ...s, status: { code: "200", text, tone: "go" } }, `200 OK · ${result.tokensLeft} tokens left`, "go", now) }
  }
  const text = `Too Many Requests · Retry-After: ${result.retryAfterS}`
  return { result, state: pushLog({ ...s, status: { code: "429", text, tone: "stop" } }, `429 ${text}`, "stop", now) }
}

/** Fires `count` requests at the same instant. One summary log line, as in the design. */
export function burst(
  state: TokenBucketState,
  count: number,
  now: number,
): { state: TokenBucketState; results: readonly BucketResult[] } {
  let s = tick(state, now)
  const results: BucketResult[] = []
  for (let i = 0; i < count; i++) {
    const r = take(s, now)
    s = r.state
    results.push(r.result)
  }
  const pass = results.filter((r) => r.status === 200).length
  const block = results.length - pass
  const tone: LogTone = block ? "stop" : "go"
  s = { ...s, status: { code: block ? "429" : "200", text: `${pass} passed · ${block} rejected`, tone } }
  return { results, state: pushLog(s, `Burst ×${count} → ${pass} × 200, ${block} × 429`, tone, now) }
}
