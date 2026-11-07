import { useId, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowDown, ArrowUp } from "lucide-react"
import {
  BANK_IDS,
  SAMPLE_CONFIGS,
  countChanges,
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
  type FieldConfig,
  type PlaygroundState,
} from "@/lab/configScreens"
import { configLab } from "@/content/content"
import { DemoBody, DemoHeading, EventLog, ResetButton } from "@/components/lab/parts"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { cn } from "@/lib/utils"

/**
 * Config-driven screens (LINE 02). Left: the bank's screen config. Right: the screen the same code
 * renders from it. Logic: src/lab/configScreens.ts. Fields animate in/out because the screen is
 * genuinely being rebuilt from the new config (SPEC §2.4 rule).
 */
export default function ConfigScreensDemo() {
  const [s, setS] = useState<PlaygroundState>(() => createPlayground(Date.now()))
  const reduce = useReducedMotion()
  const cfg = currentConfig(s)
  const changes = countChanges(s)
  const edit = (fn: (st: PlaygroundState, now: number) => { state: PlaygroundState }) =>
    setS((prev) => fn(prev, Date.now()).state)

  return (
    <DemoBody>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <DemoHeading kicker={configLab.kicker} title={configLab.title} />
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Choose a sample bank">
          {BANK_IDS.map((id) => {
            const on = s.bankId === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => setS((prev) => selectBank(prev, id, Date.now()))}
                className={cn(
                  "lever-press min-h-11 rounded-full border px-4 font-mono text-xs tracking-[0.06em]",
                  on ? "border-text bg-text text-bg" : "border-line text-text hover:border-muted-foreground",
                )}
              >
                {SAMPLE_CONFIGS[id].bank.toUpperCase()}
              </button>
            )
          })}
        </div>
      </div>

      <p className="m-0 mt-3 font-mono text-[11px] tracking-[0.06em]" aria-live="polite">
        <span className={changes ? "text-signal-text" : "text-muted-foreground"}>
          {changes} CONFIG {changes === 1 ? "CHANGE" : "CHANGES"}
        </span>
        <span className="text-muted-foreground"> · </span>
        <span className="text-go">0 DEPLOYS</span>
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* ---------------- config */}
        <section aria-label={`${cfg.bank} screen config`} className="min-w-0 rounded-[14px] border border-line bg-surface-2 p-4 font-mono text-xs">
          <p className="m-0 mb-3 text-[10px] tracking-[0.12em] text-muted-foreground">CONFIG · {cfg.product.toUpperCase()}</p>
          {cfg.pages.map((page, pi) => (
            <div key={page.id} className="mb-3 last:mb-0">
              <button
                type="button"
                onClick={() => setS((prev) => selectPage(prev, pi))}
                aria-pressed={s.pageIndex === pi}
                className={cn(
                  "lever-press mb-1.5 inline-flex min-h-8 items-center gap-2 rounded-md px-2 text-left",
                  s.pageIndex === pi ? "bg-surface text-signal-text" : "text-text hover:bg-surface",
                )}
              >
                <span className="text-muted-foreground">page {pi + 1}</span> "{page.title}"
              </button>
              <ul className="m-0 list-none p-0">
                {page.fields.map((field, fi) => (
                  <FieldRow
                    key={field.id}
                    field={field}
                    first={fi === 0}
                    last={fi === page.fields.length - 1}
                    onVisible={() => edit((st, now) => toggleVisible(st, page.id, field.id, now))}
                    onRequired={() => edit((st, now) => toggleRequired(st, page.id, field.id, now))}
                    onMove={(dir) => edit((st, now) => moveField(st, page.id, field.id, dir, now))}
                  />
                ))}
              </ul>
            </div>
          ))}
          <details className="mt-3 border-t border-line pt-3">
            <summary className="cursor-pointer text-[10px] tracking-[0.12em] text-muted-foreground hover:text-text">
              VIEW config.json
            </summary>
            <pre className="m-0 mt-2 max-h-64 overflow-auto rounded-lg bg-surface p-3 text-[10px] leading-normal text-signal-text">
              {toJson(cfg)}
            </pre>
          </details>
        </section>

        {/* ---------------- rendered screen */}
        <section aria-label={`Screen rendered from the ${cfg.bank} config`} className="min-w-0">
          <ScreenPreview state={s} reduce={reduce} onPage={(i) => setS((prev) => selectPage(prev, i))} />
        </section>
      </div>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <ResetButton onClick={() => setS((prev) => reset(prev, Date.now()))} />
      </div>

      <EventLog entries={s.log} label="Config event log" max={4} minH="min-h-[96px]" />
    </DemoBody>
  )
}

