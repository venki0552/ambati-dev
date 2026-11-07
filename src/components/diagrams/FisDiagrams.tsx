import { workDiagrams } from "@/content/content"
import { FlowStrip } from "@/components/site/primitives"
import { DiagramSlot } from "@/components/diagrams/DiagramSlot"

const d1 = workDiagrams.digitalOne
const d2 = workDiagrams.agenticDelivery

const digitalOne = d1.nodes.map((label, i) => (i === 3 ? { label, highlight: true, badges: d1.badges } : { label }))
const agentic = d2.nodes.map((label, i) => ({ label, highlight: i === 1 }))

/** Digital One front-to-back (SPEC §5.1) and Agentic delivery (SPEC §5.2), on the FIS card. */
export function FisDiagrams() {
  return (
    <>
      <figure className="m-0 mt-7 rounded-[14px] border border-line bg-surface p-5">
        <figcaption className="mb-3.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground">{d1.caption}</figcaption>
        <DiagramSlot
          label="Digital One, front to back"
          nodes={digitalOne}
          tone="signal"
          nodeWidth={230}
          nodeHeight={92}
          fallback={
            <FlowStrip
              nodes={d1.nodes}
              tone="signal"
              highlight={[3]}
              renderNode={(n, i) =>
                i === 3 ? (
                  <span className="inline-flex flex-wrap items-center gap-2">
                    {n}
                    {d1.badges.map((b) => (
                      <span key={b} className="rounded bg-signal px-1.5 py-0.5 text-[10px] text-on-signal">
                        {b}
                      </span>
                    ))}
                  </span>
                ) : (
                  n
                )
              }
            />
          }
        />
      </figure>
      <figure className="m-0 mt-4 rounded-[14px] border border-line bg-surface p-5">
        <figcaption className="mb-3.5 font-mono text-[11px] tracking-[0.12em] text-muted-foreground">{d2.caption}</figcaption>
        <DiagramSlot
          label="Agentic delivery"
          nodes={agentic}
          tone="go"
          nodeWidth={170}
          nodeHeight={64}
          fallback={<FlowStrip nodes={d2.nodes} tone="go" highlight={[1]} />}
        />
      </figure>
    </>
  )
}
