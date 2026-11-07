// Build-time prerender: injects the server-rendered app into dist/index.html (hydrated by main.tsx),
// and preloads the display font used by the LCP element (the name).
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { pathToFileURL } from "node:url"
import { resolve } from "node:path"

const dist = resolve("dist")
const serverEntry = resolve("dist-server/entry-server.js")
const { render } = await import(pathToFileURL(serverEntry).href)

const appHtml = render()
let html = readFileSync(resolve(dist, "index.html"), "utf8")
if (!html.includes('<div id="root"></div>')) throw new Error("prerender: empty #root not found in dist/index.html")
html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

const font = readdirSync(resolve(dist, "assets")).find((f) => /^big-shoulders-display-latin-wght-normal-.*\.woff2$/.test(f))
if (font) {
  html = html.replace(
    "</title>",
    `</title>\n    <link rel="preload" href="/assets/${font}" as="font" type="font/woff2" crossorigin />`,
  )
}

writeFileSync(resolve(dist, "index.html"), html)
rmSync(resolve("dist-server"), { recursive: true, force: true })
console.log(`prerendered ${(appHtml.length / 1024).toFixed(1)} KB of HTML into dist/index.html${font ? `, preloaded ${font}` : ""}`)
