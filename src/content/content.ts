/**
 * ambati.dev — single source of truth for every word, number and link on the site.
 *
 * Sources (SPEC §6):
 *  - [A]  SPEC.md Appendix A (mirrors the résumé)
 *  - [D]  design/Main.dc.html — the approved final copy, condensed/reworded from [A]
 *  - [S]  SPEC.md body (§3, §6)
 *
 * Rules: never invent metrics, clients, titles, dates, features or links.
 * Never name client banks on the site (Venkat, Nov 7, 2026): the résumé lists them, the website does not.
 * Employers (FIS, Zenmonics, JNET) and integration vendors (DocuSign, Plaid, Yodlee) are fine.
 * Guarded by the "no client names" test in tests/e2e/smoke.spec.ts.
 * Anything missing is marked TODO(venkat).
 */

// ------------------------------------------------------------------ types

export type ExternalLink = { label: string; href: string }

export type Stat = {
  /** Number the count-up animates to (SPEC §2.4.3). */
  value: number
  prefix?: string
  suffix?: string
  /** Exact figure for screen readers / title text. */
  full: string
  label: string
  highlight?: boolean
}

export type Job = {
  company: string
  role: string
  note?: string
  start: string
  end: string
  current?: boolean
  summary?: string
  bullets: string[]
}

export type FlowStrip = {
  caption: string
  nodes: string[]
}

export type Project = {
  id: string
  name: string
  subtitle?: string
  tags: string
  description: string
  metric?: { value: string; label: string }
  pipeline?: string[]
  links: ExternalLink[]
  featured?: boolean
}

export type Post = {
  title: string
  date: string
  readTime: string
  href: string
}

export type StackGroup = { name: string; items: string[] }

export type DemoId = "circuit-breaker" | "oauth-jwt" | "token-bucket"

export type LabNote = { label: string; use: string; tryIt: string }

export type Section = { id: string; line: string; title: string }

// --------------------------------------------------------------- identity

const LINKEDIN = "https://www.linkedin.com/in/venkatareddyambati/"
const GITHUB = "https://github.com/venki0552"
const EMAIL = "venkatambati@duck.com"
/** Author profile, derived from the two post URLs in [A]. */
const MEDIUM = "https://medium.com/@venkatareddya91"
const MEDIUM_PART_1 =
  "https://medium.com/@venkatareddya91/i-built-a-rag-powered-second-brain-and-accidentally-created-my-personal-research-assistant-51448fcd5d94"
const MEDIUM_PART_2 =
  "https://medium.com/@venkatareddya91/memory-palace-part-2-i-built-a-chrome-extension-and-made-my-second-brain-portable-f466ecadcd03"

export const site = {
  name: "Venkata Reddy Ambati", // [A]
  monogram: "VA",
  domain: "ambati.dev",
  url: "https://ambati.dev/",
  roleLine: "Senior Lead Software Engineer · Full-Stack (Java, Spring Boot, Angular, React) · Banking Platforms", // [A]
  jobTitle: "Senior Lead Software Engineer", // [A]
  employer: "FIS Global", // [A]
  location: "Charlotte, NC", // [A]
  email: EMAIL, // [S] §6 — the site uses duck.com; the résumé keeps Gmail
  resume: {
    href: "/Venkata_Reddy_Ambati_Resume.pdf", // [S] §6
    fileName: "Venkata_Reddy_Ambati_Resume.pdf",
  },
  links: {
    linkedin: LINKEDIN,
    github: GITHUB,
    medium: MEDIUM,
    email: `mailto:${EMAIL}`,
  },
} as const

// -------------------------------------------------------------- navigation

export const nav: ExternalLink[] = [
  { label: "Lab", href: "#lab" },
  { label: "Work", href: "#work" },
  { label: "Projects", href: "#projects" },
  { label: "Writing", href: "#writing" },
  { label: "Contact", href: "#contact" },
] // [S] §3 + [D]

