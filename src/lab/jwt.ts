/**
 * JWT helpers for the OAuth demo (SPEC §4.2): base64url, HS256 sign/verify via
 * WebCrypto (`globalThis.crypto.subtle`, browser + Node ≥ 20), decode, tamper,
 * expiry against an injected `now`.
 */

/** Demo-only HMAC key, shown in the UI as "DEMO KEY". Never a real secret. */
export const DEMO_HS256_KEY = "demo-key-not-a-real-secret"

/** Access-token lifetime: 15 minutes. */
export const ACCESS_TOKEN_TTL_S = 900

export type JwtHeader = { alg: "HS256"; typ: "JWT" }

export type JwtPayload = {
  sub: string
  role: string
  scope: string
  /** Issued-at, seconds since epoch. */
  iat: number
  /** Expiry, seconds since epoch. */
  exp: number
}

export type JwtSegments = { header: string; payload: string; signature: string }

export type DecodedJwt = {
  header: JwtHeader
  payload: JwtPayload
  /** The three raw base64url segments (for the coloured header · payload · signature view). */
  segments: JwtSegments
}

export type JwtError = "malformed" | "invalid_signature" | "token_expired"

export type VerifyResult = { ok: true; payload: JwtPayload } | { ok: false; error: JwtError }

// ------------------------------------------------------------- base64url

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
const LOOKUP: ReadonlyMap<string, number> = new Map([...ALPHABET].map((ch, i) => [ch, i]))
const encoder = new TextEncoder()
const decoder = new TextDecoder("utf-8", { fatal: true })

/** RFC 4648 §5 base64url, no padding. */
export function base64urlEncode(bytes: Uint8Array): string {
  let out = ""
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0
    const b1 = bytes[i + 1] ?? 0
    const b2 = bytes[i + 2] ?? 0
    const n = (b0 << 16) | (b1 << 8) | b2
    const remaining = bytes.length - i
    out += ALPHABET.charAt((n >> 18) & 63) + ALPHABET.charAt((n >> 12) & 63)
    if (remaining > 1) out += ALPHABET.charAt((n >> 6) & 63)
    if (remaining > 2) out += ALPHABET.charAt(n & 63)
  }
  return out
}

/** Decodes unpadded (or padded) base64url. Throws on invalid input. */
export function base64urlDecode(input: string): Uint8Array<ArrayBuffer> {
  const s = input.replace(/=+$/, "")
  if (s.length % 4 === 1) throw new Error("Invalid base64url length")
  const out = new Uint8Array(Math.floor((s.length * 3) / 4))
  let bits = 0
  let value = 0
  let o = 0
  for (const ch of s) {
    const v = LOOKUP.get(ch)
    if (v === undefined) throw new Error(`Invalid base64url character: ${ch}`)
    value = (value << 6) | v
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out[o++] = (value >> bits) & 0xff
    }
  }
  return out
}

export function base64urlEncodeText(text: string): string {
  return base64urlEncode(encoder.encode(text))
}

export function base64urlDecodeText(input: string): string {
  return decoder.decode(base64urlDecode(input))
}

// ------------------------------------------------------------------ crypto

function subtle(): SubtleCrypto {
  const c = globalThis.crypto as Crypto | undefined
  if (!c?.subtle) throw new Error("WebCrypto (crypto.subtle) is unavailable in this context")
  return c.subtle
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return subtle().importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
}

export async function sha256(data: string | Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const bytes = typeof data === "string" ? encoder.encode(data) : data
  return new Uint8Array(await subtle().digest("SHA-256", bytes))
}

// --------------------------------------------------------------------- JWT

const HEADER: JwtHeader = { alg: "HS256", typ: "JWT" }

/** Signs `payload` as an HS256 JWT (compact serialisation). */
export async function signJwt(payload: JwtPayload, secret: string = DEMO_HS256_KEY): Promise<string> {
  const h = base64urlEncodeText(JSON.stringify(HEADER))
  const p = base64urlEncodeText(JSON.stringify(payload))
  const key = await hmacKey(secret)
  const sig = new Uint8Array(await subtle().sign("HMAC", key, encoder.encode(`${h}.${p}`)))
  return `${h}.${p}.${base64urlEncode(sig)}`
}

/** Issues a 15-minute access token at `nowMs` (claims in seconds). */
export function issueAccessToken(
  claims: { sub: string; role: string; scope: string },
  nowMs: number,
  secret: string = DEMO_HS256_KEY,
): Promise<string> {
  const iat = Math.floor(nowMs / 1000)
  return signJwt({ sub: claims.sub, role: claims.role, scope: claims.scope, iat, exp: iat + ACCESS_TOKEN_TTL_S }, secret)
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function isHeader(v: unknown): v is JwtHeader {
  return isRecord(v) && v.alg === "HS256" && v.typ === "JWT"
}

function isPayload(v: unknown): v is JwtPayload {
  return (
    isRecord(v) &&
    typeof v.sub === "string" &&
    typeof v.role === "string" &&
    typeof v.scope === "string" &&
    typeof v.iat === "number" &&
    typeof v.exp === "number"
  )
}

export function splitJwt(token: string): JwtSegments | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts
  if (header === undefined || payload === undefined || signature === undefined) return null
  return { header, payload, signature }
}

/** Decodes without verifying. Returns null if the token is not a well-formed HS256 demo JWT. */
export function decodeJwt(token: string): DecodedJwt | null {
  const segments = splitJwt(token)
  if (!segments) return null
  try {
    const header: unknown = JSON.parse(base64urlDecodeText(segments.header))
    const payload: unknown = JSON.parse(base64urlDecodeText(segments.payload))
    base64urlDecode(segments.signature)
    if (!isHeader(header) || !isPayload(payload)) return null
    return { header, payload, segments }
  } catch {
    return null
  }
}

/** True when `nowMs` is at or past `exp` (RFC 7519 §4.1.4). */
export function isExpired(payload: Pick<JwtPayload, "exp">, nowMs: number): boolean {
  return Math.floor(nowMs / 1000) >= payload.exp
}

/** Checks signature first (constant-time via WebCrypto), then expiry. */
export async function verifyJwt(token: string, nowMs: number, secret: string = DEMO_HS256_KEY): Promise<VerifyResult> {
  const decoded = decodeJwt(token)
  if (!decoded) return { ok: false, error: "malformed" }
  const { segments } = decoded
  const key = await hmacKey(secret)
  const valid = await subtle().verify(
    "HMAC",
    key,
    base64urlDecode(segments.signature),
    encoder.encode(`${segments.header}.${segments.payload}`),
  )
  if (!valid) return { ok: false, error: "invalid_signature" }
  if (isExpired(decoded.payload, nowMs)) return { ok: false, error: "token_expired" }
  return { ok: true, payload: decoded.payload }
}

/**
 * The "Tamper" button: rewrites the payload's role ("customer" → "admin" by
 * default) and re-encodes it, keeping the ORIGINAL header and signature, so
 * verification must fail with invalid_signature. Throws on a malformed token.
 */
export function tamper(token: string, role: string = "admin"): string {
  const decoded = decodeJwt(token)
  if (!decoded) throw new Error("Cannot tamper with a malformed token")
  const payload = base64urlEncodeText(JSON.stringify({ ...decoded.payload, role }))
  return `${decoded.segments.header}.${payload}.${decoded.segments.signature}`
}
