// Measures each demo's natural (initial-state) height per width, to size the no-CLS skeletons.
import { chromium } from "@playwright/test"
const b = await chromium.launch()
for (const id of ["circuit-breaker", "oauth-jwt", "token-bucket"]) {
  const row = []
  for (const w of [320, 390, 640, 768, 1024, 1440]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } })
    await p.goto(`http://localhost:4173/?demo=${id}`, { waitUntil: "networkidle" })
    await p.waitForTimeout(400)
    const h = await p.evaluate(() => {
      const body = document.querySelector('[data-testid="hero-demo"] .anim-demo-in > div')
      body.style.minHeight = "0"
      return Math.round(body.getBoundingClientRect().height)
    })
    row.push(`${w}:${h}`)
    await p.close()
  }
  console.log(id.padEnd(16), row.join("  "))
}
await b.close()