function FieldRow({
  field,
  first,
  last,
  onVisible,
  onRequired,
  onMove,
}: {
  field: FieldConfig
  first: boolean
  last: boolean
  onVisible: () => void
  onRequired: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const id = useId()
  const iconBtn =
    "lever-press inline-flex size-8 items-center justify-center rounded-md border border-line text-muted-foreground hover:text-text disabled:opacity-35"
  return (
    <li className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 py-1 pl-3", !field.visible && "opacity-60")}>
      <label htmlFor={id} className="flex min-h-8 min-w-0 flex-1 cursor-pointer items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={field.visible}
          onChange={onVisible}
          className="size-4 shrink-0 accent-[var(--signal)]"
          aria-label={`Show ${field.label}`}
        />
        <span className={cn("truncate", !field.visible && "line-through")}>"{field.id}"</span>
        <span className="text-muted-foreground">{field.type}</span>
      </label>
      <button
        type="button"
        onClick={onRequired}
        disabled={!field.visible}
        aria-pressed={field.required}
        aria-label={`${field.label} required`}
        className={cn(
          "lever-press min-h-8 rounded-md border px-2 text-[10px] tracking-[0.06em] disabled:opacity-35",
          field.required ? "border-signal text-signal-text" : "border-line text-muted-foreground hover:text-text",
        )}
      >
        REQUIRED
      </button>
      <button type="button" className={iconBtn} onClick={() => onMove(-1)} disabled={first} aria-label={`Move ${field.label} up`}>
        <ArrowUp aria-hidden="true" className="size-3.5" />
      </button>
      <button type="button" className={iconBtn} onClick={() => onMove(1)} disabled={last} aria-label={`Move ${field.label} down`}>
        <ArrowDown aria-hidden="true" className="size-3.5" />
      </button>
    </li>
  )
}

/** The account-opening screen, rendered only from config. */
function ScreenPreview({ state, reduce, onPage }: { state: PlaygroundState; reduce: boolean; onPage: (i: number) => void }) {
  const cfg = currentConfig(state)
  const page = cfg.pages[state.pageIndex] ?? cfg.pages[0]
  const uid = useId()
  if (!page) return null
  const fields = visibleFields(page)
  const total = cfg.pages.length

  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-bg">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5">
        <span className="font-display text-lg leading-none font-extrabold uppercase">{cfg.bank}</span>
        <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
          STEP {state.pageIndex + 1} OF {total}
        </span>
      </div>
      <form className="p-4" onSubmit={(e) => e.preventDefault()} aria-label={`${cfg.bank}: ${page.title}`}>
        <h4 className="m-0 mb-3 text-lg font-bold">{page.title}</h4>
        <motion.div layout={!reduce} className="flex flex-col gap-3">
          <AnimatePresence initial={false} mode="popLayout">
            {fields.map((field) => (
              <motion.div
                key={`${cfg.bank}-${field.id}`}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
              >
                <PreviewField field={field} name={`${uid}-${field.id}`} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <div className="mt-4 flex justify-between gap-2">
          <button
            type="button"
            onClick={() => onPage(state.pageIndex - 1)}
            disabled={state.pageIndex === 0}
            className="lever-press min-h-10 rounded-lg px-3 text-sm text-muted-foreground underline underline-offset-4 disabled:invisible"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => onPage(state.pageIndex + 1)}
            disabled={state.pageIndex >= total - 1}
            className="lever-press min-h-10 rounded-lg bg-signal px-4 text-sm font-bold text-on-signal disabled:opacity-45"
          >
            {state.pageIndex >= total - 1 ? "Submit (demo)" : "Continue →"}
          </button>
        </div>
      </form>
    </div>
  )
}

function PreviewField({ field, name }: { field: FieldConfig; name: string }) {
  const req = field.required ? <span className="text-stop" aria-hidden="true"> *</span> : null
  const control = "w-full min-h-10 rounded-lg border border-line bg-surface px-3 text-sm text-text"
  if (field.type === "radio" && field.options) {
    return (
      <fieldset className="m-0 border-0 p-0">
        <legend className="mb-1 p-0 text-sm">
          {field.label}
          {req}
          {field.required && <span className="sr-only"> (required)</span>}
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {field.options.map((o) => (
            <label key={o} className="flex min-h-8 items-center gap-2 text-sm">
              <input type="radio" name={name} className="size-4 accent-[var(--signal)]" />
              {o}
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
  return (
    <label className="block text-sm">
      <span className="mb-1 block">
        {field.label}
        {req}
      </span>
      {field.type === "select" && field.options ? (
        <select name={name} className={control} required={field.required} defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input name={name} type={field.type} required={field.required} className={control} autoComplete="off" />
      )}
    </label>
  )
}
