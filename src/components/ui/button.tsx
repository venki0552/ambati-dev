import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

/**
 * shadcn Button, restyled for Signal Box (values from design/Main.dc.html):
 *  signal  — amber fill, primary CTA ("Connect on LinkedIn", "Résumé", "Send request")
 *  outline — 1.5px ink border ("Email me")
 *  plate   — enamel plate, mono label ("TRY ANOTHER", demo controls)
 *  quiet   — hairline border, muted mono ("COPY EMAIL", "Reset")
 * Every variant presses down 1px like a lever (SPEC §2.4.6).
 */
const buttonVariants = cva(
  "lever-press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap no-underline select-none disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        signal: "rounded-[10px] bg-signal font-bold text-on-signal hover:bg-[color-mix(in_oklab,var(--signal),var(--text)_12%)]",
        outline: "rounded-[10px] border-[1.5px] border-text font-bold text-text hover:bg-surface",
        plate:
          "rounded-lg border border-line bg-surface font-mono text-[11px] tracking-[0.06em] text-text hover:border-muted-foreground",
        quiet:
          "rounded-[10px] border border-line bg-transparent font-mono text-xs tracking-[0.06em] text-muted-foreground hover:text-text",
      },
      size: {
        lg: "min-h-12 px-5",
        md: "min-h-11 px-4",
        sm: "min-h-10 px-3.5",
      },
    },
    defaultVariants: {
      variant: "signal",
      size: "md",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: "button" as const })}
      {...props}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }
