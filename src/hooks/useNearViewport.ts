import { useEffect, useState, type RefObject } from "react"

/** Becomes true (once) when the element comes within `margin` of the viewport. Used to lazy-load below-the-fold chunks. */
export function useNearViewport(ref: RefObject<Element | null>, margin = "600px", threshold = 0): boolean {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || near) return
    if (!("IntersectionObserver" in window)) {
      setNear(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: margin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin, threshold, near])
  return near
}
