# Design reference — ambati.dev "Signal Box"

Live canvas: https://claude.ai/artifact/2u7CDw2BUcC9RpdKHBcHWa (approved by Venkat, Nov 7, 2026)

These files are the approved design, exported from the canvas. They are a **reference to port, not code to ship**: they use a canvas runtime (`support.js`, `<x-dc>`, `<sc-for>`, `<sc-if>`, `<dc-import>`, `{{holes}}`, `class Component extends DCLogic`) that does not exist in the React app.

| File | What it is | Port to |
|---|---|---|
| `Main.dc.html` | Full homepage, every section, final copy, colors, spacing, page-load animation CSS, random hero demo + Lab tabs + theme switch logic | `src/App.tsx` + `src/components/site/*` + `src/styles/globals.css` |
| `CircuitBreaker.dc.html` | Circuit breaker demo: UI + state machine (opens at 3 failures in last 6, 5s cooldown, 1 trial call) | `src/lab/circuitBreaker.ts` + `src/components/lab/CircuitBreakerDemo.tsx` |
| `OAuthJwt.dc.html` | OAuth + PKCE → JWT demo: 6 steps, real SHA-256 + HMAC via WebCrypto, tamper / expire / refresh / stolen-code | `src/lab/oauthPkce.ts`, `src/lab/jwt.ts` + `src/components/lab/OAuthJwtDemo.tsx` |
| `TokenBucket.dc.html` | Token bucket demo: capacity 5, +1 token / 2s, Burst ×10 | `src/lab/tokenBucket.ts` + `src/components/lab/TokenBucketDemo.tsx` |
| `Phone.dc.html` | The homepage at 390px in light theme | Responsive behaviour to match |
| `canvas.json` | Canvas layout and the two design notes (random demo, motion rule) | — |

## How to port

- **Copy, colors and spacing:** take them exactly from the markup. The theme palettes are in `palette()` in `Main.dc.html` and must become the CSS variables in SPEC §2.2 (`.dark` / `:root`).
- **Fonts:** Big Shoulders Display, Atkinson Hyperlegible Next and Martian Mono (self-hosted via Fontsource in the app).
- **Logic:** each demo's `send()` / `finish()` / `next()` / `onTick()` methods are the reference behaviour. Rewrite them as pure TypeScript reducers with Vitest tests; components only render state.
- **Animations:** the `@keyframes` in `Main.dc.html`'s `<style>` (rise, lampOn, fadeUp, flow) map to Motion variants; keep the same timings and the reduced-motion rule.
- **Flow strips:** the chip-and-dashed-line rows (Digital One, Agentic delivery, Memory Palace) become the React Flow diagrams in SPEC §5, keeping the same nodes and labels.
- **Things the canvas cannot do that the app must add:** sessionStorage for the random pick and `?demo=` override (SPEC §4.0), no-flash theme script, scroll-drawn track rail, count-up numbers, real résumé download, SEO.
