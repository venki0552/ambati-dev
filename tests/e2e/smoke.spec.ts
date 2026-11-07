import { expect, test } from "@playwright/test"
import { collectErrors, scrollThrough } from "./helpers"

test("loads with zero console errors and all sections", async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Venkata")
  for (const id of ["top", "lab", "work", "projects", "writing", "stack", "about", "contact"]) {
    await expect(page.locator(`#${id}`)).toBeAttached()
  }
  await scrollThrough(page)
  await expect(page.locator(".react-flow")).toHaveCount(3, { timeout: 10_000 })
  expect(errors).toEqual([])
})

// Client banks appear on the résumé only, never on the site (CLAUDE.md, content.ts).
// The names themselves must not be in this public repo either, so the guard stores SHA-256 hashes
// of the lowercased names / short phrases and checks every 1–3 word phrase on the page against them.
const CLIENT_NAME_HASHES = new Set([
  "c3a9b82d44e16c34a3cf9b9cbddd17a5608900a4dddee809bbcf38d4491cf438",
  "c12b736ab81f4580cf04f39c9cbe21c25efb90689625ec915f7a3b7cc68ccc2b",
  "175d374a1e9f8545f79f430abdd122afec28d8e81c008cd2a86d201e38382ff6",
  "b68dd000c329f90cb39f2496dc4e778ec919fad8b3249afc8a68a74fbad876d3",
  "bfd0490dab10c2b63758119c67aa22c8bd5f48505c40bd97c69bf88ca3657b05",
  "195f33b50fa62ef2bd3d89227ecc1219419e3b907579718541f22cd1b1f1f5e4",
  "3e1f060ec02403ad93d1eae40a7a7c6ca77dfdfd62f7ccddb2b6cfee6e704938",
  "e2bf09e6557e8cfebaf062d9c5a1fa616851aba3b122948259e684583227bf61",
  "9d70ee1464c5683606df019ae23fea9ad55b605243e986efe3ea47207e5da751",
  "c7d704999f1c30b010c53db0b30e388c7ba750cd3c40c26f54b7c55819ed2d66",
  "f511e34dd80f8ec959796cc3e391f27ece59d0501989c347e440b2bb375fdb7d",
  "487cbfa2bda73a16d9dc831625c5917e535f9bf8fef385e4809c318eb07d675d",
  "ae12ab27803adf3cdb4a7b7f438598e7f9be6e7b845be51cc7463c2c14f350e7",
  "1249ab46e28cf7948cbbb7161f49d8cf49c4819f53456717b8a3cdb1f9c624cb",
  "2f2122fe3a1b998f52b2f17ae9aa6ea017d9edea8c889b46c5dead192b0e7e46",
  "10551657fc04f7315b487ee566b2f7cee6a1eaab30906d571b4a18ca26ec7bd5",
  "2c1b5cd25f491e5d14423c43e9e8ca293616dbc6d9b41c917d700a408aee83d7",
  "7dbc1e12e822c32b78796aaa94ea62eac5061e28e4d4f40e424aaa37bf7abb26",
  "dff1bb75e6fe2484dbe3baa8339243aeb59ebe540de8bafe8bcc02810c060dc9",
  "fe24f4c5d07705d7f9173f20900d0a019a598baad39fc7102dc4314bb6d642ce",
])

async function clientNameHits(html: string): Promise<number> {
  const words = html.toLowerCase().match(/[a-z0-9]+/g) ?? []
  const phrases = new Set<string>()
  for (let i = 0; i < words.length; i++)
    for (let n = 1; n <= 3 && i + n <= words.length; n++) phrases.add(words.slice(i, i + n).join(" "))
  let hits = 0
  for (const p of phrases) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(p))
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
    if (CLIENT_NAME_HASHES.has(hex)) hits++
  }
  return hits
}

test("no client names anywhere on the page (text, attributes, metadata)", async ({ page }) => {
  for (const demo of ["circuit-breaker", "oauth-jwt", "token-bucket"]) {
    await page.goto(`/?demo=${demo}`)
    await scrollThrough(page)
    expect(await clientNameHits(await page.content())).toBe(0)
  }
})

test("theme switch persists across reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/")
  await expect(page.locator("html")).toHaveClass(/light/)
  await page.getByRole("radio", { name: "Dark theme" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(page.getByRole("radio", { name: "Dark theme" })).toHaveAttribute("aria-checked", "true")
})

