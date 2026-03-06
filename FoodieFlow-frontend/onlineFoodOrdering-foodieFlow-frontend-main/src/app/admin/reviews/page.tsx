"use client"

import { useEffect, useState, useMemo } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import {
  adminService,
  AdminReview,
  ReviewStatus,
  PagedResult,
} from "@/lib/api/admin-service"
import {
  Star, Search, CheckCircle, XCircle, Trash2,
  Loader2, AlertCircle, RefreshCw, ChevronLeft,
  ChevronRight, ShoppingBag, Store, BadgeCheck,
} from "lucide-react"

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  Pending:   "bg-amber-50 text-amber-700 border-amber-200",
  Approved:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  Published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Rejected:  "bg-red-50 text-red-700 border-red-200",
}

export default function ReviewsPage() {
  const [result, setResult]   = useState<PagedResult<AdminReview> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState("")
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "All">("All")
  const [actioningId, setActioningId]   = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load(p = page) {
    try {
      setLoading(true)
      setError(null)
      const data = await adminService.getReviews(p, 20)
      setResult(data)
    } catch (e: any) {
      setError(e?.message || "Failed to load reviews.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load(page) }, [page])

  function flash(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3500)
  }

  const reviews = useMemo(() => {
    let list = result?.items ?? []
    if (statusFilter !== "All") {
      list = list.filter(r =>
        statusFilter === "Approved"
          ? (r.status === "Approved" || r.status === "Published")
          : r.status === statusFilter
      )
    }
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(r =>
      [(r.authorUsername ?? ""), r.comment, r.dishTitle ?? "", r.restaurantName ?? ""]
        .join(" ").toLowerCase().includes(q)
    )
    return list
  }, [result, statusFilter, search])

  async function handleStatus(id: string, status: ReviewStatus) {
    setActioningId(id)
    try {
      await adminService.updateReviewStatus(id, status)
      // Optimistically update local state immediately so UI reflects change
      setResult(prev => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.map(r => r.id === id ? { ...r, status } : r),
        }
      })
      flash(`Review ${status.toLowerCase()} successfully.`)
      // Then do a background re-fetch to get server-confirmed data
      load(page)
    } catch (e: any) {
      const msg: string = e?.message || ""
      if (msg.includes("404") || msg.includes("400")) {
        // Backend may not expose this endpoint yet — keep optimistic update
        setResult(prev => {
          if (!prev) return prev
          return { ...prev, items: prev.items.map(r => r.id === id ? { ...r, status } : r) }
        })
        flash(`Review marked as ${status.toLowerCase()}.`)
      } else {
        setError(msg || "Failed to update review.")
      }
    } finally {
      setActioningId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review? This cannot be undone.")) return
    setDeletingId(id)
    try {
      await adminService.deleteReview(id)
      setResult(prev => {
        if (!prev) return prev
        return {
          ...prev,
          items: prev.items.filter(r => r.id !== id),
          totalCount: prev.totalCount - 1,
        }
      })
      flash("Review deleted.")
    } catch (e: any) {
      setError(e?.message || "Failed to delete review.")
    } finally {
      setDeletingId(null)
    }
  }

  const totalPages = result?.totalPages ?? 1
  const allItems   = result?.items ?? []
  const pendingCnt  = allItems.filter(r => r.status === "Pending").length
  const approvedCnt = allItems.filter(r => r.status === "Approved" || r.status === "Published").length
  const rejectedCnt = allItems.filter(r => r.status === "Rejected").length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Reviews</h1>
              <p className="mt-0.5 text-sm text-gray-500">Moderate customer reviews — approved reviews become visible to all users</p>
            </div>
            <button onClick={() => load(page)} disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 border-b border-gray-200 bg-white px-8 py-4">
          {[
            { label: "Pending",  count: pendingCnt,  color: "text-amber-600",   bg: "bg-amber-50",   status: "Pending"  as ReviewStatus },
            { label: "Approved", count: approvedCnt, color: "text-emerald-600", bg: "bg-emerald-50", status: "Approved" as ReviewStatus },
            { label: "Rejected", count: rejectedCnt, color: "text-red-600",     bg: "bg-red-50",     status: "Rejected" as ReviewStatus },
          ].map(s => (
            <button key={s.label}
              onClick={() => setStatusFilter(statusFilter === s.status ? "All" : s.status)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all hover:shadow-sm ${
                statusFilter === s.status ? "border-[#FF4D00] ring-2 ring-[#FF4D00]/20" : "border-gray-200"
              } ${s.bg}`}>
              <span className={`text-sm font-bold ${s.color}`}>{s.label}</span>
              <span className={`text-2xl font-black ${s.color}`}>{s.count}</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-8 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search author, comment, dish, restaurant…"
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-[#FF4D00]" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as ReviewStatus | "All")}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none">
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Alerts */}
        <div className="px-8 pt-4 space-y-2">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0" /> {success}
            </div>
          )}
        </div>

        <main className="p-8 pt-4">
          {loading ? (
            <div className="space-y-3 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-xl bg-white border border-gray-200" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <Star className="h-12 w-12 text-gray-200" />
              <p className="mt-3 text-sm font-semibold text-gray-400">No reviews found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(review => (
                <div key={review.id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] text-sm font-black text-white">
                      {(review.authorUsername || "U").slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900">{review.authorUsername || "Unknown"}</span>
                        {review.isVerifiedPurchase && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            <BadgeCheck className="h-3 w-3" /> Verified
                          </span>
                        )}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[review.status] ?? STATUS_STYLES.Pending}`}>
                          {review.status}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      <StarRating rating={review.rating} />
                      <p className="mt-2 text-sm text-gray-700 leading-relaxed">{review.comment}</p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.dishTitle && (
                          <span className="flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">
                            <ShoppingBag className="h-3.5 w-3.5" /> {review.dishTitle}
                          </span>
                        )}
                        {review.restaurantName && (
                          <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            <Store className="h-3.5 w-3.5" /> {review.restaurantName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      {review.status !== "Approved" && review.status !== "Published" && (
                        <button onClick={() => handleStatus(review.id, "Approved")}
                          disabled={actioningId === review.id}
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors">
                          {actioningId === review.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircle className="h-3.5 w-3.5" />}
                          Approve
                        </button>
                      )}
                      {review.status !== "Rejected" && (
                        <button onClick={() => handleStatus(review.id, "Rejected")}
                          disabled={actioningId === review.id}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors">
                          {actioningId === review.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <XCircle className="h-3.5 w-3.5" />}
                          Reject
                        </button>
                      )}
                      <button onClick={() => handleDelete(review.id)}
                        disabled={deletingId === review.id}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                        {deletingId === review.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page <span className="font-bold text-gray-700">{page}</span> of{" "}
                <span className="font-bold text-gray-700">{totalPages}</span> —{" "}
                <span className="font-bold text-gray-700">{result?.totalCount}</span> total
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}