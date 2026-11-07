/**
 * Lab registry — pure metadata + hero-rotation logic (SPEC §4.0).
 * No component imports: the UI maps `DemoId` → lazy component separately.
 *
 * Also home of the shared event-log type used by every demo state machine.
 */
import type { DemoId } from "@/content/content"
import { lab } from "@/content/content"

export type { DemoId }

// ------------------------------------------------------------ shared log

export type LogTone = "go" | "stop" | "signal" | "steel" | "muted"

export type LogEntry = {
  readonly id: number
  /** `now` (ms) at which the entry was written. */
  readonly at: number
  readonly text: string
  readonly tone: LogTone
}

/** Max entries kept in any demo log (newest last). */
export const LOG_LIMIT = 30

export function appendLog(log: readonly LogEntry[], entry: LogEntry): readonly LogEntry[] {
  const next = [...log, entry]
  return next.length > LOG_LIMIT ? next.slice(next.length - LOG_LIMIT) : next
}

/** Appends a log line to any state carrying `{ log, seq }`, consuming one id from `seq`. */
export function pushLog<S extends { readonly log: readonly LogEntry[]; readonly seq: number }>(
  state: S,
  text: string,
  tone: LogTone,
  at: number,
): S {
  return { ...state, seq: state.seq + 1, log: appendLog(state.log, { id: state.seq, at, text, tone }) }
}

// ------------------------------------------------------------- registry

export type DemoMeta = {
  readonly id: DemoId
  /** Demo heading, from the design files' <h3>. */
  readonly title: string
  /** Small mono line above the heading in the design ("DEMO · RESILIENCE"). */
  readonly eyebrow: string
  /** Lab tab label (content.ts `lab.notes[id].label`). */
  readonly label: string
  /** One-line description (SPEC §4 story sentence / design header). */
  readonly tagline: string
}

export const DEMOS: readonly DemoMeta[] = [
  {
    id: "circuit-breaker",
    title: "Circuit breaker", // design/CircuitBreaker.dc.html
    eyebrow: "DEMO · RESILIENCE",
    label: lab.notes["circuit-breaker"].label,
    tagline: "Client → Breaker → Core banking API.", // SPEC §4.1 story
  },
  {
    id: "oauth-jwt",
    title: "OAuth + PKCE → JWT", // design/OAuthJwt.dc.html
    eyebrow: "DEMO · IDENTITY",
    label: lab.notes["oauth-jwt"].label,
    tagline:
      "How a banking app signs a user in without ever exposing a secret in the browser, then calls an API with a JWT.", // SPEC §4.2 story
  },
  {
    id: "token-bucket",
    title: "Token bucket", // design/TokenBucket.dc.html
    eyebrow: "DEMO · RATE LIMITING",
    label: lab.notes["token-bucket"].label,
    tagline: "Capacity 5, refill 1 token / 2s.", // SPEC §4.3 + design header
  },
]

export const DEMO_IDS: readonly DemoId[] = DEMOS.map((d) => d.id)

/** sessionStorage key holding this visit's hero demo id. */
export const HERO_DEMO_STORAGE_KEY = "ambati.heroDemo"

/** Query parameter that overrides the pick: `?demo=token-bucket`. */
export const DEMO_QUERY_PARAM = "demo"

export function isDemoId(value: unknown): value is DemoId {
  return typeof value === "string" && (DEMO_IDS as readonly string[]).includes(value)
}

export function getDemo(id: DemoId): DemoMeta {
  const found = DEMOS.find((d) => d.id === id)
  if (!found) throw new Error(`Unknown demo: ${id}`)
  return found
}

/** 1-based position, for "LIVE DEMO n OF 3". */
export function demoNumber(id: DemoId): number {
  return DEMO_IDS.indexOf(id) + 1
}

function at(index: number): DemoId {
  const n = DEMO_IDS.length
  const id = DEMO_IDS[((index % n) + n) % n]
  if (id === undefined) throw new Error("Empty demo registry")
  return id
}

/** Uniform pick from a uint32 (e.g. `crypto.getRandomValues(new Uint32Array(1))[0]`). */
export function pickRandomDemo(randomUint32: number): DemoId {
  return at(Math.floor(Math.abs(randomUint32)) % DEMO_IDS.length)
}

export type HeroResolution = {
  readonly id: DemoId
  /** True when the caller should write `id` to sessionStorage under HERO_DEMO_STORAGE_KEY. */
  readonly persist: boolean
}

/**
 * SPEC §4.0: `?demo=` override wins (not persisted, so it never clobbers the
 * visit's own pick); else a valid stored id is reused; else a uniform random
 * pick that should be persisted.
 */
export function resolveHeroDemo(input: {
  query: string
  stored: string | null
  randomUint32: number
}): HeroResolution {
  const fromQuery = new URLSearchParams(input.query).get(DEMO_QUERY_PARAM)
  if (isDemoId(fromQuery)) return { id: fromQuery, persist: false }
  if (isDemoId(input.stored)) return { id: input.stored, persist: false }
  return { id: pickRandomDemo(input.randomUint32), persist: true }
}

/** Next demo in registry order, wrapping around ("Try another ↻"). */
export function nextDemo(id: DemoId): DemoId {
  return at(DEMO_IDS.indexOf(id) + 1)
}

/** The Lab opens on the demo after the hero's, so the two never match. */
export function labDefaultFor(heroId: DemoId): DemoId {
  return nextDemo(heroId)
}
