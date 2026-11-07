// Renders public/og.png (1200×630) and public/apple-touch-icon.png (180×180) with the site's fonts.
import { chromium } from "@playwright/test"
import { readFileSync } from "node:fs"

const font = (p) => `data:font/woff2;base64,${readFileSync(new URL(`../node_modules/${p}`, import.meta.url)).toString("base64")}`
const display = font("@fontsource-variable/big-shoulders-display/files/big-shoulders-display-latin-wght-normal.woff2")
const mono = font("@fontsource/martian-mono/files/martian-mono-latin-400-normal.woff2")

const css = `
@font-face{font-family:BSD;src:url(${display}) format('woff2');font-weight:100 900}
@font-face{font-family:MM;src:url(${mono}) format('woff2')}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#0D0F0C;background-image:radial-gradient(rgba(232,228,216,.08) 1px,transparent 1.4px);background-size:24px 24px;font-family:MM;color:#E8E4D8;display:flex;align-items:center;padding:0 72px;position:relative;overflow:hidden}
.plate{background:#F2EDE1;background-image:linear-gradient(rgba(26,28,23,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(26,28,23,.055) 1px,transparent 1px);background-size:24px 24px;color:#1A1C17;border:4px solid #1A1C17;border-radius:28px;padding:44px 52px;box-shadow:0 0 0 10px #0D0F0C,0 0 0 12px #2A2F25,0 50px 120px -40px rgba(255,176,32,.45);width:100%}
.code{display:inline-block;border:1px solid #D3CAB6;background:#FBF8F1;border-radius:8px;padding:8px 14px;font-size:18px;letter-spacing:.14em;color:#8A4F00}
h1{font-family:BSD;font-weight:900;text-transform:uppercase;font-size:118px;line-height:.86;margin-top:22px;letter-spacing:.01em}
h1 span{color:#8A4F00}
.role{margin-top:26px;font-size:20px;letter-spacing:.08em;color:#5E5C4C}
.lamps{position:absolute;right:136px;top:162px;display:flex;gap:18px}
.lamps i{width:22px;height:22px;border-radius:50%;display:block}
`
const og = `<html><head><style>${css}</style></head><body>
<div class="plate">
  <span class="code">LINE 01 · AMBATI.DEV</span>
  <h1>Venkata Reddy<br><span>Ambati</span></h1>
  <p class="role">SENIOR LEAD SOFTWARE ENGINEER · FIS · CHARLOTTE, NC</p>
</div>
<div class="lamps"><i style="background:#17703C"></i><i style="background:#FFB020;box-shadow:0 0 16px #FFB020"></i><i style="background:#17703C"></i></div>
</body></html>`

const icon = `<html><head><style>${css}
body{width:180px;height:180px;padding:0;justify-content:center;background:#FFB020}
b{font-family:BSD;font-weight:800;font-size:96px;color:#0D0F0C;letter-spacing:.04em}
</style></head><body><b>VA</b></body></html>`

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
await p.setContent(og)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: "public/og.png" })
await p.setViewportSize({ width: 180, height: 180 })
await p.setContent(icon)
await p.evaluate(() => document.fonts.ready)
await p.screenshot({ path: "public/apple-touch-icon.png" })
await b.close()
console.log("wrote public/og.png, public/apple-touch-icon.png")
