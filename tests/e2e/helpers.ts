import type { Page } from "@playwright/test"

/** Scroll through the page so lazy chunks (Lab demos, React Flow) load, then return to top. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
      window.scrollTo(0, y)
      await wait(150)
    }
    // Make sure every lazy slot was actually seen (fast scrolls can skip IntersectionObserver).
    for (const el of document.querySelectorAll("#lab, figure")) {
      el.scrollIntoView({ block: "center" })
      await wait(250)
    }
    window.scrollTo(0, 0)
  })
}

export function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text())
  })
  page.on("pageerror", (e) => errors.push(e.message))
  return errors
}
