import { describe, expect, it } from "vitest"
import {
  SAMPLE_CONFIGS,
  countChanges,
  countVisible,
  createPlayground,
  currentConfig,
  moveField,
  reset,
  selectBank,
  selectPage,
  toJson,
  toggleRequired,
  toggleVisible,
  visibleFields,
} from "@/lab/configScreens"

const T = 1_000
const page = (s: ReturnType<typeof createPlayground>, id: string) => currentConfig(s).pages.find((p) => p.id === id)!
const lastLog = (s: ReturnType<typeof createPlayground>) => s.log.at(-1)?.text ?? ""

describe("config-driven screens", () => {
  it("starts on Sample bank A, page 1, no changes", () => {
    const s = createPlayground(T)
    expect(s.bankId).toBe("a")
    expect(s.pageIndex).toBe(0)
    expect(countChanges(s)).toBe(0)
    expect(currentConfig(s)).toBe(SAMPLE_CONFIGS.a)
  })

  it("hiding a field removes it from the rendered screen and counts as 1 change", () => {
    const r = toggleVisible(createPlayground(T), "about", "phone", T)
    expect(r.ok).toBe(true)
    expect(visibleFields(page(r.state, "about")).map((x) => x.id)).not.toContain("phone")
    expect(countChanges(r.state)).toBe(1)
    expect(lastLog(r.state)).toBe('Hid "Mobile phone" · screen rebuilt, 0 deploys')
  })

  it("showing it again restores the sample config", () => {
    let s = toggleVisible(createPlayground(T), "about", "phone", T).state
    s = toggleVisible(s, "about", "phone", T).state
    expect(countChanges(s)).toBe(0)
    expect(lastLog(s)).toBe('Showed "Mobile phone" · screen rebuilt, 0 deploys')
  })

  it("refuses to hide the last visible field on a page", () => {
    let s = createPlayground(T)
    s = toggleVisible(s, "account", "accountType", T).state
    const r = toggleVisible(s, "account", "funding", T)
    expect(r.ok).toBe(false)
    expect(visibleFields(page(r.state, "account"))).toHaveLength(1)
    expect(lastLog(r.state)).toContain("a page needs at least one field")
  })

  it("toggles required, but not on hidden fields", () => {
    let r = toggleRequired(createPlayground(T), "about", "phone", T)
    expect(page(r.state, "about").fields.find((x) => x.id === "phone")?.required).toBe(true)
    expect(lastLog(r.state)).toBe('"Mobile phone" now required · 0 deploys')
    const hidden = toggleVisible(r.state, "about", "email", T).state
    r = toggleRequired(hidden, "about", "email", T)
    expect(r.ok).toBe(false)
  })

  it("moves fields within bounds and counts position changes", () => {
    const s0 = createPlayground(T)
    const up = moveField(s0, "about", "email", -1, T)
    expect(page(up.state, "about").fields.map((x) => x.id)).toEqual(["firstName", "lastName", "email", "dob", "phone"])
    expect(countChanges(up.state)).toBe(2) // email and dob both changed position
    expect(moveField(s0, "about", "firstName", -1, T).ok).toBe(false)
    expect(moveField(s0, "about", "phone", 1, T).ok).toBe(false)
  })

  it("switching banks keeps each bank's edits and resets the page", () => {
    let s = toggleVisible(createPlayground(T), "about", "phone", T).state
    s = selectPage(s, 1)
    s = selectBank(s, "b", T)
    expect(s.pageIndex).toBe(0)
    expect(currentConfig(s).bank).toBe("Sample bank B")
    expect(countChanges(s)).toBe(0)
    expect(lastLog(s)).toBe(`Loaded Sample bank B config · same code, ${countVisible(SAMPLE_CONFIGS.b)} fields on 2 pages`)
    s = selectBank(s, "a", T)
    expect(countChanges(s)).toBe(1)
  })

  it("clamps the page index", () => {
    const s = createPlayground(T)
    expect(selectPage(s, 9).pageIndex).toBe(1)
    expect(selectPage(s, -3).pageIndex).toBe(0)
  })

  it("reset restores both sample configs", () => {
    let s = toggleVisible(createPlayground(T), "about", "phone", T).state
    s = selectBank(s, "b", T)
    s = toggleRequired(s, "account", "email", T).state
    s = reset(s, T)
    expect(s.configs).toBe(SAMPLE_CONFIGS)
    expect(s.bankId).toBe("a")
    expect(lastLog(s)).toBe("Reset · sample configs restored")
  })

  it("serialises the config as JSON with hidden fields flagged", () => {
    const s = toggleVisible(createPlayground(T), "about", "phone", T).state
    const json = JSON.parse(toJson(currentConfig(s)))
    expect(json.bank).toBe("Sample bank A")
    expect(json.pages[0].fields.find((x: { id: string }) => x.id === "phone")).toEqual({
      id: "phone",
      type: "tel",
      required: false,
      visible: false,
    })
    expect(json.pages[0].fields[0]).toEqual({ id: "firstName", type: "text", required: true })
  })

  it("sample configs never name a real bank", () => {
    for (const cfg of Object.values(SAMPLE_CONFIGS)) expect(cfg.bank).toMatch(/^Sample bank [AB]$/)
  })
})
