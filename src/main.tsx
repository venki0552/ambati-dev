import { StrictMode } from "react"
import { createRoot, hydrateRoot } from "react-dom/client"

import "@/styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import App from "@/App"

const root = document.getElementById("root")
if (!root) throw new Error("#root missing from index.html")

const app = (
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)

// Production HTML is prerendered (scripts/prerender.mjs) → hydrate; `vite dev` serves an empty root → render.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
