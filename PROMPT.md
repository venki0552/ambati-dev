# Build prompt — ambati.dev

Paste everything below the line into Claude Code, opened in this `ambati-dev` folder.

---

You are a senior front-end engineer and designer. Build my personal website, **ambati.dev**, exactly as specified in `SPEC.md` in this folder, and make it look and behave like the approved design in `design/`.

Before writing any code, read in this order:
1. `SPEC.md`: the source of truth for content, demos, stack and the quality bar.
2. `design/README.md`: what each design file is and how to port it.
3. `design/Main.dc.html`, then the three demo files: the approved visual design, final copy and demo behaviour. Match them closely; where the design and the spec disagree, follow the spec and tell me.

## Hard rules

1. **No fabrication.** Every word of copy, every number, date, client name, link and project detail comes from `SPEC.md` Appendix A. If something is missing, leave a `TODO(venkat)` and tell me; do not invent it. No client logos.
2. **Stack:** Vite + React 19 + TypeScript (strict), Tailwind CSS v4, shadcn/ui, `motion` (`motion/react`), `@xyflow/react`. Use the shadcn MCP server if it is available to fetch components.
3. **Design:** match `design/` and follow SPEC §2 "Signal Box" exactly: the three fonts, the color tokens as CSS variables for both themes, the backgrounds, the enamel section plates, the track rail. Restyle shadcn components with these tokens; nothing should look like stock shadcn.
4. **Both themes are first-class.** Light, dark and system, persisted, with no flash on load. Check contrast in both.
5. **Responsive** at 390, 768, 1024 and 1440 px. Demos must be fully usable by touch on a phone.
6. **Demos run entirely in the browser.** The logic lives in pure TypeScript modules in `src/lab/` with Vitest tests. Components only render state.
7. **Accessibility and motion:** keyboard-operable everything, visible amber focus rings, `aria-live` event logs, and `prefers-reduced-motion` turns animation off.
8. **Performance:** lazy-load React Flow diagrams and the Lab below the fold; initial JS ≤ 200 KB gzip.

## Work in phases. After each phase, run the checks, show me screenshots, and wait for my "go".

**Phase 1 — Foundation.** Scaffold the project, install dependencies, set up fonts, the color tokens in `globals.css`, the backgrounds (dot grid + grain in dark, graph paper in light), the theme provider plus the three-position theme lever, and `content.ts` typed from Appendix A.
Check: `npm run build` passes; screenshots of an empty page in both themes.

**Phase 2 — Page and content.** Build the top bar, hero (with a placeholder box where the demo goes), signal strip, Work timeline, Projects, Writing, Stack, Contact, footer, section plates and the scroll-drawn track rail. Add the résumé download from `public/Venkata_Reddy_Ambati_Resume.pdf`.
Check: screenshots at 390 and 1440 in both themes (4 images); every link opens the right URL.

**Phase 3 — The Lab.**
- Implement `circuitBreaker.ts`, `oauthPkce.ts`, `jwt.ts`, `tokenBucket.ts` and `registry.ts` as pure state machines with Vitest tests covering every transition in SPEC §4.
- Build the random hero rotation from SPEC §4.0 (sessionStorage pick, `?demo=` override, Try another).
- Then build `CircuitBreakerDemo`, `TokenBucketDemo` and `OAuthJwtDemo` with the stepper, a real SHA-256 PKCE challenge via WebCrypto, HS256 signing with a labelled demo key, and the tamper, fast-forward and steal-the-code actions.
Check: `npm test` is green; screenshots of each demo reaching every state (CLOSED → OPEN → HALF-OPEN → CLOSED; 200 → 401 tampered → 401 expired → refresh → 200; 400 invalid_grant; 5 pass + 5 × 429 on burst), and proof that `?demo=` and the random pick both work.

**Phase 4 — Diagrams.** Build the three React Flow diagrams from SPEC §5 with animated edges, read-only, lazy-loaded, labelled "simplified, illustrative".
Check: screenshots of each diagram in both themes.

**Phase 5 — Motion polish.** Add the orchestrated page load (name clip-path reveal with stagger, then lamps powering on, then the hero demo), count-up numbers, lever-press buttons and link underline wipes. Keep it to these high-impact moments; no scattered effects.
Check: verify the reduced-motion mode shows final states.

**Phase 6 — Ship quality.** Add SEO (meta, OG image, JSON-LD Person, sitemap, robots, favicon), Playwright smoke + axe tests, and a Lighthouse run.
Check: Lighthouse mobile ≥ 95 in all four categories; zero console errors; screenshots of all 8 width × theme combinations.

**Phase 7 — Deploy.** Prepare for Vercel with the custom domain `ambati.dev` and a `www` → apex redirect. Give me the exact DNS records to set at my registrar. Do not deploy without my confirmation.

## Design brief (keep this in mind throughout)

```
<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>
```

The concrete direction for this site is already chosen in SPEC §2 ("Signal Box"). Apply the brief within that direction; do not switch to a different aesthetic.
