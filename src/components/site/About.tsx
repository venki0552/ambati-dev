import { about, sections } from "@/content/content"
import { SectionPlate } from "@/components/site/primitives"

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-6 pt-[88px] pb-6">
      <SectionPlate section={sections.about} className="mb-8" />
      <div className="flex flex-wrap items-start gap-10">
        {about.portrait.src ? (
          <img
            src={about.portrait.src}
            alt={about.portrait.alt}
            width={260}
            height={320}
            loading="lazy"
            className="h-[320px] w-[260px] max-w-full rounded-[18px] border border-line object-cover"
          />
        ) : (
          // TODO(venkat): add public/venkat.jpg and set about.portrait.src in content.ts
          <div
            role="img"
            aria-label="Portrait placeholder"
            className="flex h-[320px] w-[260px] max-w-full flex-none items-center justify-center rounded-[18px] border-2 border-dashed border-line bg-surface font-mono text-xs tracking-[0.1em] text-muted-foreground"
          >
            {about.portrait.placeholder}
          </div>
        )}
        <div className="min-w-0 max-w-[680px] flex-[1_1_420px] text-lead">
          {about.paragraphs.map((p, i) => (
            <p key={p} className={i === 0 ? "m-0 mb-4" : "m-0 text-muted-foreground"}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
