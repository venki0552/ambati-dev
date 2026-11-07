/**
 * OAuth 2.0 Authorization Code + PKCE → JWT demo (SPEC §4.2, design/OAuthJwt.dc.html).
 *
 * Three layers, all pure (immutable data in → new data out):
 *   1. PKCE helpers (RFC 7636): verifier from injected random bytes, S256 challenge via WebCrypto.
 *   2. A simulated auth server (single-use codes bound to the challenge, refresh_token grant)
 *      and a simulated Banking API `GET /accounts` that verifies the JWT with jwt.ts.
 *   3. The 6-step stepper state machine the UI renders.
 *
 * Functions that need WebCrypto are async. Randomness is injected as
 * `randomBytes(n)` — in the browser: `n => crypto.getRandomValues(new Uint8Array(n))`.
 */
import type { LogEntry, LogTone } from "./registry"
import { pushLog } from "./registry"
import { ACCESS_TOKEN_TTL_S, DEMO_HS256_KEY, base64urlEncode, decodeJwt, isExpired, issueAccessToken, sha256, tamper, verifyJwt } from "./jwt"
import type { DecodedJwt } from "./jwt"

export type RandomBytes = (length: number) => Uint8Array

// ------------------------------------------------------------------- PKCE

/** RFC 7636 §4.1: 43–128 chars from the unreserved set. */
const VERIFIER_RE = /^[A-Za-z0-9\-._~]{43,128}$/

export function isValidCodeVerifier(v: string): boolean {
  return VERIFIER_RE.test(v)
}

/**
 * base64url(randomBytes). 32 bytes → 43 chars (the RFC's recommendation).
 * Accepts 32–96 bytes (43–128 chars); throws RangeError otherwise.
 */
export function generateCodeVerifier(randomBytes: Uint8Array): string {
  if (randomBytes.length < 32 || randomBytes.length > 96) {
    throw new RangeError("code_verifier needs 32–96 random bytes (43–128 chars)")
  }
  return base64urlEncode(randomBytes)
}

/** code_challenge = BASE64URL(SHA-256(ASCII(code_verifier))). */
export async function computeCodeChallenge(verifier: string): Promise<string> {
  return base64urlEncode(await sha256(verifier))
}

export type PkcePair = { verifier: string; challenge: string; method: "S256" }

export async function createPkcePair(randomBytes: RandomBytes): Promise<PkcePair> {
  const verifier = generateCodeVerifier(randomBytes(32))
  return { verifier, challenge: await computeCodeChallenge(verifier), method: "S256" }
}

// ------------------------------------------------------ simulated auth server

export const DEMO_CLIENT_ID = "demo-banking-app"
export const DEMO_REDIRECT_URI = "https://app.example/callback"
export const DEMO_SCOPE = "accounts:read"
/** The signed-in demo user (claims from the design's payload). */
export const DEMO_USER = { sub: "user_1042", role: "customer", scope: DEMO_SCOPE } as const

export type AuthCodeRecord = {
  readonly code: string
  readonly challenge: string
  readonly method: "S256"
  readonly clientId: string
  readonly sub: string
  readonly role: string
  readonly scope: string
  readonly issuedAt: number
  readonly used: boolean
}

export type RefreshTokenRecord = {
  readonly token: string
  readonly sub: string
  readonly role: string
  readonly scope: string
  readonly revoked: boolean
}

export type AuthServerState = {
  readonly codes: readonly AuthCodeRecord[]
  readonly refreshTokens: readonly RefreshTokenRecord[]
}

export type TokenResponse = {
  readonly access_token: string
  readonly token_type: "Bearer"
  readonly expires_in: number
  readonly refresh_token: string
  readonly scope: string
}

export type TokenError = {
  readonly error: "invalid_grant" | "invalid_request"
  readonly error_description: string
}

export type TokenEndpointResult =
  | { readonly server: AuthServerState; readonly status: 200; readonly body: TokenResponse }
  | { readonly server: AuthServerState; readonly status: 400; readonly body: TokenError }

export function createAuthServer(): AuthServerState {
  return { codes: [], refreshTokens: [] }
}

