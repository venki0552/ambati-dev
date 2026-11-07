# ambati.dev

Personal site for Venkata Reddy Ambati — "Signal Box" design. Spec: `SPEC.md` · approved design: `design/`.

## Commands

| | |
|---|---|
| `npm run dev` | Dev server (client-rendered) |
| `npm run build` | Typecheck → client build → prerender `dist/index.html` |
| `npm test` | Vitest: demo state machines in `src/lab/` |
| `npm run e2e` | Playwright: smoke, axe a11y, demo states, links, 8 screenshots → `screenshots/final/` |
| `node scripts/og.mjs` | Re-render `public/og.png` + `apple-touch-icon.png` |

## Where things live

- **All copy, numbers and links:** `src/content/content.ts` (each block notes its source).
- **Design tokens, fonts, backgrounds, motion:** `src/styles/globals.css`.
- **Demo logic (pure TS + tests):** `src/lab/` · **demo UI:** `src/components/lab/`.
- **Diagrams (React Flow, lazy):** `src/components/diagrams/`.
- **Adding a 4th demo:** a logic module in `src/lab/`, one entry in `src/lab/registry.ts`, a component plus one entry in `src/components/lab/demos.ts`, and the id in the inline script in `index.html`.

## Rendering

The page is prerendered at build time (`src/entry-server.tsx` → `scripts/prerender.mjs`) and hydrated by `src/main.tsx`.
An inline script in `index.html` sets the theme and picks the random hero demo before first paint,
so there is no theme flash and no layout shift. React Flow, the Lab, Motion and Sonner load lazily.

See `DEPLOY.md` for Vercel + DNS.
