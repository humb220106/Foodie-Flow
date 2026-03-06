/**
 * Admin utility helpers
 * Shared across admin pages and components
 */

// ==================== JWT ====================

/**
 * Safely decode a JWT payload without verifying signature.
 * Returns null if the token is malformed.
 */
export function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

/** Extract the username from a stored access token */
export function getAdminUsernameFromToken(token: string | null): string {
  if (!token) return "Admin"
  const payload = parseJwt(token)
  return payload?.username || payload?.name || "Admin"
}

// ==================== FORMATTING ====================

/** Format a number as USD currency */
export function formatCurrency(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** Format a number with thousands separators */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

/** Format an ISO date string to a readable label */
export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string {
  return new Date(iso).toLocaleDateString("en-US", options)
}

/** Format an ISO date string to a readable time label */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Get initials from a name or username */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

// ==================== STATUS COLORS ====================

/** Tailwind classes for order status badges */
export function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    Delivered: "bg-emerald-100 text-emerald-700",
    Pending: "bg-orange-100 text-orange-700",
    Cancelled: "bg-red-100 text-red-700",
    Confirmed: "bg-blue-100 text-blue-700",
    Preparing: "bg-yellow-100 text-yellow-700",
    OutForDelivery: "bg-purple-100 text-purple-700",
  }
  return map[status] ?? "bg-gray-100 text-gray-700"
}

/** Tailwind classes for review status badges */
export function reviewStatusColor(status: string): string {
  const map: Record<string, string> = {
    Approved: "bg-emerald-100 text-emerald-700",
    Rejected: "bg-red-100 text-red-700",
    Pending: "bg-orange-100 text-orange-700",
  }
  return map[status] ?? "bg-gray-100 text-gray-700"
}

/** Tailwind classes for active/inactive badges */
export function activeStatusColor(isActive: boolean): string {
  return isActive
    ? "bg-emerald-100 text-emerald-700"
    : "bg-red-100 text-red-700"
}

/** Human-readable label for order status */
export function orderStatusLabel(status: string): string {
  if (status === "OutForDelivery") return "Out for Delivery"
  return status
}

// ==================== PAGINATION ====================

export interface PaginationMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

/** Returns an array of page numbers to display (with null gaps) */
export function buildPageRange(
  currentPage: number,
  totalPages: number,
  delta = 2
): (number | null)[] {
  const range: (number | null)[] = []
  const left = Math.max(2, currentPage - delta)
  const right = Math.min(totalPages - 1, currentPage + delta)

  range.push(1)
  if (left > 2) range.push(null)
  for (let i = left; i <= right; i++) range.push(i)
  if (right < totalPages - 1) range.push(null)
  if (totalPages > 1) range.push(totalPages)

  return range
}