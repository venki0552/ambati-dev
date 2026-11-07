import { lazy, type ComponentType, type LazyExoticComponent } from "react"
import type { DemoId } from "@/content/content"

/**
 * Component side of the demo registry (src/lab/registry.ts holds the pure metadata + picking logic).
 * Adding a 4th demo = one new component file + one entry here + one entry in registry.ts.
 */
export type DemoProps = {
  /** "hero" renders the title as h2 (the hero has no section plate); "lab" would nest it as h3. */
  placement: "hero" | "lab"
}

export const demoComponents: Record<DemoId, LazyExoticComponent<ComponentType<DemoProps>>> = {
  "circuit-breaker": lazy(() => import("@/components/lab/CircuitBreakerDemo")),
  "oauth-jwt": lazy(() => import("@/components/lab/OAuthJwtDemo")),
  "token-bucket": lazy(() => import("@/components/lab/TokenBucketDemo")),
}

/** Reserved heights so swapping skeleton → demo causes no layout shift (CLS = 0). */
export const demoMinHeight: Record<DemoId, string> = {
  // Measured natural initial heights (scripts/measure.mjs): phone · ≥640 · hero column at 1024–1279
  "circuit-breaker": "min-h-[680px] sm:min-h-[530px]",
  "oauth-jwt": "min-h-[1210px] sm:min-h-[1015px] lg:min-h-[1125px] xl:min-h-[1015px]",
  "token-bucket": "min-h-[485px] sm:min-h-[470px]",
}
