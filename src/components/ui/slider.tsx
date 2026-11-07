import * as React from "react"
import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"

/** shadcn Slider, restyled: line-coloured rail, amber range, amber thumb with a 44px touch target. */
function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("relative flex h-11 w-full touch-none items-center select-none data-disabled:opacity-50", className)}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className="relative h-1 grow overflow-hidden rounded-full bg-line">
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-signal" />
      </SliderPrimitive.Track>
      {(props.value ?? props.defaultValue ?? [0]).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          aria-label={props["aria-label"]}
          className="relative block size-5 rounded-full border-2 border-bg bg-signal shadow-[0_0_0_1px_var(--signal-ring)] after:absolute after:-inset-3 after:content-['']"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
