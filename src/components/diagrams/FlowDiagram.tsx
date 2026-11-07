import { useLayoutEffect, useMemo, useRef, useState } from "react"
import {
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import "@xyflow/react/dist/base.css"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/**
 * Read-only React Flow pipeline (SPEC §5). Lazy-loaded by DiagramSlot.
 * Nodes are laid out as a serpentine grid that fits the container width, so the same
 * diagram reads left→right on desktop and top→bottom on a phone. Animated (dashed,
 * moving) edges show the direction data flows; reduced motion → static edges.
 */

export type Tone = "signal" | "go" | "steel"
export type FlowNodeSpec = { label: string; highlight?: boolean; badges?: readonly string[] }

type ChipData = { label: string; highlight: boolean; badges: readonly string[]; tone: Tone; small: boolean }
type ChipNode = Node<ChipData, "chip">

const toneVar: Record<Tone, string> = { signal: "var(--signal)", go: "var(--go)", steel: "var(--steel)" }
const hidden = "!size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent !opacity-0"

function Chip({ data }: NodeProps<ChipNode>) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-wrap items-center gap-1.5 rounded-lg border bg-surface-2 font-mono leading-snug text-text",
        data.small ? "px-2.5 py-[7px] text-[11px]" : "px-3 py-[9px] text-xs",
      )}
      style={{ borderColor: data.highlight ? toneVar[data.tone] : "var(--line)" }}
    >
      <span>{data.label}</span>
      {data.badges.map((b) => (
        <span key={b} className="rounded bg-signal px-1.5 py-0.5 text-[10px] text-on-signal">
          {b}
        </span>
      ))}
      <Handle type="target" id="l" position={Position.Left} className={hidden} isConnectable={false} />
      <Handle type="target" id="r" position={Position.Right} className={hidden} isConnectable={false} />
      <Handle type="target" id="t" position={Position.Top} className={hidden} isConnectable={false} />
      <Handle type="source" id="r" position={Position.Right} className={hidden} isConnectable={false} />
      <Handle type="source" id="l" position={Position.Left} className={hidden} isConnectable={false} />
      <Handle type="source" id="b" position={Position.Bottom} className={hidden} isConnectable={false} />
    </div>
  )
}

const nodeTypes = { chip: Chip }

type Props = {
  nodes: readonly FlowNodeSpec[]
  tone: Tone
  nodeWidth: number
  nodeHeight: number
  small?: boolean
  label: string
}

function layout(count: number, width: number, w: number, h: number) {
  const gapX = 44
  const gapY = 40
  const cols = Math.max(1, Math.min(count, Math.floor((width + gapX) / (w + gapX))))
  const rows = Math.ceil(count / cols)
  const usedW = cols * w + (cols - 1) * gapX
  const offsetX = Math.max(0, (width - usedW) / 2)
  const pos = Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols)
    const c = r % 2 === 0 ? i % cols : cols - 1 - (i % cols)
    return { x: c * (w + gapX), y: r * (h + gapY), r }
  })
  return { pos, offsetX, height: rows * h + (rows - 1) * gapY + 8 }
}

function Diagram({ nodes, tone, nodeWidth, nodeHeight, small = false, label }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.floor(e.contentRect.width)))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const w = Math.min(nodeWidth, Math.max(160, width))
  const { pos, offsetX, height } = layout(nodes.length, width || nodeWidth, w, nodeHeight)

  const { rfNodes, rfEdges } = useMemo(() => {
    const rfNodes: ChipNode[] = nodes.map((n, i) => ({
      id: String(i),
      type: "chip",
      position: { x: pos[i]?.x ?? 0, y: pos[i]?.y ?? 0 },
      width: w,
      height: nodeHeight,
      data: { label: n.label, highlight: !!n.highlight, badges: n.badges ?? [], tone, small },
      draggable: false,
      selectable: false,
      focusable: false,
    }))
    const rfEdges: Edge[] = nodes.slice(1).map((_, k) => {
      const a = pos[k]
      const b = pos[k + 1]
      const sameRow = a && b && a.r === b.r
      const ltr = (a?.r ?? 0) % 2 === 0
      return {
        id: `e${k}`,
        source: String(k),
        target: String(k + 1),
        sourceHandle: sameRow ? (ltr ? "r" : "l") : "b",
        targetHandle: sameRow ? (ltr ? "l" : "r") : "t",
        type: "smoothstep",
        animated: !reduce,
        focusable: false,
        style: { stroke: toneVar[tone], strokeWidth: 2 },
      }
    })
    return { rfNodes, rfEdges }
  }, [nodes, pos, w, nodeHeight, tone, small, reduce])

  return (
    <div ref={ref} className="signal-flow w-full" style={{ height }} aria-hidden="true" data-label={label}>
      {width > 0 && (
        <ReactFlow
          key={`${width}-${tone}`}
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          defaultViewport={{ x: offsetX, y: 4, zoom: 1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        />
      )}
    </div>
  )
}

export default function FlowDiagram(props: Props) {
  return (
    <ReactFlowProvider>
      <Diagram {...props} />
    </ReactFlowProvider>
  )
}
