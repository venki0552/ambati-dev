import { describe, it, expect } from "vitest"
import {
  DEMO_CLIENT_ID,
  DEMO_USER,
  OAUTH_STEPS,
  authorize,
  callApi,
  computeCodeChallenge,
  createAuthServer,
  createOAuthDemo,
  createPkcePair,
  exchangeCode,
  fastForward,
  generateCodeVerifier,
  getAccounts,
  isValidCodeVerifier,
  nextStep,
  preparePkce,
  redeemRefreshToken,
  refreshAccessToken,
  reset,
  stealCode,
  toggleTamper,
  tokenView,
} from "./oauthPkce"
import type { OAuthDemoState, RandomBytes } from "./oauthPkce"
import { decodeJwt, issueAccessToken, tamper } from "./jwt"

const NOW = Date.UTC(2026, 10, 7, 12, 0, 0)

/** Deterministic byte source: a counter, so every call yields different bytes. */
function seqBytes(): RandomBytes {
  let k = 0
  return (n) => Uint8Array.from({ length: n }, () => (k++ * 37 + 11) & 0xff)
}

const RFC_VERIFIER_BYTES = [
  116, 24, 223, 180, 151, 153, 224, 37, 79, 250, 96, 125, 216, 173, 187, 186, 22, 212, 37, 77, 105, 214, 191, 240, 91, 88, 5, 88, 83,
  132, 141, 121,
]

function lastLog(s: OAuthDemoState): string {
  return s.log[s.log.length - 1]?.text ?? ""
}

async function runSteps(n: number, s: OAuthDemoState = createOAuthDemo(NOW), rb: RandomBytes = seqBytes()): Promise<OAuthDemoState> {
  for (let i = 0; i < n; i++) s = await nextStep(s, { now: NOW + i * 900, randomBytes: rb })
  return s
}