/**
 * /authorize after the user signed in and consented: issues a one-time code
 * bound to the code_challenge. Only S256 is accepted.
 */
export function authorize(
  server: AuthServerState,
  req: { codeChallenge: string; codeChallengeMethod: string; clientId: string; user: { sub: string; role: string; scope: string } },
  randomBytes: RandomBytes,
  now: number,
): { server: AuthServerState; code: string } {
  if (req.codeChallengeMethod !== "S256") throw new Error("Only code_challenge_method=S256 is supported")
  if (!req.codeChallenge) throw new Error("code_challenge is required")
  const code = base64urlEncode(randomBytes(16))
  const record: AuthCodeRecord = {
    code,
    challenge: req.codeChallenge,
    method: "S256",
    clientId: req.clientId,
    sub: req.user.sub,
    role: req.user.role,
    scope: req.user.scope,
    issuedAt: now,
    used: false,
  }
  return { code, server: { ...server, codes: [...server.codes, record] } }
}

function grantError(server: AuthServerState, description: string): TokenEndpointResult {
  return { server, status: 400, body: { error: "invalid_grant", error_description: description } }
}

async function issueTokens(
  server: AuthServerState,
  who: { sub: string; role: string; scope: string },
  randomBytes: RandomBytes,
  now: number,
  secret: string,
): Promise<{ server: AuthServerState; body: TokenResponse }> {
  const access_token = await issueAccessToken(who, now, secret)
  const refresh_token = base64urlEncode(randomBytes(32))
  const record: RefreshTokenRecord = { token: refresh_token, sub: who.sub, role: who.role, scope: who.scope, revoked: false }
  return {
    server: { ...server, refreshTokens: [...server.refreshTokens, record] },
    body: { access_token, token_type: "Bearer", expires_in: ACCESS_TOKEN_TTL_S, refresh_token, scope: who.scope },
  }
}

/**
 * POST /token, grant_type=authorization_code. Checks, in order: code exists ·
 * verifier present · code not used yet · SHA-256(verifier) matches the bound
 * challenge. A failed attempt does not burn the code (so the attacker's replay
 * doesn't break the legitimate step 5); a successful exchange does.
 */
export async function exchangeCode(
  server: AuthServerState,
  req: { code: string; codeVerifier?: string | null; clientId: string },
  randomBytes: RandomBytes,
  now: number,
  secret: string = DEMO_HS256_KEY,
): Promise<TokenEndpointResult> {
  const record = server.codes.find((c) => c.code === req.code)
  if (!record || record.clientId !== req.clientId) return grantError(server, "unknown authorization code")
  if (!req.codeVerifier) return grantError(server, "code_verifier missing")
  if (record.used) return grantError(server, "authorization code already used")
  if (!isValidCodeVerifier(req.codeVerifier) || (await computeCodeChallenge(req.codeVerifier)) !== record.challenge) {
    return grantError(server, "code_verifier does not match code_challenge")
  }
  const burned: AuthServerState = { ...server, codes: server.codes.map((c) => (c.code === req.code ? { ...c, used: true } : c)) }
  const issued = await issueTokens(burned, record, randomBytes, now, secret)
  return { server: issued.server, status: 200, body: issued.body }
}

/** POST /token, grant_type=refresh_token. Rotates the refresh token (old one revoked). */
export async function refreshAccessToken(
  server: AuthServerState,
  refreshToken: string,
  randomBytes: RandomBytes,
  now: number,
  secret: string = DEMO_HS256_KEY,
): Promise<TokenEndpointResult> {
  const record = server.refreshTokens.find((r) => r.token === refreshToken)
  if (!record || record.revoked) return grantError(server, "refresh token invalid or revoked")
  const revoked: AuthServerState = {
    ...server,
    refreshTokens: server.refreshTokens.map((r) => (r.token === refreshToken ? { ...r, revoked: true } : r)),
  }
  const issued = await issueTokens(revoked, record, randomBytes, now, secret)
  return { server: issued.server, status: 200, body: issued.body }
}

// ---------------------------------------------------- simulated Banking API

export type AccountsResponse =
  | { readonly status: 200; readonly body: { readonly accounts: number } }
  | { readonly status: 401; readonly error: "invalid_signature" | "token_expired" | "invalid_token" }

