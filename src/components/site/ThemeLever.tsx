import { useRef, type KeyboardEvent } from "react"
import { cn } from "@/lib/utils"
import { useTheme, type Theme } from "@/components/theme-provider"

/**
 * Three-position theme lever (SPEC §3: "System/Light/Dark, styled as a 3-position lever").
 * A frame with a sliding handle, like a signal-box lever moving between notches.
 * Semantics: a radio group with roving tabindex; ← → ↑ ↓ / Home / End move the lever.
 * The handle position and active label colour are CSS-driven from <html data-theme-pref>,
 * which the inline script sets before first paint, so prerendered HTML is right pre-JS.
 */

const POSITIONS: { value: Theme; label: string; name: string }[] = [
  { value: "system", label: "AUTO", name: "Match system theme" },
  { value: "light", label: "LIGHT", name: "Light theme" },
  { value: "dark", label: "DARK", name: "Dark theme" },
]

export function ThemeLever({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(
    0,
    POSITIONS.findIndex((p) => p.value === theme),
  )

  const move = (next: number) => {
    const i = (next + POSITIONS.length) % POSITIONS.length
    const pos = POSITIONS[i]
    if (!pos) return
    setTheme(pos.value)
    refs.current[i]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: POSITIONS.length - 1,
    }
    const target = keys[e.key]
    if (target === undefined) return
    e.preventDefault()
    move(target)
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "relative grid grid-cols-3 rounded-full border border-line bg-surface p-[3px]",
        "shadow-[inset_0_1px_2px_rgb(0_0_0/0.12)]",
        className,
      )}
    >
      {/* Handle: slides between the three notches */}
      <span
        aria-hidden="true"
        className="lever-handle absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-full bg-text shadow-[0_1px_0_rgb(0_0_0/0.25)] transition-transform duration-200 ease-[cubic-bezier(.2,.7,.2,1)]"
      />
      {POSITIONS.map((p, i) => {
        const on = i === index
        return (
          <button
            key={p.value}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={p.name}
            tabIndex={on ? 0 : -1}
            onClick={() => setTheme(p.value)}
            onKeyDown={onKeyDown}
            data-lever={p.value}
            className={cn(
              "lever-press relative z-10 inline-flex min-h-10 min-w-14 items-center justify-center rounded-full px-3",
              "font-mono text-[11px] tracking-[0.08em] transition-colors duration-150",
              "text-muted-foreground hover:text-text",
            )}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
