# ambati.dev — Website Spec

Owner: Venkata Reddy Ambati · Domain: https://ambati.dev · Status: draft v2 (Nov 7, 2026)

Design canvas (visual reference, interactive): https://claude.ai/artifact/2u7CDw2BUcC9RpdKHBcHWa — the build should match it.

A one-page personal site for a Senior Lead Software Engineer who builds banking platforms and AI-agent tooling. Like saimanoj.com, it proves skill with **working, interactive systems demos** rather than claims. It has **three demos** (circuit breaker, OAuth 2.0 + PKCE → JWT, token bucket), each backing up a resume bullet. **Every visit shows one of them at random in the hero**; all three live in the Lab.

---

## 1. Goals and success criteria

| Goal | Measure |
|---|---|
| A recruiter understands who I am in 10 seconds | Hero shows role, years, stack and 3 numbers above the fold on a 390px phone |
| An engineer sees real depth | 3 working demos that run fully in the browser; one shown at random in the hero on every visit |
| Easy to contact | LinkedIn + email reachable in 1 tap from hero and footer |
| Fast and accessible | Lighthouse mobile ≥ 95 in all 4 categories; WCAG 2.2 AA; zero console errors |
| Honest | Every fact comes from `content.ts`, which mirrors the resume. No invented metrics, logos or architecture |

## 2. Design direction — "Signal Box"

**Concept.** A railway signal box is a control room that decides what may pass, when, and how fast. That is exactly what my work does: rate limiters, circuit breakers, auth tokens and agent pipelines all control flow. Railways even had *token block working*: a train could only enter a single-track section while carrying the physical token. The site borrows the language of signalling panels (enamel plates, status lamps, track diagrams, levers), interpreted with restraint, not as a costume.

**Why not the usual.** No purple gradients, no Inter/Space Grotesk, no glassmorphism cards in a 3-column grid, no centered hero with a blob.

### 2.1 Typography (self-hosted via Fontsource)

| Role | Font | Use |
|---|---|---|
| Display | **Big Shoulders Display** (variable, 700–900) | Name, section titles, big numbers. Condensed signage feel, uppercase for section plates |
| Body | **Atkinson Hyperlegible Next** | Paragraphs, bullets. Distinctive and very readable |
| Mono / data | **Martian Mono** (300–500) | Labels, status text, demo logs, tags, dates |

Scale (fluid, `clamp`): display 56→112px, h2 32→56px, body 16→18px, mono labels 11–13px with +0.08em tracking.

### 2.2 Color tokens (CSS variables, both themes)

| Token | Dark — "Night shift" | Light — "Enamel day" | Use |
|---|---|---|---|
| `--bg` | `#0D0F0C` iron black | `#F2EDE1` enamel cream | Page |
| `--surface` | `#151812` | `#FBF8F1` | Panels |
| `--surface-2` | `#1D2119` | `#E9E2D2` | Insets, demo tracks |
| `--line` | `#2A2F25` | `#D3CAB6` | Borders, grid, track rails |
| `--text` | `#E8E4D8` | `#1A1C17` ink | Body |
| `--muted` | `#9A9786` | `#62604F` | Secondary |
| `--signal` (accent) | `#FFB020` amber | `#B36A00` deep amber (text) / `#FFB020` (fills) | Links, focus rings, active lamps — the one sharp accent |
| `--go` | `#3DDC84` | `#1E8F4E` | Success, CLOSED state |
| `--stop` | `#FF5A4E` | `#C8372D` | Failure, OPEN state, 401/429 |
| `--steel` | `#7FB3C8` | `#2F6F87` | Neutral info, request dots |

The amber accent is the only loud color in the site. Green and red appear only inside demos as status lamps. All text pairs must pass AA (check `--signal` on `--bg` in light: use the deep amber for text).

### 2.3 Backgrounds and texture

