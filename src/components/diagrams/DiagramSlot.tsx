import { lazy, Suspense, useRef, type ReactNode } from "react"
import { useNearViewport } from "@/hooks/useNearViewport"
import type { FlowNodeSpec, Tone } from "@/components/diagrams/FlowDiagram"

const FlowDiagram = lazy(() => import("@/components/diagrams/FlowDiagram"))

/**
 * Renders the static flow strip (works without JS, zero cost) and swaps in the
 * React Flow diagram once the slot is within 600px of the viewport (SPEC §5, §7).
 * Screen readers always get the ordered list of steps.
 */
export function DiagramSlot({
  label,
  nodes,
  tone,
  nodeWidth,
  nodeHeight,
  small,
  fallback,
}: {
  label: string
  nodes: readonly FlowNodeSpec[]
  tone: Tone
  nodeWidth: number
  nodeHeight: number
  small?: boolean
  fallback: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const near = useNearViewport(ref, "600px")
  return (
    <div ref={ref}>
      <ol className="sr-only" aria-label={label}>
        {nodes.map((n) => (
          <li key={n.label}>
            {n.label}
            {n.badges?.length ? ` (${n.badges.join(", ").toLowerCase()})` : ""}
          </li>
        ))}
      </ol>
      {near ? (
        <Suspense fallback={<div aria-hidden="true">{fallback}</div>}>
          <FlowDiagram label={label} nodes={nodes} tone={tone} nodeWidth={nodeWidth} nodeHeight={nodeHeight} small={small} />
        </Suspense>
      ) : (
        <div aria-hidden="true">{fallback}</div>
      )}
    </div>
  )
}
