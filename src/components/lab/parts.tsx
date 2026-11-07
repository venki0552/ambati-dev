import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type Tone = "go" | "stop" | "signal" | "steel" | "muted"

const toneText: Record<Tone, string> = {
  go: "text-go",
  stop: "text-stop",
  signal: "text-signal-text",
  steel: "text-steel",
  muted: "text-muted-foreground",
}
const toneVar: Record<Tone, string> = {
  go: "var(--go)",
  stop: "var(--stop)",
  signal: "var(--signal)",
  steel: "var(--steel)",
  muted: "var(--line)",
}

/** Demo card body: surface panel with the design's 22px padding and 15px body text. */
export function DemoBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("bg-surface p-[22px] text-[15px] leading-normal text-text max-sm:p-4", className)}>{children}</div>
}

/** "DEMO · RESILIENCE" + Big Shoulders title. */
export function DemoHeading({ kicker, title, as: Tag = "h3" }: { kicker: string; title: string; as?: "h2" | "h3" }) {
  return (
    <div>
      <p className="m-0 font-mono text-[10px] tracking-[0.12em] text-muted-foreground">{kicker}</p>
      <Tag className="m-0 mt-1 font-display text-[32px] leading-none font-extrabold tracking-[0.02em] uppercase">{title}</Tag>
    </div>
  )
}

/** Status lamp; colour cross-fades in 150ms (SPEC §2.4.4). */
export function Lamp({ label, on, tone }: { label: string; on: boolean; tone: Tone }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        aria-hidden="true"
        className="size-[18px] rounded-full transition-[background-color,box-shadow] duration-150"
        style={{ background: on ? toneVar[tone] : "var(--line)", boxShadow: on ? `0 0 14px ${toneVar[tone]}` : "none" }}
      />
      <span className={cn("font-mono text-[9px] tracking-[0.08em]", on ? "text-text" : "text-muted-foreground")}>{label}</span>
    </div>
  )
}

export type LogLine = { id: number; text: string; tone: Tone }

/** aria-live event log in mono, newest first (design: "›" prefix). */
export function EventLog({ entries, label, max = 5, minH = "min-h-[120px]" }: { entries: readonly LogLine[]; label: string; max?: number; minH?: string }) {
  const shown = entries.slice(-max).reverse()
  return (
    <div className={cn("mt-[18px] border-t border-line pt-3 font-mono text-[11px] leading-normal", minH)}>
      <p className="sr-only">{label}</p>
      <ol aria-live="polite" aria-relevant="additions" className="m-0 list-none p-0">
        {shown.map((e) => (
          <li key={e.id} className={cn("flex gap-2.5 py-[3px]", toneText[e.tone])}>
            <span aria-hidden="true" className="text-muted-foreground">
              ›
            </span>
            <span>{e.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Big status code + mono text (design: role="status"). */
export function StatusLine({ code, text, tone, testId }: { code: string; text: string; tone: Tone; testId?: string }) {
  return (
    <div role="status" data-testid={testId} className="mt-4 flex min-h-10 flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className={cn("font-display text-[34px] leading-none font-extrabold", toneText[tone])}>{code}</span>
      <span className={cn("font-mono text-[11px]", toneText[tone])}>{text}</span>
    </div>
  )
}

/** Secondary demo button (design: 1.5px border, 15px). */
export function DemoButton({
  children,
  onClick,
  pressed,
  disabled,
  tone = "line",
  className,
}: {
  children: ReactNode
  onClick: () => void
  pressed?: boolean
  disabled?: boolean
  tone?: "line" | "ink" | "signal" | "stop"
  className?: string
}) {
  const border = { line: "border-line", ink: "border-text", signal: "border-signal", stop: "border-stop" }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(
        "lever-press min-h-11 rounded-[10px] border-[1.5px] bg-transparent px-4 text-[15px] text-text hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-45",
        border,
        className,
      )}
    >
      {children}
    </button>
  )
}

export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lever-press min-h-11 rounded-[10px] bg-transparent px-3.5 text-[15px] text-muted-foreground underline underline-offset-4 hover:text-text"
    >
      Reset
    </button>
  )
}