- **Dark:** faint 24px dot grid at 6% opacity + 2% film grain (SVG noise) + a soft amber vignette behind the hero demo.
- **Light:** printed graph-paper grid (1px lines every 24px at 5%) like a signalling diagram sheet.
- **Track rail:** a thin vertical "track" line runs down the left gutter on desktop, with a station marker per section. It draws itself as you scroll (SVG `pathLength` driven by scroll). On mobile it collapses into the top progress bar.

### 2.4 Motion (Motion for React + React Flow)

**Rule: every animation means something.** Each one shows a real state change or a real flow of data (a request travelling, a breaker tripping, a token being spent, a section being reached). Nothing loops decoratively, nothing animates just to fill space, and every animation finishes in under 800ms except the demos themselves.


1. **Page load (the one big moment):** the name reveals line by line with a clip-path wipe (staggered 70ms). Then 3 status lamps in the hero "power on" one after another, green-amber-green, and the hero demo slides in.
2. **Track rail:** draws on scroll; the station dot for the current section lights amber.
3. **Signal strip numbers:** count up once when 50% visible (750,000 etc.).
4. **Demos:** requests are dots travelling along tracks; breaker lamps change with a 150ms cross-fade; the JWT inspector flips segments when tampered.
5. **Diagrams:** React Flow animated (dashed, moving) edges for architecture and pipelines.
6. **Micro-interactions:** buttons press down 1px like a lever; links get an amber underline that wipes in.
7. **`prefers-reduced-motion`:** all of the above off; final states shown; demos still work by click.

### 2.5 Layout

- Max content width 1200px; 12-column grid; left 2 columns reserved for the track rail and section plates on ≥1024px.
- Section titles are **enamel plates**: uppercase Big Shoulders inside a bordered rounded plate with a mono "LINE 01" code, e.g. `LINE 02 · THE LAB`.
- Responsive breakpoints: 390 (phone), 768 (tablet), 1024, 1440. Demos stack vertically on phones and stay fully usable by touch.

## 3. Information architecture (single page + anchors)

| # | Section | Anchor | Content |
|---|---|---|---|
| 0 | Top bar | — | "VA" monogram plate · Lab · Work · Projects · Writing · Contact · theme switch (System/Light/Dark, styled as a 3-position lever) · **Résumé** button (PDF) |
| 1 | Hero | `#top` | Name, role line, 2-sentence intro, LinkedIn / Email / Résumé buttons; right side: **one demo picked at random per visit** (see §4.0), with a "Try another" control |
| 2 | Signal strip | — | ~750,000 end users · ~150,000 end users at a single bank · ~70,000 bank employees · 9 banks · 12+ years · team of 5 |
| 3 | The Lab | `#lab` | Config-driven screens playground (decision 6): edit a sample bank's screen config, the account-opening screen rebuilds with 0 deploys. The three systems demos live in the hero only, each with its "where I use this" note |
| 4 | Work | `#work` | Timeline on the track: FIS → Zenmonics → JNET. FIS card includes 2 small animated diagrams (see §5) |
| 5 | Projects | `#projects` | Memory Palace (with its 7-step pipeline diagram), slg, PageSkim, DevTools |
| 6 | Writing | `#writing` | The 2 Medium posts |
| 7 | Stack | `#stack` | Skill groups from the resume as mono chips |
| 7b | About | `#about` | Portrait (`public/venkat.jpg`, supplied by Venkat; `TODO(venkat)` placeholder until then), 3-sentence bio from Appendix A, Charlotte, NC |
| 8 | Contact | `#contact` | "Open a line" — LinkedIn + email (copy button) |
| 9 | Footer | — | © 2026 Venkata Reddy Ambati · LinkedIn · GitHub · "Built with React, shadcn/ui, Motion and React Flow" |

## 4. The Lab — interactive demos (all client-side, no backend)

### 4.0 Random demo rotation

