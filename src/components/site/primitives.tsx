import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { Section } from "@/content/content"

/** Enamel section plate: mono "LINE 0X" code + uppercase Big Shoulders title (SPEC §2.5). */
export function SectionPlate({
  section,
  className,
  plateClassName,
}: {
  section: Section
  className?: string
  plateClassName?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3.5", className)}>
      <span
        className={cn(
          "rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-[11px] tracking-[0.14em] text-signal-text",
          plateClassName,
        )}
      >
        {section.line}
      </span>
      <h2 id={`${section.id}-title`} className="m-0 font-display text-h2 font-extrabold uppercase">
        {section.title}
      </h2>
    </div>
  )
}

/** External link: new tab, safe rel, amber wipe underline. */
export function ExtLink({ className, children, ...props }: ComponentProps<"a">) {
  return (
    <a target="_blank" rel="noopener noreferrer" className={cn("link-wipe", className)} {...props}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

/** Mono eyebrow label. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("m-0 font-mono text-[11px] tracking-[0.12em] text-signal-text", className)}>{children}</p>
}

type Tone = "signal" | "go" | "steel"
const flowColor: Record<Tone, string> = { signal: "var(--signal)", go: "var(--go)", steel: "var(--steel)" }

/**
 * The design's chip-and-dashed-line flow strip. Used as the static, no-JS / pre-load
 * rendering of each diagram; React Flow replaces it once it scrolls near (SPEC §5).
 */
export function FlowStrip({
  nodes,
  tone,
  highlight = [],
  small = false,
  renderNode,
}: {
  nodes: readonly string[]
  tone: Tone
  highlight?: number[]
  small?: boolean
  renderNode?: (label: string, i: number) => ReactNode
}) {
  return (
    <ol className={cn("m-0 flex list-none flex-wrap items-center p-0", small ? "gap-2" : "gap-2.5")}>
      {nodes.map((n, i) => (
        <li key={n} className={cn("flex items-center", small ? "gap-2" : "gap-2.5")}>
          {i > 0 && (
            <span
              aria-hidden="true"
              className={cn("h-0.5 animate-[flow_1.4s_linear_infinite]", small ? "w-[18px]" : "w-[30px]")}
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, ${flowColor[tone]} 0 6px, transparent 6px 12px)`,
                backgroundSize: "24px 2px",
              }}
            />
          )}
          <span
            className={cn(
              "rounded-lg border bg-surface-2 font-mono",
              small ? "px-2.5 py-[7px] text-[11px]" : "px-3 py-[9px] text-xs",
              highlight.includes(i) ? "" : "border-line",
            )}
            style={highlight.includes(i) ? { borderColor: flowColor[tone] } : undefined}
          >
            {renderNode ? renderNode(n, i) : n}
          </span>
        </li>
      ))}
    </ol>
  )
}
