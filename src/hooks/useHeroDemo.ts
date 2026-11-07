import { useCallback, useLayoutEffect, useState } from "react"
import type { DemoId } from "@/content/content"
import { HERO_DEMO_STORAGE_KEY, nextDemo, resolveHeroDemo } from "@/lab/registry"

function randomUint32(): number {
  try {
    const a = new Uint32Array(1)
    crypto.getRandomValues(a)
    return a[0] ?? 0
  } catch {
    return Math.floor(Math.random() * 2 ** 32)
  }
}

function readStored(): string | null {
  try {
    return sessionStorage.getItem(HERO_DEMO_STORAGE_KEY)
  } catch {
    return null
  }
}

function store(id: DemoId) {
  try {
    sessionStorage.setItem(HERO_DEMO_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.heroDemo = id
}

type HeroState = { heroId: DemoId } | null

/**
 * SPEC §4.0: one demo per visit, picked uniformly with crypto.getRandomValues and kept in
 * sessionStorage; ?demo= overrides; "Try another" cycles.
 *
 * The page is prerendered, so the pick happens on the client in a layout effect (before paint).
 * index.html's inline script has usually made the same pick already (same storage key), only
 * so the static HTML can reserve the right height; resolveHeroDemo() then just reads it back.
 * Returns null on the server and during hydration.
 */
export function useHeroDemo() {
  const [state, setState] = useState<HeroState>(null)

  useLayoutEffect(() => {
    const r = resolveHeroDemo({ query: window.location.search, stored: readStored(), randomUint32: randomUint32() })
    if (r.persist) store(r.id)
    else document.documentElement.dataset.heroDemo = r.id
    setState({ heroId: r.id })
  }, [])

  const tryAnother = useCallback(() => {
    setState((s) => {
      if (!s) return s
      const n = nextDemo(s.heroId)
      store(n)
      return { ...s, heroId: n }
    })
  }, [])

  return { hero: state, tryAnother }
}
