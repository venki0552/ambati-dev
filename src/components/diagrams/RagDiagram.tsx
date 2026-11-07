import { projects } from "@/content/content"
import { FlowStrip } from "@/components/site/primitives"
import { DiagramSlot } from "@/components/diagrams/DiagramSlot"

const steps = (projects.find((p) => p.id === "memory-palace")?.pipeline ?? []).map((s, i) => `${i + 1} ${s}`)
const nodes = steps.map((label, i) => ({ label, highlight: i === 5 }))

/** Memory Palace 7-step agentic RAG (SPEC §5.3). */
export function RagDiagram() {
  return (
    <figure className="m-0">
      <figcaption className="mb-3 font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
        AGENTIC RAG PIPELINE · SIMPLIFIED, ILLUSTRATIVE
      </figcaption>
      <DiagramSlot
        label="Memory Palace agentic RAG pipeline"
        nodes={nodes}
        tone="steel"
        nodeWidth={150}
        nodeHeight={56}
        small
        fallback={<FlowStrip small tone="steel" highlight={[5]} nodes={steps} />}
      />
    </figure>
  )
}
