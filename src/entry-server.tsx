import { StrictMode } from "react"
import { renderToString } from "react-dom/server"
import { ThemeProvider } from "@/components/theme-provider"
import App from "@/App"

/** Build-time prerender (scripts/prerender.mjs). Client-only bits render their static stand-ins. */
export function render(): string {
  return renderToString(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
}