- A registry `src/lab/registry.ts` lists the 3 demos: `{ id, title, tagline, component }`.
- On a visitor's first load, pick one uniformly at random (`crypto.getRandomValues`) and store its id in `sessionStorage`, so it stays the same during that visit (re-renders, theme changes, back navigation) and changes on the next visit.
- `?demo=circuit-breaker|oauth-jwt|token-bucket` overrides the pick (for sharing a specific demo and for tests).
- A small `Try another ↻` control in the hero cycles to the next demo with a 250ms cross-fade.
- The hero demo is lazy-loaded; until it loads, a skeleton with the demo's title and lamps is shown, so layout does not shift (CLS = 0).
- Adding a 4th demo later = one new file + one registry entry.

Each demo's logic is a **pure TypeScript state machine** in `src/lab/*.ts`, unit-tested with Vitest, and rendered by a React component. Each has an `aria-live="polite"` event log in mono.

### 4.1 Circuit Breaker (featured, also in hero)

Story: *"Client → Breaker → Core banking API."* The same pattern I use so Digital One stays stable when a downstream system slows down or fails.

- **Controls:** `Send request` button · `Auto traffic` switch (1 req / 600ms) · `Downstream health` slider 0–100% failure · `Reset`.
- **Rules:** window = last 6 calls; if **3 or more** of them failed → **OPEN**. While OPEN, calls are short-circuited instantly and return `503 · fallback served` (no call reaches downstream). After a **5s cooldown** (visible countdown ring) → **HALF-OPEN**: let exactly 1 trial call through. Success → **CLOSED**; failure → **OPEN** again.
- **Visual:** 3 lamps (CLOSED green / HALF-OPEN amber / OPEN red); request dots travel along a track; failed dots turn red and drop; short-circuited dots bounce off the breaker gate. A tiny sparkline shows failure rate.
- **Log examples:** `200 OK · 84ms` · `500 · downstream error` · `breaker OPEN · 4/6 failed` · `503 · fallback served` · `HALF-OPEN · trial call` · `breaker CLOSED`.

### 4.2 OAuth 2.0 + PKCE → JWT

Story: how a banking app signs a user in without ever exposing a secret in the browser, then calls an API with a JWT.

- **Sequence diagram** (React Flow or SVG) with 3 actors: Browser app · Auth server · Banking API. A `Next step` / `Play all` stepper walks 6 steps, highlighting the active arrow:
  1. Generate `code_verifier` (random) and `code_challenge = BASE64URL(SHA-256(verifier))` — computed for real with WebCrypto and shown.
  2. Redirect to `/authorize?…&code_challenge=…&code_challenge_method=S256`.
  3. User signs in and consents (simulated).
  4. Auth server redirects back with a one-time `code`.
  5. App exchanges `code + code_verifier` → receives `access_token` (JWT, 15 min) + `refresh_token`.
  6. App calls `GET /accounts` with `Authorization: Bearer <JWT>` → `200`.
- **JWT inspector:** shows the token as 3 colored segments (header · payload · signature) and the decoded JSON. The demo signs with HS256 in-browser using a clearly-labelled demo key.
  - `Tamper` button: changes `"role": "customer"` to `"role": "admin"` in the payload → signature check fails → API returns `401 invalid_signature`.
  - `Fast-forward 15 min` → `401 token_expired` → app uses the refresh token → new JWT → `200`.
  - `Steal the code` toggle: attacker replays the code without the verifier → `400 invalid_grant` (shows why PKCE matters).
- Footnote: "Simulated in your browser. Real systems use asymmetric keys (RS256/ES256) and a JWKS endpoint."

### 4.3 Token Bucket

Capacity 5, refill 1 token / 2s. `Send request` consumes 1 token; at 0 → `429 Too Many Requests` with `Retry-After`. Tokens drawn as brass railway tokens dropping into a slot. Add one twist so it is not a copy of the common demo: a `Burst ×10` button that fires 10 requests at once, showing 5 pass, 5 get 429, and the bucket refilling.

## 5. Diagrams (React Flow, lazy-loaded, read-only)

All diagrams are **simplified and illustrative**, labelled as such, and contain nothing confidential to FIS or its clients.

