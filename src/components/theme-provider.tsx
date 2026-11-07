import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react"

/**
 * Light / dark / system theme, persisted to localStorage (shadcn's Vite theme provider, adapted).
 *  - Prerender-safe: the server and the first client render both assume "system"; the stored value
 *    is read in a layout effect, before paint. The inline script in index.html has already set
 *    <html class="dark|light" data-theme-pref="…"> so there is no flash, and the lever's position
 *    is CSS-driven from data-theme-pref, so it is right before JS even loads.
 *  - Follows OS changes live while in "system" mode.
 */

export type Theme = "system" | "light" | "dark"
export type ResolvedTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "ambati-theme"
const THEMES: readonly Theme[] = ["system", "light", "dark"]

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored && (THEMES as readonly string[]).includes(stored)) return stored as Theme
  } catch {
    /* storage blocked (private mode etc.) */
  }
  return "system"
}

function applyTheme(pref: Theme, resolved: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(resolved)
  root.style.colorScheme = resolved
  root.dataset.themePref = pref
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [theme, setThemeState] = useState<Theme>("system")
  const [systemDark, setSystemDark] = useState(false)

  useLayoutEffect(() => {
    setThemeState(readStoredTheme())
    setSystemDark(window.matchMedia("(prefers-color-scheme: dark)").matches)
    setReady(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const resolvedTheme: ResolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme

  useLayoutEffect(() => {
    if (ready) applyTheme(theme, resolvedTheme)
  }, [ready, theme, resolvedTheme])

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    setThemeState(next)
  }, [])

  const value = useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
