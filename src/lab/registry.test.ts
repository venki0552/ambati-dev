import { describe, it, expect } from "vitest"
import {
  DEMOS,
  HERO_DEMO_STORAGE_KEY,
  LOG_LIMIT,
  appendLog,
  demoNumber,
  isDemoId,
  labDefaultFor,
  nextDemo,
  pickRandomDemo,
  resolveHeroDemo,
} from "./registry"
import type { LogEntry } from "./registry"

describe("registry", () => {
  it("lists the 3 demos in order with title + tagline", () => {
    expect(DEMOS.map((d) => d.id)).toEqual(["circuit-breaker", "oauth-jwt", "token-bucket"])
    expect(DEMOS.map((d) => d.title)).toEqual(["Circuit breaker", "OAuth + PKCE → JWT", "Token bucket"])
    expect(DEMOS.every((d) => d.tagline.length > 0 && d.label.length > 0)).toBe(true)
    expect(demoNumber("token-bucket")).toBe(3)
    expect(HERO_DEMO_STORAGE_KEY).toBeTruthy()
  })

  it("isDemoId", () => {
    expect(isDemoId("oauth-jwt")).toBe(true)
    expect(isDemoId("OAUTH-JWT")).toBe(false)
    expect(isDemoId(null)).toBe(false)
    expect(isDemoId(3)).toBe(false)
  })

  it("?demo= override wins over stored and random, and is not persisted", () => {
    expect(resolveHeroDemo({ query: "?demo=token-bucket", stored: "oauth-jwt", randomUint32: 0 })).toEqual({
      id: "token-bucket",
      persist: false,
    })
    expect(resolveHeroDemo({ query: "?x=1&demo=oauth-jwt", stored: null, randomUint32: 0 }).id).toBe("oauth-jwt")
    expect(resolveHeroDemo({ query: "demo=circuit-breaker", stored: null, randomUint32: 2 }).id).toBe("circuit-breaker")
  })

  it("reuses the stored pick for the rest of the visit", () => {
    expect(resolveHeroDemo({ query: "", stored: "oauth-jwt", randomUint32: 2 })).toEqual({ id: "oauth-jwt", persist: false })
  })

  it("invalid ?demo= is ignored", () => {
    expect(resolveHeroDemo({ query: "?demo=nope", stored: "token-bucket", randomUint32: 0 })).toEqual({
      id: "token-bucket",
      persist: false,
    })
    expect(resolveHeroDemo({ query: "?demo=", stored: null, randomUint32: 1 })).toEqual({ id: "oauth-jwt", persist: true })
  })

  it("invalid stored value falls back to a random pick that should be persisted", () => {
    expect(resolveHeroDemo({ query: "", stored: "garbage", randomUint32: 5 })).toEqual({ id: "token-bucket", persist: true })
    expect(resolveHeroDemo({ query: "", stored: null, randomUint32: 0 })).toEqual({ id: "circuit-breaker", persist: true })
  })

  it("random pick is uniform-ish and uses all 3 demos", () => {
    const counts = new Map<string, number>()
    let x = 2463534242
    for (let i = 0; i < 3000; i++) {
      // xorshift32
      x ^= x << 13
      x ^= x >>> 17
      x ^= x << 5
      x >>>= 0
      const id = pickRandomDemo(x)
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    expect([...counts.keys()].sort()).toEqual(["circuit-breaker", "oauth-jwt", "token-bucket"])
    for (const n of counts.values()) expect(n).toBeGreaterThan(800)
    expect(pickRandomDemo(0xffffffff)).toBe("circuit-breaker") // 4294967295 % 3 === 0
  })

  it("nextDemo cycles in order", () => {
    expect(nextDemo("circuit-breaker")).toBe("oauth-jwt")
    expect(nextDemo("oauth-jwt")).toBe("token-bucket")
    expect(nextDemo("token-bucket")).toBe("circuit-breaker")
  })

  it("the Lab opens on the demo after the hero's", () => {
    expect(labDefaultFor("circuit-breaker")).toBe("oauth-jwt")
    expect(labDefaultFor("oauth-jwt")).toBe("token-bucket")
    expect(labDefaultFor("token-bucket")).toBe("circuit-breaker")
  })

  it("appendLog caps the log, newest last", () => {
    let log: readonly LogEntry[] = []
    for (let i = 0; i < LOG_LIMIT + 5; i++) log = appendLog(log, { id: i, at: i, text: `e${i}`, tone: "muted" })
    expect(log).toHaveLength(LOG_LIMIT)
    expect(log[log.length - 1]?.text).toBe(`e${LOG_LIMIT + 4}`)
    expect(log[0]?.id).toBe(5)
  })
})
