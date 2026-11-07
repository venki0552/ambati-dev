import { describe, it, expect } from "vitest"
import {
  ACCESS_TOKEN_TTL_S,
  DEMO_HS256_KEY,
  base64urlDecode,
  base64urlDecodeText,
  base64urlEncode,
  base64urlEncodeText,
  decodeJwt,
  isExpired,
  issueAccessToken,
  signJwt,
  tamper,
  verifyJwt,
} from "./jwt"

const NOW = Date.UTC(2026, 10, 7, 12, 0, 0)
const USER = { sub: "user_1042", role: "customer", scope: "accounts:read" }

describe("base64url", () => {
  it("matches RFC 4648 test vectors (unpadded, url alphabet)", () => {
    const cases: [string, string][] = [
      ["", ""],
      ["f", "Zg"],
      ["fo", "Zm8"],
      ["foo", "Zm9v"],
      ["foob", "Zm9vYg"],
      ["fooba", "Zm9vYmE"],
      ["foobar", "Zm9vYmFy"],
    ]
    for (const [plain, enc] of cases) {
      expect(base64urlEncodeText(plain)).toBe(enc)
      expect(base64urlDecodeText(enc)).toBe(plain)
    }
  })

  it("uses - and _ and round-trips arbitrary bytes", () => {
    const bytes = new Uint8Array([0xfb, 0xff, 0xbf, 0x00, 0x10, 0x83])
    expect(base64urlEncode(bytes)).toBe("-_-_ABCD")
    const all = new Uint8Array(256).map((_, i) => i)
    expect(Array.from(base64urlDecode(base64urlEncode(all)))).toEqual(Array.from(all))
    expect(base64urlDecodeText(base64urlEncodeText("→ ünïcode ✓"))).toBe("→ ünïcode ✓")
  })

  it("rejects invalid input", () => {
    expect(() => base64urlDecode("ab+c")).toThrow()
    expect(() => base64urlDecode("abcde")).toThrow()
  })
})

describe("HS256 JWT", () => {
  it("exposes an obviously-demo key", () => {
    expect(DEMO_HS256_KEY).toMatch(/demo/)
  })

  it("matches an independently computed HS256 token", async () => {
    // Expected value computed with Node's crypto.createHmac (secret "your-256-bit-secret").
    const token = await signJwt({ sub: "1234567890", role: "x", scope: "y", iat: 1516239022, exp: 1516239022 }, "your-256-bit-secret")
    expect(token).toBe(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6IngiLCJzY29wZSI6InkiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyMn0.18GcisvwbyUBZOkwagwSU__PLzzQ1jrb8K4Toy71lYQ",
    )
    expect(await verifyJwt(token, 1516239021_000, "your-256-bit-secret")).toMatchObject({ ok: true })
  })

  it("sign → decode → verify round-trip with 15-minute expiry", async () => {
    const token = await issueAccessToken(USER, NOW)
    const decoded = decodeJwt(token)
    expect(decoded?.header).toEqual({ alg: "HS256", typ: "JWT" })
    expect(decoded?.payload).toEqual({ ...USER, iat: NOW / 1000, exp: NOW / 1000 + ACCESS_TOKEN_TTL_S })
    expect(token.split(".")).toEqual([decoded?.segments.header, decoded?.segments.payload, decoded?.segments.signature])
    const v = await verifyJwt(token, NOW + 60_000)
    expect(v).toEqual({ ok: true, payload: decoded?.payload })
  })

  it("tamper() flips role customer → admin, keeps the old signature → invalid_signature", async () => {
    const token = await issueAccessToken(USER, NOW)
    const forged = tamper(token)
    const [h0, p0, s0] = token.split(".")
    const [h1, p1, s1] = forged.split(".")
    expect(h1).toBe(h0)
    expect(s1).toBe(s0)
    expect(p1).not.toBe(p0)
    expect(base64urlDecodeText(p1 ?? "")).toContain('"role":"admin"')
    expect(decodeJwt(forged)?.payload.role).toBe("admin")
    expect(await verifyJwt(forged, NOW)).toEqual({ ok: false, error: "invalid_signature" })
  })

  it("a token signed with another key is rejected", async () => {
    const token = await issueAccessToken(USER, NOW, "some-other-key")
    expect(await verifyJwt(token, NOW)).toEqual({ ok: false, error: "invalid_signature" })
  })

  it("expires exactly 15 minutes after issue → token_expired", async () => {
    const token = await issueAccessToken(USER, NOW)
    expect((await verifyJwt(token, NOW + 15 * 60_000 - 1000)).ok).toBe(true)
    expect(await verifyJwt(token, NOW + 15 * 60_000)).toEqual({ ok: false, error: "token_expired" })
    const payload = decodeJwt(token)?.payload
    expect(payload && isExpired(payload, NOW + 15 * 60_000)).toBe(true)
  })

  it("signature is checked before expiry", async () => {
    const forged = tamper(await issueAccessToken(USER, NOW))
    expect(await verifyJwt(forged, NOW + 3_600_000)).toEqual({ ok: false, error: "invalid_signature" })
  })

  it("malformed tokens", async () => {
    expect(decodeJwt("a.b")).toBeNull()
    expect(decodeJwt("not.a.jwt")).toBeNull()
    expect(await verifyJwt("x.y.z", NOW)).toEqual({ ok: false, error: "malformed" })
    const noneAlg = `${base64urlEncodeText('{"alg":"none","typ":"JWT"}')}.${base64urlEncodeText(JSON.stringify({ ...USER, iat: 1, exp: 2 }))}.`
    expect(await verifyJwt(noneAlg, NOW)).toEqual({ ok: false, error: "malformed" })
    expect(() => tamper("nope")).toThrow()
  })
})