test.describe("hero demo rotation (SPEC §4.0)", () => {
  for (const id of ["circuit-breaker", "oauth-jwt", "token-bucket"]) {
    test(`?demo=${id} overrides the pick`, async ({ page }) => {
      await page.goto(`/?demo=${id}`)
      await expect(page.getByTestId("hero-demo")).toHaveAttribute("data-demo", id)
    })
  }

  test("random pick sticks for the visit and varies across visits", async ({ browser }) => {
    const seen = new Set<string>()
    for (let i = 0; i < 12; i++) {
      const ctx = await browser.newContext()
      const page = await ctx.newPage()
      await page.goto("/")
      const first = await page.getByTestId("hero-demo").getAttribute("data-demo")
      await page.reload()
      await expect(page.getByTestId("hero-demo")).toHaveAttribute("data-demo", first ?? "")
      seen.add(first ?? "")
      await ctx.close()
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  test("Try another cycles and the hero shows where I use it", async ({ page }) => {
    await page.goto("/?demo=circuit-breaker")
    const hero = page.getByTestId("hero-demo")
    await expect(hero).toContainText("WHERE I USE THIS")
    await page.getByRole("button", { name: /Try another demo/ }).click()
    await expect(hero).toHaveAttribute("data-demo", "oauth-jwt")
    await expect(hero).toContainText("Secure sign-in for banking apps")
  })
})

test("circuit breaker: CLOSED → OPEN → HALF-OPEN → CLOSED", async ({ page }) => {
  await page.goto("/?demo=circuit-breaker")
  const demo = page.getByTestId("hero-demo")
  await expect(demo.getByRole("status", { name: "Breaker state" })).toContainText("CLOSED")
  const slider = demo.getByRole("slider", { name: /failure rate/i })
  await slider.focus()
  await page.keyboard.press("End") // 100% failures
  for (let i = 0; i < 3; i++) {
    await demo.getByRole("button", { name: "Send request" }).click()
    await page.waitForTimeout(700)
  }
  await expect(demo).toContainText(/breaker OPEN/i)
  await expect(demo.getByTestId("breaker-mode")).toHaveText("OPEN")
  await demo.getByRole("button", { name: "Send request" }).click()
  await expect(demo).toContainText("503 · fallback served")
  await expect(demo.getByTestId("breaker-mode")).toHaveText("HALF-OPEN", { timeout: 8000 })
  await slider.focus()
  await page.keyboard.press("Home") // 0% failures
  await demo.getByRole("button", { name: "Send request" }).click()
  await expect(demo.getByTestId("breaker-mode")).toHaveText("CLOSED", { timeout: 3000 })
})

test("token bucket: Burst ×10 → 5 pass, 5 × 429, then refills", async ({ page }) => {
  await page.goto("/?demo=token-bucket")
  const demo = page.getByTestId("hero-demo")
  await demo.getByRole("button", { name: "Burst ×10" }).click()
  await expect(demo).toContainText("5 × 200, 5 × 429")
  await expect(demo.getByRole("img", { name: /0 of 5 tokens/ })).toBeVisible()
  await expect(demo.getByRole("img", { name: /1 of 5 tokens/ })).toBeVisible({ timeout: 3000 })
})

test("oauth + pkce → jwt: 200 → 401 tampered → 401 expired → refresh → 200; stolen code → 400", async ({ page }) => {
  await page.goto("/?demo=oauth-jwt")
  const demo = page.getByTestId("hero-demo")
  await demo.getByRole("button", { name: "Play all" }).click()
  const status = demo.getByTestId("api-status")
  await expect(status).toContainText("200", { timeout: 10_000 })
  await expect(demo).toContainText(/code_challenge/)

  await demo.getByRole("button", { name: /Tamper/ }).click()
  await demo.getByRole("button", { name: "Call API" }).click()
  await expect(status).toContainText("401")
  await expect(status).toContainText("invalid_signature")

  await demo.getByRole("button", { name: /Tamper/ }).click() // restore
  await demo.getByRole("button", { name: "Fast-forward 15 min" }).click()
  await demo.getByRole("button", { name: "Call API" }).click()
  await expect(status).toContainText("token_expired")

  await demo.getByRole("button", { name: "Use refresh token" }).click()
  await demo.getByRole("button", { name: "Call API" }).click()
  await expect(status).toContainText("200")

  await demo.getByRole("button", { name: "Replay stolen code" }).click()
  await expect(status).toContainText("400")
  await expect(status).toContainText("invalid_grant")
})

test("config playground: edit config, screen rebuilds, 0 deploys", async ({ page }) => {
  await page.goto("/")
  await page.locator("#lab").scrollIntoViewIfNeeded()
  const lab = page.getByTestId("config-lab")
  const screen = lab.getByRole("form", { name: /Sample bank A: About you/ })
  await expect(screen.getByLabel("Mobile phone")).toBeVisible()

  await lab.getByRole("checkbox", { name: "Show Mobile phone" }).uncheck()
  await expect(screen.getByLabel("Mobile phone")).toHaveCount(0)
  await expect(lab).toContainText("1 CONFIG CHANGE")
  await expect(lab).toContainText('Hid "Mobile phone" · screen rebuilt, 0 deploys')

  await lab.getByRole("button", { name: "Move Email up" }).click()
  await expect(lab).toContainText('Moved "Email" up')

  await lab.getByRole("button", { name: "SAMPLE BANK B" }).click()
  await expect(lab.getByRole("form", { name: /Sample bank B: Applicant/ })).toBeVisible()
  await lab.getByRole("button", { name: "Continue →" }).click()
  await expect(lab.getByRole("form", { name: /Sample bank B: Products/ })).toBeVisible()
})

test("résumé downloads and every external link resolves", async ({ page, request }) => {
  await page.goto("/")
  const pdf = await request.get("/Venkata_Reddy_Ambati_Resume.pdf")
  expect(pdf.status()).toBe(200)
  expect(pdf.headers()["content-type"]).toContain("pdf")

  const hrefs = await page.$$eval('a[href^="http"]', (as) => [...new Set(as.map((a) => (a as HTMLAnchorElement).href))])
  expect(hrefs.length).toBeGreaterThan(10)
  const failures: string[] = []
  for (const href of hrefs) {
    const res = await request.get(href, { maxRedirects: 5, timeout: 20_000, failOnStatusCode: false }).catch(() => null)
    const status = res?.status() ?? 0
    // LinkedIn answers unauthenticated clients with 999/404 and Medium sometimes with 403: bot walls,
    // not broken links. They are recorded as annotations and must be checked by hand.
    const botWall = href.includes("linkedin.com") || (href.includes("medium.com") && status === 403)
    if (botWall) test.info().annotations.push({ type: "bot-wall", description: `${status} ${href}` })
    else if (status !== 200) failures.push(`${status} ${href}`)
  }
  expect(failures).toEqual([])
})
