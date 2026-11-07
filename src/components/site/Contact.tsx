import { useEffect, useRef, useState } from "react"
import { ArrowUpRight } from "lucide-react"
import { notify } from "@/lib/notify"
import { contact, sections, site } from "@/content/content"
import { Button } from "@/components/ui/button"
import { SectionPlate } from "@/components/site/primitives"

/** "Open a line": LinkedIn + email with copy button and toast (SPEC §6). No form, no backend. */
export function Contact() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      void notify("success", contact.copy.toast, site.email)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      void notify("error", "Couldn't copy. The address is " + site.email)
    }
  }

  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-6 pt-[88px] pb-[72px]">
      <div className="rounded-[22px] border border-line bg-surface p-[clamp(24px,5vw,56px)]">
        <SectionPlate section={sections.contact} className="mb-4" plateClassName="bg-bg" />
        <p className="m-0 mb-7 max-w-[560px] text-lead">{contact.lead}</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="signal" size="lg">
            <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
              <ArrowUpRight aria-hidden="true" strokeWidth={2.2} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-[18px] font-mono text-[13px] font-normal max-sm:text-xs">
            <a href={site.links.email}>{site.email}</a>
          </Button>
          <Button variant="quiet" size="lg" className="px-4" onClick={copy} aria-live="polite">
            {copied ? contact.copy.done : contact.copy.idle}
          </Button>
        </div>
      </div>
    </section>
  )
}