describe("PKCE (RFC 7636)", () => {
  it("Appendix B: verifier from the RFC octets and its S256 challenge", async () => {
    const verifier = generateCodeVerifier(Uint8Array.from(RFC_VERIFIER_BYTES))
    expect(verifier).toBe("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
    expect(await computeCodeChallenge(verifier)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
  })

  it("verifier is 43–128 unreserved chars", () => {
    const v32 = generateCodeVerifier(new Uint8Array(32).fill(255))
    expect(v32).toHaveLength(43)
    expect(isValidCodeVerifier(v32)).toBe(true)
    expect(generateCodeVerifier(new Uint8Array(96))).toHaveLength(128)
    expect(() => generateCodeVerifier(new Uint8Array(31))).toThrow(RangeError)
    expect(() => generateCodeVerifier(new Uint8Array(97))).toThrow(RangeError)
    expect(isValidCodeVerifier("short")).toBe(false)
    expect(isValidCodeVerifier("a".repeat(43) + "+")).toBe(false)
  })

  it("createPkcePair uses the injected randomness", async () => {
    const pair = await createPkcePair(() => Uint8Array.from(RFC_VERIFIER_BYTES))
    expect(pair).toEqual({
      verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
      method: "S256",
    })
  })
})

describe("simulated auth server", () => {
  async function issued() {
    const rb = seqBytes()
    const pkce = await createPkcePair(rb)
    const a = authorize(
      createAuthServer(),
      { codeChallenge: pkce.challenge, codeChallengeMethod: "S256", clientId: DEMO_CLIENT_ID, user: DEMO_USER },
      rb,
      NOW,
    )
    return { rb, pkce, ...a }
  }

  it("exchanges code + verifier for a 15-minute JWT and a refresh token", async () => {
    const { rb, pkce, server, code } = await issued()
    const r = await exchangeCode(server, { code, codeVerifier: pkce.verifier, clientId: DEMO_CLIENT_ID }, rb, NOW)
    expect(r.status).toBe(200)
    if (r.status !== 200) return
    expect(r.body).toMatchObject({ token_type: "Bearer", expires_in: 900, scope: "accounts:read" })
    expect(decodeJwt(r.body.access_token)?.payload).toMatchObject({ sub: "user_1042", role: "customer" })
    expect(r.body.refresh_token.length).toBeGreaterThan(20)
  })

  it("stolen code replayed without the verifier → 400 invalid_grant (code stays usable for the real app)", async () => {
    const { rb, pkce, server, code } = await issued()
    const stolen = await exchangeCode(server, { code, codeVerifier: null, clientId: DEMO_CLIENT_ID }, rb, NOW)
    expect(stolen.status).toBe(400)
    expect(stolen.body).toEqual({ error: "invalid_grant", error_description: "code_verifier missing" })
    const legit = await exchangeCode(stolen.server, { code, codeVerifier: pkce.verifier, clientId: DEMO_CLIENT_ID }, rb, NOW)
    expect(legit.status).toBe(200)
  })

  it("wrong verifier → invalid_grant", async () => {
    const { rb, server, code } = await issued()
    const other = generateCodeVerifier(new Uint8Array(32).fill(7))
    const r = await exchangeCode(server, { code, codeVerifier: other, clientId: DEMO_CLIENT_ID }, rb, NOW)
    expect(r.body).toEqual({ error: "invalid_grant", error_description: "code_verifier does not match code_challenge" })
  })

  it("codes are single-use: reuse is rejected", async () => {
    const { rb, pkce, server, code } = await issued()
    const first = await exchangeCode(server, { code, codeVerifier: pkce.verifier, clientId: DEMO_CLIENT_ID }, rb, NOW)
    expect(first.status).toBe(200)
    const again = await exchangeCode(first.server, { code, codeVerifier: pkce.verifier, clientId: DEMO_CLIENT_ID }, rb, NOW)
    expect(again.status).toBe(400)
    expect(again.body).toEqual({ error: "invalid_grant", error_description: "authorization code already used" })
  })

  it("unknown code / wrong client → invalid_grant; plain method refused", async () => {
    const { rb, pkce, server, code } = await issued()
    expect((await exchangeCode(server, { code: "nope", codeVerifier: pkce.verifier, clientId: DEMO_CLIENT_ID }, rb, NOW)).status).toBe(400)
    expect((await exchangeCode(server, { code, codeVerifier: pkce.verifier, clientId: "evil" }, rb, NOW)).status).toBe(400)
    expect(() =>
      authorize(createAuthServer(), { codeChallenge: "x", codeChallengeMethod: "plain", clientId: DEMO_CLIENT_ID, user: DEMO_USER }, rb, NOW),
    ).toThrow()
  })

  it("refresh_token grant issues a new JWT and rotates the refresh token", async () => {
    const { rb, pkce, server, code } = await issued()
    const first = await exchangeCode(server, { code, codeVerifier: pkce.verifier, clientId: DEMO_CLIENT_ID }, rb, NOW)
    if (first.status !== 200) throw new Error("exchange failed")
    const later = NOW + 20 * 60_000
    const r = await refreshAccessToken(first.server, first.body.refresh_token, rb, later)
    expect(r.status).toBe(200)
    if (r.status !== 200) return
    expect(r.body.access_token).not.toBe(first.body.access_token)
    expect(decodeJwt(r.body.access_token)?.payload.iat).toBe(later / 1000)
    const reused = await refreshAccessToken(r.server, first.body.refresh_token, rb, later)
    expect(reused.status).toBe(400)
  })
})

describe("Banking API GET /accounts", () => {
  it("200 with a valid Bearer JWT, 401 for tampered / expired / missing", async () => {
    const token = await issueAccessToken(DEMO_USER, NOW)
    expect(await getAccounts(`Bearer ${token}`, NOW)).toEqual({ status: 200, body: { accounts: 3 } })
    expect(await getAccounts(`Bearer ${tamper(token)}`, NOW)).toEqual({ status: 401, error: "invalid_signature" })
    expect(await getAccounts(`Bearer ${token}`, NOW + 15 * 60_000)).toEqual({ status: 401, error: "token_expired" })
    expect(await getAccounts(null, NOW)).toEqual({ status: 401, error: "invalid_token" })
    expect(await getAccounts(token, NOW)).toEqual({ status: 401, error: "invalid_token" })
  })
})

describe("OAuth demo stepper", () => {
  it("has the 6 design steps", () => {
    expect(OAUTH_STEPS).toHaveLength(6)
  })

  it("preparePkce fills the pair before step 1 (design shows it up-front)", async () => {
    const s = await preparePkce(createOAuthDemo(NOW), () => Uint8Array.from(RFC_VERIFIER_BYTES))
    expect(s.pkce?.challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
    expect(s.step).toBe(0)
  })

  it("walks the full 6-step flow → 200", async () => {
    let s = createOAuthDemo(NOW)
    expect(lastLog(s)).toBe("Ready · press Next step")
    const rb = seqBytes()

    s = await runSteps(1, s, rb)
    expect(s.step).toBe(1)
    expect(s.pkce && (await computeCodeChallenge(s.pkce.verifier))).toBe(s.pkce?.challenge)
    expect(lastLog(s)).toBe("Step 1 · PKCE pair created")

    s = await runSteps(1, s, rb)
    expect(s.step).toBe(2)
    const url = new URL(s.authorizeUrl ?? "", "https://auth.example")
    expect(url.pathname).toBe("/authorize")
    expect(url.searchParams.get("code_challenge")).toBe(s.pkce?.challenge)
    expect(url.searchParams.get("code_challenge_method")).toBe("S256")
    expect(url.searchParams.get("response_type")).toBe("code")
    expect(url.searchParams.get("state")).toBe(s.authState)
    expect(lastLog(s)).toBe("Step 2 · Redirected to /authorize")

    s = await runSteps(1, s, rb)
    expect(s.signedIn).toBe(true)
    expect(lastLog(s)).toBe("Step 3 · Signed in and consented")

    s = await runSteps(1, s, rb)
    expect(s.code).toBeTruthy()
    expect(s.server.codes).toHaveLength(1)
    expect(lastLog(s)).toBe("Step 4 · Authorization code received")

    s = await runSteps(1, s, rb)
    expect(s.tokenResponse?.expires_in).toBe(900)
    expect(s.accessToken).toBe(s.tokenResponse?.access_token)
    expect(tokenView(s, NOW)?.expLabel).toBe("VALID · 15 MIN")
    expect(lastLog(s)).toBe("Step 5 · Tokens issued: JWT (15 min) + refresh")

    s = await runSteps(1, s, rb)
    expect(s.step).toBe(6)
    expect(s.status).toEqual({ code: "200", text: "OK · 3 accounts returned", tone: "go" })
    expect(lastLog(s)).toBe("Step 6 · GET /accounts with Bearer JWT")

    expect(await nextStep(s, { now: NOW, randomBytes: rb })).toBe(s)
  })

  it("tamper → 401 invalid_signature; restore → 200", async () => {
    let s = await runSteps(5)
    s = toggleTamper(s, NOW)
    expect(lastLog(s)).toBe('Payload edited: role "customer" → "admin"')
    expect(tokenView(s, NOW)?.decoded.payload.role).toBe("admin")
    s = await callApi(s, NOW)
    expect(s.status).toEqual({ code: "401", text: "invalid_signature · payload changed after signing", tone: "stop" })
    expect(lastLog(s)).toBe("401 · invalid_signature · payload changed after signing")
    s = toggleTamper(s, NOW)
    expect(lastLog(s)).toBe("Payload restored")
    s = await callApi(s, NOW)
    expect(lastLog(s)).toBe("200 · OK · 3 accounts returned")
  })

  it("fast-forward 15 min → 401 token_expired → refresh → 200", async () => {
    let s = await runSteps(6)
    const T = NOW + 10_000 // after the token was issued (steps ran at NOW … NOW+4.5s)
    s = fastForward(s, T)
    expect(lastLog(s)).toBe("Clock +15 min · access token expired")
    expect(tokenView(s, T)?.expLabel).toBe("EXPIRED")
    s = await callApi(s, T)
    expect(s.status).toEqual({ code: "401", text: "token_expired · use the refresh token", tone: "stop" })
    const oldToken = s.accessToken
    s = await redeemRefreshToken(s, { now: T, randomBytes: seqBytes() })
    expect(lastLog(s)).toBe("Refresh token used · new access token issued")
    expect(s.accessToken).not.toBe(oldToken)
    expect(tokenView(s, T)?.expired).toBe(false)
    s = await callApi(s, T)
    expect(s.status?.code).toBe("200")
  })

  it("refresh clears a tampered token", async () => {
    let s = toggleTamper(await runSteps(5), NOW)
    s = await redeemRefreshToken(s, { now: NOW, randomBytes: seqBytes() })
    expect(s.tampered).toBe(false)
    expect((await callApi(s, NOW)).status?.code).toBe("200")
  })

  it("steal the code → 400 invalid_grant, and the legit flow still completes", async () => {
    let s = await runSteps(4)
    s = await stealCode(s, { now: NOW, randomBytes: seqBytes() })
    expect(s.status).toEqual({ code: "400", text: "invalid_grant · code_verifier missing", tone: "stop" })
    expect(lastLog(s)).toBe("Attacker replays the stolen code without the verifier")
    s = await runSteps(2, s)
    expect(s.status?.code).toBe("200")
  })

  it("actions are no-ops before their step", async () => {
    const s = createOAuthDemo(NOW)
    expect(toggleTamper(s, NOW)).toBe(s)
    expect(fastForward(s, NOW)).toBe(s)
    expect(await callApi(s, NOW)).toBe(s)
    expect(await stealCode(s, { now: NOW, randomBytes: seqBytes() })).toBe(s)
    expect(await redeemRefreshToken(s, { now: NOW, randomBytes: seqBytes() })).toBe(s)
    expect(tokenView(s, NOW)).toBeNull()
  })

  it("reset starts over with a new PKCE pair to prepare", async () => {
    const done = await runSteps(6)
    const s = reset(done, NOW)
    expect(s.step).toBe(0)
    expect(s.pkce).toBeNull()
    expect(s.accessToken).toBeNull()
    expect(s.log.map((e) => e.text)).toEqual(["Reset · new PKCE pair"])
    expect(s.log[0]?.id).toBe(done.seq)
  })
})