/** Enamel section plates, "LINE 02 · THE LAB" (SPEC §2.5, numbering from [D]). */
export const sections = {
  top: { id: "top", line: "LINE 01", title: "Venkata Reddy Ambati" },
  lab: { id: "lab", line: "LINE 02", title: "The Lab" },
  work: { id: "work", line: "LINE 03", title: "Work" },
  projects: { id: "projects", line: "LINE 04", title: "Projects" },
  writing: { id: "writing", line: "LINE 05", title: "Writing" },
  stack: { id: "stack", line: "LINE 06", title: "Stack" },
  about: { id: "about", line: "LINE 07", title: "About" },
  contact: { id: "contact", line: "LINE 08", title: "Open a line" },
} satisfies Record<string, Section>

// ------------------------------------------------------------------- hero

export const hero = {
  eyebrow: "SENIOR LEAD SOFTWARE ENGINEER · FIS · CHARLOTTE, NC", // [D]
  nameLines: ["Venkata", "Reddy", "Ambati"], // [A]
  /** Three status lamps that "power on" green-amber-green (SPEC §2.4.1). */
  lamps: [
    { label: "JAVA · SPRING BOOT", tone: "go" },
    { label: "ANGULAR · REACT", tone: "signal" },
    { label: "AI AGENTS · MCP", tone: "go" },
  ] as const, // [D]
  /** 2-sentence site intro (SPEC §3), condensed from the Appendix A intro. */
  intro:
    "I've spent 10 years building the software banks use to open accounts, serve customers and run their branches. Today I lead a team of 5 on FIS Digital One, and I'm changing how we ship with AI agents and spec-driven development.", // [D]
  /** Full Appendix A intro — used for the meta description / JSON-LD. */
  introLong:
    "I've spent the last 10 years building the software banks use to open accounts, serve customers and run their branches, and 12+ years writing software overall. I work across the full stack, with Java and Spring Boot underneath and Angular and React on top. The part I enjoy most is designing how the pieces fit together: micro-frontends, config-driven UI, resilient microservices and secure identity flows. Today I lead a team of 5 engineers on FIS Digital One. Lately I've been changing how my team ships, using AI agents, spec-driven development and careful context engineering.", // [A]
  ctas: {
    linkedin: "Connect on LinkedIn",
    email: "Email me",
    resume: "Résumé",
    tryAnother: "TRY ANOTHER",
  }, // [D]
} as const

// ----------------------------------------------------------- signal strip

export const stats: Stat[] = [
  { value: 750, prefix: "~", suffix: "K", full: "about 750,000", label: "END USERS ON DIGITAL ONE" },
  { value: 150, prefix: "~", suffix: "K", full: "about 150,000", label: "END USERS AT A SINGLE BANK" },
  { value: 70, prefix: "~", suffix: "K", full: "about 70,000", label: "BANK EMPLOYEES USE IT" },
  { value: 9, full: "9", label: "LARGE BANKS" },
  { value: 12, suffix: "+", full: "12+", label: "YEARS SHIPPING SOFTWARE", highlight: true },
  { value: 5, full: "5", label: "ENGINEERS I LEAD" },
] // numbers [A], labels [D]

// --------------------------------------------------------------------- lab

export const lab = {
  intro: "Three patterns I use at work, running in your browser. Break them on purpose.", // [D] (hero card)
  disclaimer: "Simulated in your browser. Nothing is sent anywhere.", // [D]
  heroLabel: (n: number, total: number) => `LIVE DEMO ${n} OF ${total} · PICKED AT RANDOM`, // [D]
  oauthFootnote:
    "Simulated in your browser. Real systems use asymmetric keys (RS256/ES256) and a JWKS endpoint.", // [S] §4.2
  notes: {
    "circuit-breaker": {
      label: "CIRCUIT BREAKER",
      use: "Rate limiting and circuit breakers keep the Digital One integrations with core banking, DocuSign, Plaid and Yodlee stable when a downstream system slows down or fails.",
      tryIt:
        "Push the failure rate up and send requests. After 3 of the last 6 fail, the breaker opens and serves a fallback. Wait out the 5-second cooldown and watch the single trial call decide what happens next.",
    },
    "oauth-jwt": {
      label: "OAUTH + PKCE → JWT",
      use: "Secure sign-in for banking apps: OAuth, JWT-based authentication and CIAM, alongside SSO, IAM and MFA.",
      tryIt:
        "Step through the sign-in, then tamper with the token, fast-forward past its expiry, or replay a stolen code without the verifier. Each one fails for a different, real reason.",
    },
    "token-bucket": {
      label: "TOKEN BUCKET",
      use: "Rate limiting in front of Spring Boot microservices, so one noisy client cannot starve everyone else.",
      tryIt:
        "Fire a Burst ×10. Five requests pass, five get 429 Too Many Requests, and the bucket refills one token every 2 seconds.",
    },
  } satisfies Record<DemoId, LabNote>, // [D]
} as const

