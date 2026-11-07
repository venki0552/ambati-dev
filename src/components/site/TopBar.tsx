import { Download } from "lucide-react"
import { nav, site } from "@/content/content"
import { Button } from "@/components/ui/button"
import { ThemeLever } from "@/components/site/ThemeLever"

export function TopBar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3.5 border-b border-line py-[18px]">
      <a href="#top" className="flex items-center gap-3 no-underline">
        <span className="inline-flex size-11 items-center justify-center rounded-[10px] border-2 border-text font-display text-[22px] font-extrabold tracking-[0.04em]">
          {site.monogram}
        </span>
        <span className="font-mono text-xs tracking-[0.1em] text-muted-foreground">{site.domain.toUpperCase()}</span>
        <span className="sr-only">, back to top</span>
      </a>

      <nav aria-label="Sections" className="flex flex-wrap gap-x-[22px] font-mono text-xs tracking-[0.08em]">
        {nav.map((item) => (
          <a key={item.href} href={item.href} className="link-wipe py-3 uppercase">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-3">
        <ThemeLever />
        <Button asChild variant="signal" size="md" className="text-[15px]">
          <a href={site.resume.href} download={site.resume.fileName}>
            <Download aria-hidden="true" strokeWidth={2.2} />
            Résumé
          </a>
        </Button>
      </div>
    </header>
  )
}
