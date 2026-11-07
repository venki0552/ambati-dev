/**
 * Config-driven screens playground (replaces the Lab tabs, Nov 7, 2026).
 *
 * Backs the résumé line: "screens are config-driven, so banks change pages and fields without
 * code changes". A screen is pure data (ScreenConfig); the UI renders whatever the config says.
 * Every edit here is a config change: the screen rebuilds and nothing is redeployed.
 *
 * Simplified and illustrative: sample banks and generic account-opening fields, no client names,
 * nothing from FIS code. Pure state machine; the component only renders it.
 */
import { pushLog, type LogEntry } from "@/lab/registry"

export type FieldType = "text" | "email" | "tel" | "date" | "select" | "radio"

export type FieldConfig = {
  readonly id: string
  readonly label: string
  readonly type: FieldType
  readonly required: boolean
  readonly visible: boolean
  readonly options?: readonly string[]
}

export type PageConfig = {
  readonly id: string
  readonly title: string
  readonly fields: readonly FieldConfig[]
}

export type ScreenConfig = {
  readonly bank: string
  readonly product: string
  readonly pages: readonly PageConfig[]
}

export type BankId = "a" | "b"
export const BANK_IDS: readonly BankId[] = ["a", "b"]

const f = (id: string, label: string, type: FieldType, required = true, options?: readonly string[]): FieldConfig => ({
  id,
  label,
  type,
  required,
  visible: true,
  ...(options ? { options } : {}),
})

/** Two sample banks, same code, different config. */
export const SAMPLE_CONFIGS: Readonly<Record<BankId, ScreenConfig>> = {
  a: {
    bank: "Sample bank A",
    product: "Online account opening",
    pages: [
      {
        id: "about",
        title: "About you",
        fields: [
          f("firstName", "First name", "text"),
          f("lastName", "Last name", "text"),
          f("dob", "Date of birth", "date"),
          f("email", "Email", "email"),
          f("phone", "Mobile phone", "tel", false),
        ],
      },
      {
        id: "account",
        title: "Choose an account",
        fields: [
          f("accountType", "Account type", "radio", true, ["Checking", "Savings"]),
          f("funding", "Fund it with", "select", true, ["Transfer from another bank", "Debit card"]),
        ],
      },
    ],
  },
  b: {
    bank: "Sample bank B",
    product: "Branch account opening",
    pages: [
      {
        id: "about",
        title: "Applicant",
        fields: [
          f("fullName", "Full legal name", "text"),
          f("dob", "Date of birth", "date"),
          f("ssn", "SSN (last 4)", "text"),
          f("phone", "Phone", "tel"),
        ],
      },
      {
        id: "account",
        title: "Products",
        fields: [
          f("accountType", "Product", "radio", true, ["Checking", "Savings", "Certificate"]),
          f("overdraft", "Overdraft protection", "select", false, ["No", "Yes"]),
          f("email", "Email for statements", "email", false),
        ],
      },
    ],
  },
}

export type PlaygroundState = {
  readonly bankId: BankId
  /** Current (edited) config per bank; switching banks keeps each bank's edits. */
  readonly configs: Readonly<Record<BankId, ScreenConfig>>
  /** Page shown in the preview. */
  readonly pageIndex: number
  readonly log: readonly LogEntry[]
  readonly seq: number
}

export function createPlayground(now: number): PlaygroundState {
  return {
    bankId: "a",
    configs: SAMPLE_CONFIGS,
    pageIndex: 0,
    log: [{ id: 0, at: now, text: "Ready · Sample bank A config loaded", tone: "muted" }],
    seq: 1,
  }
}

export function currentConfig(state: PlaygroundState): ScreenConfig {
  return state.configs[state.bankId]
}

export function reset(state: PlaygroundState, now: number): PlaygroundState {
  return pushLog({ ...createPlayground(now), seq: state.seq, log: [] }, "Reset · sample configs restored", "muted", now)
}

export function selectBank(state: PlaygroundState, bankId: BankId, now: number): PlaygroundState {
  if (bankId === state.bankId) return state
  const cfg = state.configs[bankId]
  return pushLog(
    { ...state, bankId, pageIndex: 0 },
    `Loaded ${cfg.bank} config · same code, ${countVisible(cfg)} fields on ${cfg.pages.length} pages`,
    "steel",
    now,
  )
}

export function selectPage(state: PlaygroundState, pageIndex: number): PlaygroundState {
  const max = currentConfig(state).pages.length - 1
  return { ...state, pageIndex: Math.min(max, Math.max(0, pageIndex)) }
}

// ------------------------------------------------------------------ edits

type EditResult = { state: PlaygroundState; ok: boolean }

