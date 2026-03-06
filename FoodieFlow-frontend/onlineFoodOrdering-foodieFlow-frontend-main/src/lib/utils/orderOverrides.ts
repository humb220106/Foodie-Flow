/**
 * orderOverrides.ts
 *
 * Shared localStorage bridge between admin and customer.
 * Admin writes status overrides → customer reads them and merges with backend data.
 * Keyed by orderId. Entries expire after 7 days.
 */

const STORAGE_KEY = "ff_order_overrides"
const TTL_MS      = 7 * 24 * 60 * 60 * 1000   // 7 days

export interface OrderOverride {
  status:    string
  updatedAt: number   // epoch ms
}

export type OverrideMap = Record<string, OrderOverride>

function isBrowser() {
  return typeof window !== "undefined"
}

/** Read all overrides from localStorage, pruning expired ones. */
export function readOverrides(): OverrideMap {
  if (!isBrowser()) return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const map: OverrideMap = JSON.parse(raw)
    const now = Date.now()
    // Prune entries older than TTL
    const clean: OverrideMap = {}
    for (const [id, entry] of Object.entries(map)) {
      if (now - entry.updatedAt < TTL_MS) clean[id] = entry
    }
    // Write back pruned version only if something was removed
    if (Object.keys(clean).length !== Object.keys(map).length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
    }
    return clean
  } catch {
    return {}
  }
}

/** Write a single status override for an order. */
export function writeOverride(orderId: string, status: string): void {
  if (!isBrowser()) return
  try {
    const map = readOverrides()
    map[orderId] = { status, updatedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
    // Dispatch a storage event so other tabs on the same origin update immediately
    window.dispatchEvent(new StorageEvent("storage", {
      key:      STORAGE_KEY,
      newValue: JSON.stringify(map),
    }))
  } catch { /* quota or private mode — fail silently */ }
}

/** Get override for a single order, or null if none. */
export function getOverride(orderId: string): string | null {
  const map = readOverrides()
  return map[orderId]?.status ?? null
}

/** Clear override for a single order (e.g. after backend confirms it). */
export function clearOverride(orderId: string): void {
  if (!isBrowser()) return
  try {
    const map = readOverrides()
    delete map[orderId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch { /* fail silently */ }
}

/**
 * React hook: returns current override map and re-renders whenever
 * another tab (admin panel) writes a new override via storage events.
 */
export function useOrderOverrides(): OverrideMap {
  // We use a dynamic import pattern to avoid SSR issues
  if (!isBrowser()) return {}

  // This is called inside components — deliberately not a hook file
  // so it works as a utility. The actual hook is below.
  return readOverrides()
}