/** Number of accounts the demo API returns (design: "OK · 3 accounts returned"). */
export const DEMO_ACCOUNT_COUNT = 3

/** GET /accounts with `Authorization: Bearer <JWT>`. */
export async function getAccounts(
  authorization: string | null,
  now: number,
  secret: string = DEMO_HS256_KEY,
): Promise<AccountsResponse> {
  const m = authorization ? /^Bearer (\S+)$/.exec(authorization) : null
  const token = m?.[1]
  if (!token) return { status: 401, error: "invalid_token" }
  const v = await verifyJwt(token, now, secret)
  if (v.ok) return { status: 200, body: { accounts: DEMO_ACCOUNT_COUNT } }
  return { status: 401, error: v.error === "malformed" ? "invalid_token" : v.error }
}

// ------------------------------------------------------------ stepper state

export type OAuthStep = 0 | 1 | 2 | 3 | 4 | 5 | 6
export const OAUTH_STEP_COUNT = 6

/** Step copy from the design: [text, route]. Index 0 = step 1. */
export const OAUTH_STEPS: readonly { readonly text: string; readonly route: string; readonly short: string }[] = [
  { text: "Create a random code_verifier and its SHA-256 code_challenge.", route: "BROWSER APP", short: "PKCE pair created" },
  { text: "Redirect to /authorize with the code_challenge (method S256).", route: "BROWSER APP → AUTH SERVER", short: "Redirected to /authorize" },
  { text: "You sign in and consent (simulated).", route: "YOU → AUTH SERVER", short: "Signed in and consented" },
  { text: "Redirect back with a one-time authorization code.", route: "AUTH SERVER → BROWSER APP", short: "Authorization code received" },
  { text: "Swap the code + code_verifier for a JWT (15 min) and a refresh token.", route: "BROWSER APP → AUTH SERVER", short: "Tokens issued: JWT (15 min) + refresh" },
  { text: "Call GET /accounts with Authorization: Bearer <JWT>.", route: "BROWSER APP → BANKING API", short: "GET /accounts with Bearer JWT" },
]

export type ApiStatus = { readonly code: "200" | "400" | "401"; readonly text: string; readonly tone: LogTone }

export type OAuthDemoState = {
  readonly step: OAuthStep
  /** Null until preparePkce() resolves (UI shows "computing…"). */
  readonly pkce: PkcePair | null
  /** Step 2: the /authorize URL the browser is redirected to. */
  readonly authorizeUrl: string | null
  /** Step 2: the `state` CSRF parameter. */
  readonly authState: string | null
  /** Step 3. */
  readonly signedIn: boolean
  /** Step 4: the one-time authorization code. */
  readonly code: string | null
  /** Latest successful token response (step 5 / refresh). */
  readonly tokenResponse: TokenResponse | null
  /** The token the app currently sends — the issued one, or its tampered copy. */
  readonly accessToken: string | null
  readonly tampered: boolean
  /** Virtual clock offset added by "Fast-forward 15 min". Effective time = now + clockOffsetMs. */
  readonly clockOffsetMs: number
  readonly server: AuthServerState
  /** Big status readout; null = "No API call yet". */
  readonly status: ApiStatus | null
  readonly log: readonly LogEntry[]
  readonly seq: number
}

export type OAuthDeps = { now: number; randomBytes: RandomBytes; secret?: string }

export const FAST_FORWARD_MS = ACCESS_TOKEN_TTL_S * 1000

export function createOAuthDemo(now: number): OAuthDemoState {
  return {
    step: 0,
    pkce: null,
    authorizeUrl: null,
    authState: null,
    signedIn: false,
    code: null,
    tokenResponse: null,
    accessToken: null,
    tampered: false,
    clockOffsetMs: 0,
    server: createAuthServer(),
    status: null,
    log: [{ id: 0, at: now, text: "Ready · press Next step", tone: "muted" }],
    seq: 1,
  }
}

