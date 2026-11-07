/**
 * Toasts without putting Sonner in the initial bundle: the <Toaster> is mounted lazily
 * (see LazyToaster) and `toast` is imported on first use.
 */
export async function notify(kind: "success" | "error", title: string, description?: string) {
  const { toast } = await import("sonner")
  toast[kind](title, description ? { description } : undefined)
}
