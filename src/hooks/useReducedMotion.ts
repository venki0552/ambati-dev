import { useSyncExternalStore } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

/** true when the visitor asked for reduced motion (SPEC §2.4.7). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