1. **Digital One front end (FIS card):** Shell app → micro-frontend modules (Account Opening · Banker Sales & Service · Studio) → config service (pages/fields as config) → Spring Boot microservices (with rate limiter + circuit breaker badges) → Core banking · DocuSign · Plaid · Yodlee.
2. **Agentic delivery (FIS card):** Jira issue → Factory Droid → spec → code + tests → Playwright evidence (screenshots/recordings) → GitHub PR. Shared rules + the 5-codebase knowledge base feed the agent.
3. **Memory Palace agentic RAG (Projects):** Query router → adaptive retrieval → context rewrite → multi-query → hybrid search (pgvector + full-text) → CRAG grading → streamed answer with citations. Matches Part 2 of the Medium series.

## 6. Content rules

- `src/content/content.ts` is the **single source of truth** (typed). Copy text from Appendix A. Do not invent metrics, clients, titles, dates or features.
- Client banks are listed as **plain text only — no logos** (trademarks).
- Contact email on the site: **venkatambati@duck.com**. LinkedIn: https://www.linkedin.com/in/venkatareddyambati/. GitHub: https://github.com/venki0552.
- Résumé: serve `public/Venkata_Reddy_Ambati_Resume.pdf` (in this folder).
- No contact form (no backend). Email button = `mailto:` + "Copy email" with a toast.
- About strip with a portrait slot; Venkat supplies `public/venkat.jpg`.

## 7. Tech stack

| Area | Choice |
|---|---|
| Build | Vite + React 19 + TypeScript (strict) |
| UI | Tailwind CSS v4 + shadcn/ui (Button, Tabs, Card, Badge, Slider, Switch, Tooltip, DropdownMenu, Sheet, Separator, Sonner) restyled with the tokens above |
| Motion | `motion` (`motion/react`) |
| Diagrams | `@xyflow/react` (React Flow), lazy-loaded with `React.lazy` + `IntersectionObserver` |
| Theme | shadcn's Vite theme provider (light / dark / system, saved to localStorage) + an inline script in `index.html` to prevent a flash of the wrong theme |
| Icons | `lucide-react`; LinkedIn/GitHub/Medium as small inline SVGs |
| Fonts | `@fontsource-variable/big-shoulders-display`, `@fontsource/atkinson-hyperlegible-next`, `@fontsource/martian-mono` (fallback: Google Fonts if a package is missing) |
| Testing | Vitest (state machines, JWT/PKCE helpers) · Playwright (smoke + screenshots) · `@axe-core/playwright` (a11y) |
| Hosting | Vercel, custom domain **ambati.dev** (+ `www` → apex redirect). `.dev` is HSTS-preloaded, so HTTPS is mandatory; Vercel provisions the certificate |

### Folder layout

```
ambati-dev/
  index.html
  public/  Venkata_Reddy_Ambati_Resume.pdf  og.png  favicon.svg  robots.txt  sitemap.xml
  src/
    main.tsx  App.tsx
    styles/globals.css            # tokens, fonts, grid/grain backgrounds
    content/content.ts            # Appendix A, typed
    components/ui/                # shadcn
    components/site/              # TopBar, Hero, SignalStrip, TrackRail, SectionPlate, Work, Projects, Writing, Stack, Contact, Footer, ThemeLever
    components/lab/               # CircuitBreakerDemo, OAuthJwtDemo, TokenBucketDemo, EventLog, Lamp
    components/diagrams/          # DigitalOneDiagram, AgenticDeliveryDiagram, RagPipelineDiagram
    lab/                          # registry.ts, circuitBreaker.ts, oauthPkce.ts, jwt.ts, tokenBucket.ts (+ *.test.ts)
  tests/e2e/                      # smoke.spec.ts, a11y.spec.ts, screenshots.spec.ts
```

## 8. SEO, sharing, analytics