/** Fresh flow, log "Reset · new PKCE pair"; call preparePkce() afterwards. */
export function reset(state: OAuthDemoState, now: number): OAuthDemoState {
  return {
    ...createOAuthDemo(now),
    log: [{ id: state.seq, at: now, text: "Reset · new PKCE pair", tone: "muted" }],
    seq: state.seq + 1,
  }
}

/** Creates the verifier/challenge pair (the design shows it before step 1). No-op if present. */
export async function preparePkce(state: OAuthDemoState, randomBytes: RandomBytes): Promise<OAuthDemoState> {
  if (state.pkce) return state
  return { ...state, pkce: await createPkcePair(randomBytes) }
}

export function buildAuthorizeUrl(p: { clientId: string; redirectUri: string; scope: string; state: string; codeChallenge: string }): string {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: p.clientId,
    redirect_uri: p.redirectUri,
    scope: p.scope,
    state: p.state,
    code_challenge: p.codeChallenge,
    code_challenge_method: "S256",
  })
  return `/authorize?${q.toString()}`
}

export function effectiveNow(state: OAuthDemoState, now: number): number {
  return now + state.clockOffsetMs
}

function apiStatus(r: AccountsResponse): ApiStatus {
  if (r.status === 200) return { code: "200", text: `OK · ${r.body.accounts} accounts returned`, tone: "go" }
  if (r.error === "invalid_signature") return { code: "401", text: "invalid_signature · payload changed after signing", tone: "stop" }
  if (r.error === "token_expired") return { code: "401", text: "token_expired · use the refresh token", tone: "stop" }
  return { code: "401", text: "invalid_token", tone: "stop" }
}

function logStep(state: OAuthDemoState, n: OAuthStep, now: number): OAuthDemoState {
  const short = OAUTH_STEPS[n - 1]?.short ?? ""
  return pushLog({ ...state, step: n }, `Step ${n} · ${short}`, n === 6 ? "go" : "muted", now)
}

/** Advances one step ("Start" / "Next step" / each "Play all" beat). No-op at step 6. */
export async function nextStep(state: OAuthDemoState, deps: OAuthDeps): Promise<OAuthDemoState> {
  const { now, randomBytes } = deps
  const secret = deps.secret ?? DEMO_HS256_KEY
  const t = effectiveNow(state, now)
  switch (state.step) {
    case 0: {
      const s = await preparePkce(state, randomBytes)
      return logStep(s, 1, now)
    }
    case 1: {
      const s = await preparePkce(state, randomBytes)
      const pkce = s.pkce as PkcePair
      const authState = base64urlEncode(randomBytes(12))
      const authorizeUrl = buildAuthorizeUrl({
        clientId: DEMO_CLIENT_ID,
        redirectUri: DEMO_REDIRECT_URI,
        scope: DEMO_SCOPE,
        state: authState,
        codeChallenge: pkce.challenge,
      })
      return logStep({ ...s, authState, authorizeUrl }, 2, now)
    }
    case 2:
      return logStep({ ...state, signedIn: true }, 3, now)
    case 3: {
      const pkce = state.pkce as PkcePair
      const { server, code } = authorize(
        state.server,
        { codeChallenge: pkce.challenge, codeChallengeMethod: pkce.method, clientId: DEMO_CLIENT_ID, user: DEMO_USER },
        randomBytes,
        t,
      )
      return logStep({ ...state, server, code }, 4, now)
    }
    case 4: {
      const pkce = state.pkce as PkcePair
      const r = await exchangeCode(state.server, { code: state.code ?? "", codeVerifier: pkce.verifier, clientId: DEMO_CLIENT_ID }, randomBytes, t, secret)
      if (r.status !== 200) {
        const status: ApiStatus = { code: "400", text: `${r.body.error} · ${r.body.error_description}`, tone: "stop" }
        return pushLog({ ...state, server: r.server, status }, `400 · ${status.text}`, "stop", now)
      }
      return logStep({ ...state, server: r.server, tokenResponse: r.body, accessToken: r.body.access_token, tampered: false }, 5, now)
    }
    case 5: {
      const res = await getAccounts(state.accessToken ? `Bearer ${state.accessToken}` : null, t, secret)
      return logStep({ ...state, status: apiStatus(res) }, 6, now)
    }
    default:
      return state
  }
}

