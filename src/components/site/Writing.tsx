import { sections, writing } from "@/content/content"
import { SectionPlate } from "@/components/site/primitives"

export function Writing() {
  return (
    <section id="writing" aria-labelledby="writing-title" className="scroll-mt-6 pt-[88px] pb-6">
      <SectionPlate section={sections.writing} className="mb-8" />
      <ul className="m-0 list-none border-t border-line p-0">
        {writing.map((post) => (
          <li key={post.href}>
            <a
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-line py-[26px] no-underline"
            >
              <span className="min-w-0 flex-[1_1_520px] font-display text-[30px] leading-[1.15] font-bold transition-colors group-hover:text-signal-text max-sm:text-[26px]">
                {post.title}
              </span>
              <span className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
                <time>{post.date}</time> · {post.readTime} · MEDIUM ↗<span className="sr-only"> (opens in a new tab)</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
