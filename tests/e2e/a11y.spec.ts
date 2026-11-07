import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { scrollThrough } from "./helpers"

for (const theme of ["light", "dark"] as const) {
  for (const demo of ["circuit-breaker", "oauth-jwt", "token-bucket"]) {
    test(`axe: no WCAG 2.2 AA violations · ${theme} · hero=${demo}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("ambati-theme", t), theme)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(`/?demo=${demo}`)
      await scrollThrough(page)
      await page.waitForTimeout(800)
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze()
      const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help} → ${v.nodes[0]?.target.join(" ")}`)
      expect(summary).toEqual([])
    })
  }
}

test("keyboard: skip link and visible focus", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("Tab")
  const skip = page.getByRole("link", { name: "Skip to work" })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  const outline = await skip.evaluate((el) => getComputedStyle(el).outlineStyle)
  expect(outline).not.toBe("none")
})

test("reduced motion: final states, no running animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  const running = await page.evaluate(() =>
    document.getAnimations().filter((a) => a.playState === "running" && a.effect && (a.effect as KeyframeEffect).target).length,
  )
  expect(running).toBe(0)
  // Name is fully visible (no clip-path left mid-wipe), stats show final values.
  const clip = await page.locator("h1 span").first().evaluate((el) => getComputedStyle(el).clipPath)
  expect(clip === "none" || clip === "inset(0px)").toBeTruthy()
  await expect(page.getByText("~750K")).toBeVisible()
})
