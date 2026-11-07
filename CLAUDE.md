# ambati.dev — rules for Claude Code

Personal website for Venkata Reddy Ambati. Start every session by reading `PROMPT.md`, `SPEC.md` and `design/README.md`.

- Source of truth: `SPEC.md` for content and requirements; `design/*.dc.html` for the approved look, copy and demo behaviour.
- **Design questions → check `design/` first and follow what is designed there** (sizes, colours, spacing, layout, copy, component look), even where SPEC differs (Venkat, Nov 7, 2026). SPEC wins only for things the design doesn't show (behaviour, stack, a11y/perf bar). Never break WCAG AA to match the design; flag it instead.
- Never invent copy, numbers, clients, dates or links. Missing → `TODO(venkat)` and ask.
- **Never show client bank names on the website** (they stay on the résumé PDF only). Employers and integration vendors are fine.
- Stack: Vite + React 19 + TypeScript strict, Tailwind v4, shadcn/ui, `motion`, `@xyflow/react`, Vitest, Playwright.
- Work in the phases in `PROMPT.md`. After each phase: run build + tests, attach screenshots (light + dark, 390 + 1440), then stop and wait for "go".
- Demo logic lives in pure TS in `src/lab/` with tests; components only render.
- Respect `prefers-reduced-motion`; keep WCAG AA contrast in both themes.
- Never deploy, push, or change DNS without explicit confirmation.