// --------------------------------------------------------- config lab (LINE 02)

/**
 * Replaces the Lab tabs (Venkat, Nov 7, 2026): the hero already runs the three demos, so LINE 02
 * shows the front-end architecture instead. Facts from [A] (FIS bullet on micro-frontends /
 * config-driven screens); sentence wording is new — TODO(venkat): confirm.
 */
export const configLab = {
  intro:
    "The demo above is the back end. This one is the front end: screens built from config, so banks change pages and fields without code changes.",
  kicker: "DEMO · FRONT-END ARCHITECTURE",
  title: "Config-driven screens",
  use: "Designed the micro-frontend architecture: the UI is split into self-contained modules, and screens are config-driven, so banks change pages and fields without code changes.", // [D] FIS bullet
  tryIt:
    "Switch banks, hide a field, make one required or move it up. The same code renders a different screen, and nothing is redeployed.",
  disclaimer: "Simplified and illustrative: sample banks and fields, not FIS code. Runs in your browser.",
} as const

// -------------------------------------------------------------------- work

export const experience: Job[] = [
  {
    company: "FIS Global",
    role: "Senior Lead Software Engineer",
    start: "APR 2021",
    end: "PRESENT",
    current: true,
    summary:
      "I build FIS Digital One products: Banker Sales & Service, Banker and Online Account Open, Digital One Studio and the Digital One consumer modernization.",
    bullets: [
      "Lead a team of 5 engineers, review their code every day, and drive architecture decisions and coding standards.",
      "Designed the micro-frontend architecture: the UI is split into self-contained modules, and screens are config-driven, so banks change pages and fields without code changes.",
      "Designed the system architecture for online account opening.",
      "Built the Java and Spring Boot microservices behind the core banking, DocuSign, Plaid and Yodlee integrations, with rate limiting and circuit breakers.",
      "Built secure sign-in with OAuth, JWT-based authentication and CIAM, alongside SSO, IAM and MFA.",
      "Building the Digital One consumer modernization with AI agents and spec-driven development on Factory (Droid), with a knowledge base of 5 work codebases so agents start with the right context.",
    ],
  },
  {
    company: "Zenmonics",
    role: "Senior Software Engineer",
    note: "acquired by FIS",
    start: "MAR 2016",
    end: "MAR 2021",
    bullets: [
      "Built account opening applications for banks, with credit check and DocuSign e-signature integrations.",
      "Designed a Flow Manager, modeled in UML with Papyrus, that drives account opening flows, plus configurable modules for pages and fields.",
      "Developed banking web apps in AngularJS, Angular 8 and Angular Material that consume REST services.",
      "Gathered requirements with clients, mentored junior developers and ran code reviews.",
    ],
  },
  {
    company: "JNET Technologies",
    role: "Software Engineer",
    start: "MAY 2014",
    end: "JAN 2016",
    bullets: ["Built enterprise applications with Java Spring and RESTful APIs for integrations with external systems."],
  },
] // facts [A], wording [D]

