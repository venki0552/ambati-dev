import { test } from "@playwright/test"
import { scrollThrough } from "./helpers"

/** SPEC §9: all 8 width × theme combinations. Output: screenshots/final/<width>-<theme>.png */
for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 768, 1024, 1440]) {
    test(`screenshot ${width} ${theme}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: width < 800 ? 2 : 1 })
      await ctx.addInitScript((t) => localStorage.setItem("ambati-theme", t), theme)
      const page = await ctx.newPage()
      await page.goto("/?demo=circuit-breaker")
      await page.evaluate(() => document.fonts.ready)
      await scrollThrough(page)
      await page.waitForFunction(() => document.querySelectorAll(".react-flow").length >= 3, null, { timeout: 10_000 })
      await page.waitForTimeout(1500)
      await page.screenshot({ path: `screenshots/final/${width}-${theme}.png`, fullPage: true })
      await ctx.close()
    })
  }
}
