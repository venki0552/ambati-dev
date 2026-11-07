import { lazy, Suspense, useEffect, useState } from "react"

const Toaster = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })))

/** Mounts the Sonner toaster once the browser is idle, so it never competes with first paint. */
export function LazyToaster() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200))
    const id = ric(() => setReady(true))
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id)
  }, [])
  return ready ? (
    <Suspense fallback={null}>
      <Toaster />
    </Suspense>
  ) : null
}
