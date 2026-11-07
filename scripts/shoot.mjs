// Usage: node scripts/shoot.mjs <outDir> [baseUrl]
// Screenshots at 390 + 1440 in light + dark, plus theme sanity checks.
import { chromium } from "@playwright/test"
import { mkdirSync } from "node:fs"

const out = process.argv[2] ?? "screenshots"
const base = process.argv[3] ?? "http://localhost:4173/"
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const errors = []
for (const theme of ["light", "dark"]) {
  for (const width of [390, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: width < 800 ? 2 : 1 })
    await ctx.addInitScript((t) => localStorage.setItem("ambati-theme", t), theme)
    const page = await ctx.newPage()
    page.on("console", (m) => m.type() === "error" && errors.push(`${theme}@${width}: ${m.text()}`))
    page.on("pageerror", (e) => errors.push(`${theme}@${width}: ${e.message}`))
    await page.goto(base, { waitUntil: "networkidle" })
    await page.evaluate(() => document.fonts.ready)
    // Scroll through once so lazy chunks (Lab, diagrams) load and count-ups run, then settle.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 150))
      }
      window.scrollTo(0, 0)
    })
    await page
      .waitForFunction(() => document.querySelectorAll(".react-flow").length >= 3, null, { timeout: 8000 })
      .catch(() => console.log(`  ! ${theme}@${width}: React Flow diagrams did not all mount`))
    await page.waitForTimeout(1800)
    const file = `${out}/${width}-${theme}.png`
    await page.screenshot({ path: file, fullPage: true })
    console.log("saved", file)
    await ctx.close()
  }
}

// No-flash + persistence: theme class must exist before any app JS runs, and survive reload.
const ctx = await browser.newContext({ colorScheme: "light" })
const page = await ctx.newPage()
await page.route("**/assets/*.js", (r) => r.abort()) // block the app bundle entirely
await page.goto(base)
await page.evaluate(() => localStorage.setItem("ambati-theme", "dark"))
await page.reload()
const preJs = await page.evaluate(() => document.documentElement.className)
console.log(`no-flash (app JS blocked, stored=dark, OS=light): <html class="${preJs}">`)
await page.unroute("**/assets/*.js")
await page.evaluate(() => localStorage.removeItem("ambati-theme"))
await page.reload({ waitUntil: "networkidle" })
console.log(`system mode, OS=light: <html class="${await page.evaluate(() => document.documentElement.className)}">`)
await page.getByRole("radio", { name: "Dark theme" }).click()
await page.reload({ waitUntil: "networkidle" })
const checked = await page.getByRole("radio", { checked: true }).getAttribute("aria-label")
console.log(`after picking Dark + reload: <html class="${await page.evaluate(() => document.documentElement.className)}">, lever = ${checked}`)
await page.getByRole("radio", { name: "Dark theme" }).focus()
await page.keyboard.press("ArrowLeft")
console.log(`keyboard ArrowLeft from Dark → lever = ${await page.getByRole("radio", { checked: true }).getAttribute("aria-label")}`)
await ctx.close()

await browser.close()
console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join("\n")}` : "console errors: 0")