function updatePage(
  state: PlaygroundState,
  pageId: string,
  fn: (page: PageConfig) => PageConfig | null,
): { state: PlaygroundState; page: PageConfig | null; before: PageConfig | null } {
  const cfg = currentConfig(state)
  const before = cfg.pages.find((p) => p.id === pageId) ?? null
  if (!before) return { state, page: null, before: null }
  const page = fn(before)
  if (!page) return { state, page: null, before }
  const pages = cfg.pages.map((p) => (p.id === pageId ? page : p))
  return { state: { ...state, configs: { ...state.configs, [state.bankId]: { ...cfg, pages } } }, page, before }
}

/** Show/hide a field. A page must keep at least one visible field. */
export function toggleVisible(state: PlaygroundState, pageId: string, fieldId: string, now: number): EditResult {
  const page = currentConfig(state).pages.find((p) => p.id === pageId)
  const field = page?.fields.find((x) => x.id === fieldId)
  if (!page || !field) return { state, ok: false }
  if (field.visible && page.fields.filter((x) => x.visible).length === 1) {
    return { state: pushLog(state, `Kept "${field.label}" · a page needs at least one field`, "stop", now), ok: false }
  }
  const r = updatePage(state, pageId, (p) => ({
    ...p,
    fields: p.fields.map((x) => (x.id === fieldId ? { ...x, visible: !x.visible } : x)),
  }))
  const text = field.visible
    ? `Hid "${field.label}" · screen rebuilt, 0 deploys`
    : `Showed "${field.label}" · screen rebuilt, 0 deploys`
  return { state: pushLog(r.state, text, "go", now), ok: true }
}

/** Toggle required. Hidden fields can't be required. */
export function toggleRequired(state: PlaygroundState, pageId: string, fieldId: string, now: number): EditResult {
  const field = currentConfig(state).pages.find((p) => p.id === pageId)?.fields.find((x) => x.id === fieldId)
  if (!field || !field.visible) return { state, ok: false }
  const r = updatePage(state, pageId, (p) => ({
    ...p,
    fields: p.fields.map((x) => (x.id === fieldId ? { ...x, required: !x.required } : x)),
  }))
  const text = field.required ? `"${field.label}" now optional` : `"${field.label}" now required`
  return { state: pushLog(r.state, `${text} · 0 deploys`, "go", now), ok: true }
}

/** Move a field up (-1) or down (+1) within its page. */
export function moveField(state: PlaygroundState, pageId: string, fieldId: string, dir: -1 | 1, now: number): EditResult {
  const page = currentConfig(state).pages.find((p) => p.id === pageId)
  const i = page?.fields.findIndex((x) => x.id === fieldId) ?? -1
  const j = i + dir
  if (!page || i < 0 || j < 0 || j >= page.fields.length) return { state, ok: false }
  const field = page.fields[i]
  const r = updatePage(state, pageId, (p) => {
    const fields = [...p.fields]
    const [moved] = fields.splice(i, 1)
    if (!moved) return null
    fields.splice(j, 0, moved)
    return { ...p, fields }
  })
  return {
    state: pushLog(r.state, `Moved "${field?.label}" ${dir < 0 ? "up" : "down"} · 0 deploys`, "go", now),
    ok: true,
  }
}

// ------------------------------------------------------------ view helpers

export function visibleFields(page: PageConfig): readonly FieldConfig[] {
  return page.fields.filter((x) => x.visible)
}

export function countVisible(cfg: ScreenConfig): number {
  return cfg.pages.reduce((n, p) => n + visibleFields(p).length, 0)
}

/** Number of field-level differences from the bank's sample config (visibility, required, position). */
export function countChanges(state: PlaygroundState, bankId: BankId = state.bankId): number {
  const base = SAMPLE_CONFIGS[bankId]
  const cur = state.configs[bankId]
  let n = 0
  for (const page of cur.pages) {
    const basePage = base.pages.find((p) => p.id === page.id)
    if (!basePage) continue
    page.fields.forEach((field, i) => {
      const b = basePage.fields.find((x) => x.id === field.id)
      if (!b) return
      if (b.visible !== field.visible) n++
      if (b.required !== field.required) n++
      if (basePage.fields.indexOf(b) !== i) n++
    })
  }
  return n
}

/** The config as the JSON a bank would ship (stable key order; hidden fields kept with "visible": false). */
export function toJson(cfg: ScreenConfig): string {
  return JSON.stringify(
    {
      bank: cfg.bank,
      product: cfg.product,
      pages: cfg.pages.map((p) => ({
        id: p.id,
        title: p.title,
        fields: p.fields.map((x) => ({
          id: x.id,
          type: x.type,
          required: x.required,
          ...(x.visible ? {} : { visible: false }),
        })),
      })),
    },
    null,
    2,
  )
}
