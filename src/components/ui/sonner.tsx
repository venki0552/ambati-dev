import type { CSSProperties } from "react"
import { CircleCheckIcon, InfoIcon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "@/components/theme-provider"

/** shadcn Sonner, restyled as a Signal Box status plate (mono, amber edge). */
const Toaster = (props: ToasterProps) => {
  const { resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={resolvedTheme}
      position="bottom-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-go" />,
        info: <InfoIcon className="size-4 text-steel" />,
        warning: <TriangleAlertIcon className="size-4 text-signal-text" />,
        error: <OctagonXIcon className="size-4 text-stop" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--text)",
          "--normal-border": "var(--line)",
          "--border-radius": "10px",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!font-mono !text-xs !tracking-[0.06em] !border-l-4 !border-l-signal",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