/** Node labels for the FIS-card diagrams (SPEC §5.1, §5.2). Rendered by React Flow in Phase 4. */
export const workDiagrams = {
  digitalOne: {
    caption: "DIGITAL ONE, FRONT TO BACK · SIMPLIFIED, ILLUSTRATIVE",
    nodes: [
      "Shell app",
      "Micro-frontends: Account Opening · Banker Sales & Service · Studio",
      "Config: pages + fields",
      "Spring Boot microservices",
      "Core banking · DocuSign · Plaid · Yodlee",
    ],
    badges: ["RATE LIMITER", "CIRCUIT BREAKER"],
  },
  agenticDelivery: {
    caption: "AGENTIC DELIVERY · SIMPLIFIED, ILLUSTRATIVE",
    nodes: [
      "Jira issue",
      "Factory Droid + shared rules + codebase KB",
      "Spec",
      "Code + tests",
      "Playwright evidence",
      "GitHub PR",
    ],
  },
} as const // [S] §5 + [D]

// ---------------------------------------------------------------- projects

export const projects: Project[] = [
  {
    id: "memory-palace",
    name: "Memory Palace",
    featured: true,
    tags: "AGENTIC RAG · NEXT.JS · FASTIFY · PGVECTOR · CHROME EXTENSION",
    description:
      "An open-source, self-hostable second brain. It answers questions over saved web pages, PDFs, Word files and personal notes, with citations, and a Chrome extension saves any page in one click.",
    pipeline: [
      "Route intent",
      "Adaptive retrieval",
      "Rewrite with context",
      "Multi-query",
      "Hybrid search",
      "CRAG grading",
      "Stream cited answer",
    ],
    // TODO(venkat): live app not published yet — add back { label: "Live demo ↗", href: "<url>" } when it is.
    links: [
      { label: "Part 1 on Medium ↗", href: MEDIUM_PART_1 },
      { label: "Part 2 on Medium ↗", href: MEDIUM_PART_2 },
    ],
  },
  {
    // Facts from the repo README (github.com/venki0552/Detect-Agents, Nov 12, 2026), incl. its own "alpha" status.
    id: "agent-detect",
    name: "agent-detect",
    subtitle: "Human or AI agent?",
    tags: "TYPESCRIPT · FRAUD & SECURITY · ALPHA",
    description:
      "Tells whether a human or an AI agent is driving a sensitive web session, and decides what to do before money moves: allow, notify, step up or block. The browser only collects; the server decides, with explainable rules and no ML model.",
    metric: { value: "34", label: "EXPLAINABLE RULES" },
    links: [{ label: "GitHub ↗", href: "https://github.com/venki0552/Detect-Agents" }],
  },
  {
    id: "slg",
    name: "slg",
    subtitle: "Semantic Lore for Git",
    tags: "RUST · MCP · BUILT WITH CLAUDE CODE",
    description:
      "A local, offline CLI that turns a repo's git history and data flow into a searchable knowledge base for AI coding agents, through 5 read-only MCP tools.",
    metric: { value: "1.1K", label: "DOWNLOADS ON AGENTPOWERS" },
    links: [
      { label: "GitHub ↗", href: "https://github.com/venki0552/slg-cli" },
      { label: "Docs ↗", href: "https://slg-cli.vercel.app/" },
      { label: "AgentPowers ↗", href: "https://agentpowers.ai/skills/slg-cli" },
    ],
  },
  {
    id: "pageskim",
    name: "PageSkim",
    subtitle: "HTML → .llm.md",
    tags: "LLM CONTEXT · WEB",
    description:
      "Converts web pages into compact .llm.md files, so LLMs and agents spend fewer tokens on page boilerplate. Paste HTML or a URL; nothing is stored.",
    links: [
      { label: "GitHub ↗", href: "https://github.com/venki0552/PageSkim" },
      { label: "Live ↗", href: "https://page-skim.vercel.app/" },
    ],
  },
  {
    id: "devtools",
    name: "DevTools",
    subtitle: "21 developer utilities",
    tags: "BROWSER-ONLY · PRIVACY",
    description:
      "Formatters, a JWT decoder, hash generator, regex tester, cron builder and SQL join visualizer. Everything runs in your browser, with no signup or tracking.",
    links: [
      { label: "GitHub ↗", href: "https://github.com/venki0552/devtools" },
      { label: "Live ↗", href: "https://devtls.vercel.app/" },
    ],
  },
] // facts + links [A], wording [D]