/** True once the JWT exists (design enables Call API / Tamper / Fast-forward / Refresh). */
export function hasToken(state: OAuthDemoState): boolean {
  return state.accessToken !== null
}

/** True once the code exists (design enables "Replay stolen code"). */
export function hasCode(state: OAuthDemoState): boolean {
  return state.code !== null
}

/** "Call API": GET /accounts with the current (maybe tampered) token at the virtual time. */
export async function callApi(state: OAuthDemoState, now: number, secret: string = DEMO_HS256_KEY): Promise<OAuthDemoState> {
  if (!state.accessToken) return state
  const status = apiStatus(await getAccounts(`Bearer ${state.accessToken}`, effectiveNow(state, now), secret))
  return pushLog({ ...state, status }, `${status.code} · ${status.text}`, status.tone, now)
}

/** "Tamper: role → admin" toggle. Keeps the original signature. */
export function toggleTamper(state: OAuthDemoState, now: number): OAuthDemoState {
  const original = state.tokenResponse?.access_token
  if (!original) return state
  if (state.tampered) {
    return pushLog({ ...state, tampered: false, accessToken: original }, "Payload restored", "muted", now)
  }
  return pushLog({ ...state, tampered: true, accessToken: tamper(original, "admin") }, 'Payload edited: role "customer" → "admin"', "signal", now)
}

/** "Fast-forward 15 min": advances the virtual clock by the token lifetime. */
export function fastForward(state: OAuthDemoState, now: number): OAuthDemoState {
  if (!state.accessToken) return state
  return pushLog({ ...state, clockOffsetMs: state.clockOffsetMs + FAST_FORWARD_MS }, "Clock +15 min · access token expired", "signal", now)
}

/** "Use refresh token": refresh_token grant → new JWT (untampered) + rotated refresh token. */
export async function redeemRefreshToken(state: OAuthDemoState, deps: OAuthDeps): Promise<OAuthDemoState> {
  const rt = state.tokenResponse?.refresh_token
  if (!rt) return state
  const r = await refreshAccessToken(state.server, rt, deps.randomBytes, effectiveNow(state, deps.now), deps.secret ?? DEMO_HS256_KEY)
  if (r.status !== 200) {
    const status: ApiStatus = { code: "400", text: `${r.body.error} · ${r.body.error_description}`, tone: "stop" }
    return pushLog({ ...state, server: r.server, status }, `400 · ${status.text}`, "stop", deps.now)
  }
  return pushLog(
    { ...state, server: r.server, tokenResponse: r.body, accessToken: r.body.access_token, tampered: false },
    "Refresh token used · new access token issued",
    "go",
    deps.now,
  )
}

/** "Replay stolen code": the attacker posts the code without the verifier → 400 invalid_grant. */
export async function stealCode(state: OAuthDemoState, deps: OAuthDeps): Promise<OAuthDemoState> {
  if (!state.code) return state
  const r = await exchangeCode(state.server, { code: state.code, codeVerifier: null, clientId: DEMO_CLIENT_ID }, deps.randomBytes, effectiveNow(state, deps.now), deps.secret ?? DEMO_HS256_KEY)
  const status: ApiStatus =
    r.status === 200
      ? { code: "200", text: "token issued", tone: "go" } // unreachable without a verifier
      : { code: "400", text: `${r.body.error} · ${r.body.error_description}`, tone: "stop" }
  return pushLog({ ...state, server: r.server, status }, "Attacker replays the stolen code without the verifier", "signal", deps.now)
}

// ----------------------------------------------------------- view helpers

export type TokenView = {
  decoded: DecodedJwt
  expired: boolean
  /** "VALID · 15 MIN" / "EXPIRED" (design copy). */
  expLabel: string
}

/** Decoded current token for the JWT inspector, or null before step 5. */
export function tokenView(state: OAuthDemoState, now: number): TokenView | null {
  if (!state.accessToken) return null
  const decoded = decodeJwt(state.accessToken)
  if (!decoded) return null
  const expired = isExpired(decoded.payload, effectiveNow(state, now))
  return { decoded, expired, expLabel: expired ? "EXPIRED" : "VALID · 15 MIN" }
}