- `<title>Venkata Reddy Ambati — Senior Lead Software Engineer</title>`, meta description from the summary, canonical `https://ambati.dev/`.
- Open Graph + Twitter card with a static `og.png` (1200×630, enamel plate with the name and title, both themes' palette).
- JSON-LD `Person` (name, jobTitle, worksFor FIS, url, sameAs LinkedIn/GitHub/Medium).
- `sitemap.xml`, `robots.txt`, `favicon.svg` (amber "VA" signal plate).
- Optional: Vercel Analytics (cookieless).

## 9. Quality bar (definition of done)

- Lighthouse mobile ≥ 95 for Performance, Accessibility, Best Practices, SEO.
- Initial JS ≤ 200 KB gzip; React Flow and the Lab load after first paint.
- Works at 390, 768, 1024 and 1440 widths in both themes; screenshots attached for all 8 combinations.
- Keyboard: every control reachable, visible amber focus ring, demos operable without a mouse; skip link to `#work`.
- `prefers-reduced-motion` respected.
- Vitest passes (breaker transitions, PKCE challenge, JWT sign/verify/tamper/expiry, token refill).
- Playwright smoke passes: page loads with no console errors, theme switch persists across reload, each demo reaches its key states, all external links return 200.

## 10. Decisions (Nov 7, 2026)

1. Ship all 3 demos; the hero shows one at random per visit (§4.0).
2. Use meaningful animations: Motion for the page, React Flow for diagrams (§2.4 rule).
3. Include an About strip with a portrait slot.
4. Site email stays venkatambati@duck.com (resume keeps Gmail).
5. No client bank names anywhere on the website or in this repo; they stay on the résumé PDF only. Employers (FIS, Zenmonics, JNET) and integration vendors (DocuSign, Plaid, Yodlee) are fine.
6. The Lab no longer repeats the hero demos: it hosts the config-driven screens playground (`src/lab/configScreens.ts`), which backs the micro-frontend / config-driven UI bullet.

---

## Appendix A — Content (source of truth, from the resume)

**Name:** Venkata Reddy Ambati
**Role line:** Senior Lead Software Engineer · Full-Stack (Java, Spring Boot, Angular, React) · Banking Platforms
**Location:** Charlotte, NC
**Links:** LinkedIn https://www.linkedin.com/in/venkatareddyambati/ · GitHub https://github.com/venki0552 · Email venkatambati@duck.com

**Intro (site version of the summary):**
I've spent the last 10 years building the software banks use to open accounts, serve customers and run their branches, and 12+ years writing software overall. I work across the full stack, with Java and Spring Boot underneath and Angular and React on top. The part I enjoy most is designing how the pieces fit together: micro-frontends, config-driven UI, resilient microservices and secure identity flows. Today I lead a team of 5 engineers on FIS Digital One. Lately I've been changing how my team ships, using AI agents, spec-driven development and careful context engineering.

**Numbers:** ~750,000 end users onboarded across banks on Digital One products · ~150,000 end users at a single bank · ~70,000 bank employees across 9 banks use Banker Sales & Service · 9 large financial institutions · 12+ years · team of 5.

**Experience**

*FIS Global — Senior Lead Software Engineer · Apr 2021 – Present*
Builds FIS Digital One products: Banker Sales & Service, Banker and Online Account Open, Digital One Studio and the Digital One consumer modernization.
- Lead a team of 5 engineers, review code daily, drive architecture decisions and coding standards.
- Designed the micro-frontend architecture; screens are config-driven, so banks change pages and fields without code changes.
- Designed the system architecture for online account opening.
- Built Java and Spring Boot microservices behind core banking, DocuSign, Plaid and Yodlee integrations, with rate limiting and circuit breakers.
- Built secure sign-in with OAuth, JWT-based authentication and CIAM, alongside SSO, IAM and MFA.
- Building the Digital One consumer modernization with AI agents and spec-driven development on Factory (Droid).
- Set up an agentic workflow: agents pick up Jira issues and carry them to completion via Jira and GitHub MCP servers, with shared rules in git and Playwright screenshot/recording evidence required for every test.
- Built an LLM-ready knowledge base for 5 work codebases (structure, data flow, code examples, cross-project router).

*Zenmonics Software (acquired by FIS) — Senior Software Engineer · Mar 2016 – Mar 2021*
- Built account opening applications for banks, with credit check and DocuSign e-signature integrations.
- Designed a Flow Manager (UML, Papyrus) that drives account opening flows, plus configurable modules for pages and fields.
- Developed banking web apps in AngularJS, Angular 8 and Angular Material consuming REST services.
- Gathered requirements with clients, mentored junior developers, ran code reviews.

*JNET Technologies — Software Engineer · May 2014 – Jan 2016*
- Built enterprise applications with Java Spring and RESTful APIs for external integrations.

**Projects**

- **Memory Palace — RAG-powered second brain.** Live https://vedha-pocket-web.vercel.app/ · Part 1 https://medium.com/@venkatareddya91/i-built-a-rag-powered-second-brain-and-accidentally-created-my-personal-research-assistant-51448fcd5d94 · Part 2 https://medium.com/@venkatareddya91/memory-palace-part-2-i-built-a-chrome-extension-and-made-my-second-brain-portable-f466ecadcd03. Open-source, self-hostable knowledge base with cited answers over web pages, PDFs, Word files and notes. Next.js 14, Fastify + TypeScript, BullMQ + Playwright worker on Redis, Supabase PostgreSQL + pgvector, 4 repos. 7-step agentic RAG (intent routing, adaptive retrieval, context rewrite, multi-query, hybrid search, CRAG grading, streamed cited answers), 10s timeout + fallback per LLM step, Chrome extension (popup, content script, service worker) for one-click save and in-page chat, row-level security, encrypted BYO keys, local LLM support. Built AI-assisted with GitHub Copilot.
- **slg — Semantic Lore for Git.** https://github.com/venki0552/slg-cli · https://slg-cli.vercel.app/ · https://agentpowers.ai/skills/slg-cli. Personal side project built AI-assisted with Claude Code: local, offline CLI turning a repo's git history and data flow into a searchable knowledge base for AI coding agents. 5 read-only MCP tools (Claude Code, Cursor, Windsurf, GitHub Copilot), VS Code extension, hybrid vector + BM25 search with Reciprocal Rank Fusion, secrets redacted, single Rust binary, 1.1k downloads on AgentPowers.
- **PageSkim.** https://github.com/venki0552/PageSkim · https://page-skim.vercel.app/. Converts web pages into compact `.llm.md` files so LLMs and agents spend fewer tokens on boilerplate; paste-in-browser or URL mode, nothing stored; token gauge and two-hop navigation simulator.
- **DevTools.** https://github.com/venki0552/devtools · https://devtls.vercel.app/. 21 browser-only developer utilities (JSON/XML/SQL/GraphQL formatters, JWT decoder, hash generator, regex tester, cron builder, SQL join visualizer); no signup or tracking.

**Writing:** the two Memory Palace posts on Medium (Dec 30, 2025 and Jan 2, 2026).

**Stack groups:** Backend (Java, Spring, Spring Boot, Node.js, Fastify, REST, microservices, BullMQ) · Frontend (Angular, React, Next.js, React Native, TypeScript, Tailwind, Chrome extensions) · System design (microservices, rate limiting, circuit breakers, micro-frontends, front-end modularization, config-driven UI) · Identity & security (OAuth, JWT, CIAM, SSO, IAM, MFA, row-level security) · AI engineering (prompt engineering, context engineering, RAG, agentic RAG, spec-driven development, agentic workflows, MCP) · AI tools (Claude Code, Factory, GitHub Copilot, Cursor, OpenRouter, local LLMs) · DevOps & cloud (Git, Jenkins, CI/CD, Docker, Azure, AWS, Vercel, Railway) · Data (SQL, PostgreSQL, pgvector, Supabase, Redis).

**Education:** B.Tech — Jawaharlal Nehru Technological University (JNTU) Kakinada, 2012.