// ----------------------------------------------------------------- writing

export const writing: Post[] = [
  {
    title: "I Built a RAG-Powered “Second Brain” and Accidentally Created My Personal Research Assistant",
    date: "DEC 30, 2025", // [A]
    readTime: "12 MIN", // [D]
    href: MEDIUM_PART_1, // [A]
  },
  {
    title: "Memory Palace Part 2: Agentic RAG, Chrome Extension, and Making AI Actually Understand You",
    date: "JAN 2, 2026", // [A]
    readTime: "9 MIN", // [D]
    href: MEDIUM_PART_2, // [A]
  },
] // titles + read times [D]

// ------------------------------------------------------------------- stack

export const stack: StackGroup[] = [
  { name: "BACKEND", items: ["Java", "Spring", "Spring Boot", "Node.js", "Fastify", "REST", "Microservices", "BullMQ"] },
  { name: "FRONTEND", items: ["Angular", "React", "Next.js", "React Native", "TypeScript", "Tailwind", "Chrome extensions"] },
  {
    name: "SYSTEM DESIGN",
    items: ["Rate limiting", "Circuit breakers", "Micro-frontends", "Front-end modularization", "Config-driven UI"],
  },
  { name: "IDENTITY & SECURITY", items: ["OAuth", "JWT", "CIAM", "SSO", "IAM", "MFA", "Row-level security"] },
  {
    name: "AI ENGINEERING",
    items: ["Prompt + context engineering", "RAG", "Agentic RAG", "Spec-driven development", "MCP"],
  },
  { name: "AI TOOLS", items: ["Claude Code", "Factory", "GitHub Copilot", "Cursor", "OpenRouter", "Local LLMs"] },
  { name: "DEVOPS & CLOUD", items: ["Git", "Jenkins", "CI/CD", "Docker", "Azure", "AWS", "Vercel", "Railway"] },
  { name: "DATA", items: ["SQL", "PostgreSQL", "pgvector", "Supabase", "Redis"] },
] // [A], grouping/wording [D]

// ------------------------------------------------------------------- about

export const about = {
  portrait: {
    /** public/venkat.jpg: supplied by Venkat (Nov 7, 2026), cropped to 520×640 (2× the 260×320 slot). */
    src: "/venkat.jpg" as string | null,
    alt: "Portrait of Venkata Reddy Ambati",
    placeholder: "[YOUR PHOTO]",
  },
  paragraphs: [
    "I'm a full-stack engineer in Charlotte, North Carolina. I started in 2014 building Java Spring applications, joined Zenmonics in 2016 to build account opening for banks, and moved to FIS when it acquired Zenmonics in 2021.",
    "Outside work I build open-source tools for AI agents and write about how I built them on Medium. B.Tech, JNTU Kakinada, 2012.",
  ], // [D], facts from [A]
  education: "B.Tech — Jawaharlal Nehru Technological University (JNTU) Kakinada, 2012", // [A]
} as const

// ----------------------------------------------------------------- contact

export const contact = {
  lead: "The fastest way to reach me is LinkedIn or email. I read both.", // [D]
  copy: { idle: "COPY EMAIL", done: "COPIED ✓", toast: "Email copied" },
} as const

// ------------------------------------------------------------------ footer

export const footer = {
  copyright: "© 2026 VENKATA REDDY AMBATI", // [S] §3
  builtWith: "BUILT WITH REACT, SHADCN/UI, MOTION AND REACT FLOW", // [S] §3
  links: [
    { label: "LINKEDIN", href: LINKEDIN },
    { label: "GITHUB", href: GITHUB },
    { label: "MEDIUM", href: MEDIUM },
  ] satisfies ExternalLink[],
} as const

// --------------------------------------------------------------------- seo

export const seo = {
  title: "Venkata Reddy Ambati — Senior Lead Software Engineer", // [S] §8
  /** [S] §8 "meta description from the summary": the 2-sentence site summary (fits the ~160–230 char snippet). */
  description: hero.intro,
  sameAs: [LINKEDIN, GITHUB, MEDIUM],
} as const
