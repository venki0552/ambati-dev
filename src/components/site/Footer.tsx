import { footer } from "@/content/content"
import { ExtLink } from "@/components/site/primitives"

export function Footer() {
  return (
    <footer className="flex flex-wrap justify-between gap-x-6 gap-y-3 border-t border-line pt-7 pb-10 font-mono text-[11px] tracking-[0.06em] text-muted-foreground">
      <p className="m-0">
        {footer.copyright} · {footer.builtWith}
      </p>
      <div className="flex flex-wrap gap-x-[18px] gap-y-1">
        {footer.links.map((l) => (
          <ExtLink key={l.href} href={l.href} className="py-2">
            {l.label}
          </ExtLink>
        ))}
      </div>
    </footer>
  )
}
