"use client"

import { useEffect, useState, useMemo } from "react"
import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
import { restaurantService } from "@/lib/api/restaurant-service"
import { customerService, ReviewResponse, ReviewSummary } from "@/lib/api/customer-service"
import {
  Star, RefreshCw, Loader2, AlertCircle, ThumbsUp,
  MessageSquare, Filter,
} from "lucide-react"

function getInitials(name: string) {
  if (!name) return "?"
  const p = name.trim().split(" ")
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
      ))}
    </div>
  )
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-gray-400 text-right">{star}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-yellow-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-gray-400">{count}</span>
    </div>
  )
}

export default function RestaurantReviewsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [reviews, setReviews]           = useState<ReviewResponse[]>([])
  const [summary, setSummary]           = useState<ReviewSummary | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [filter, setFilter]             = useState<"All" | "5" | "4" | "3" | "2" | "1">("All")

  useEffect(() => { void init() }, [])

  async function init() {
    try {
      setLoading(true)
      setError(null)
      const me = await restaurantService.getMyRestaurant()
      if (!me) { setError("Restaurant profile not found."); return }
      setRestaurantId(me.id)
      const res = await customerService.getRestaurantReviews(me.id, 1, 100)
      // API returns items as { restaurantId, restaurantName, review }
      const rawReviews = (res?.items ?? []).map((i: any) => i.review ?? i) as ReviewResponse[]
      setReviews(rawReviews)
      setSummary(res?.summary ?? null)
    } catch (e: any) {
      setError(e?.message || "Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (filter === "All") return reviews
    return reviews.filter(r => r.rating === Number(filter))
  }, [reviews, filter])

  const avgRating = summary?.averageRating ?? 0
  const total     = summary?.totalReviews ?? reviews.length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900">Customer Reviews</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {total} review{total !== 1 ? "s" : ""} — visible to customers after admin approval
              </p>
            </div>
            <button onClick={init} disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        <main className="p-8 space-y-6">
          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" /> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading reviews…
            </div>
          ) : (
            <>
              {/* Summary card */}
              {total > 0 && summary && (
                <div className="flex items-center gap-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-center shrink-0">
                    <p className="text-5xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
                    <div className="mt-2 flex justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{total} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <RatingBar star={5} count={summary.fiveStar  ?? summary.fiveStars  ?? 0} total={total} />
                    <RatingBar star={4} count={summary.fourStar  ?? summary.fourStars  ?? 0} total={total} />
                    <RatingBar star={3} count={summary.threeStar ?? summary.threeStars ?? 0} total={total} />
                    <RatingBar star={2} count={summary.twoStar   ?? summary.twoStars   ?? 0} total={total} />
                    <RatingBar star={1} count={summary.oneStar   ?? 0}                       total={total} />
                  </div>
                </div>
              )}

              {/* Star filter */}
              {total > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-gray-400" />
                  {(["All", "5", "4", "3", "2", "1"] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
                        filter === f
                          ? "border-[#FF4D00] bg-[#FF4D00] text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}>
                      {f !== "All" && <Star className="h-3 w-3 fill-current" />}
                      {f}
                    </button>
                  ))}
                  <span className="ml-1 text-xs text-gray-400">{filtered.length} shown</span>
                </div>
              )}

              {/* Reviews */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
                  <Star className="h-14 w-14 text-gray-200" />
                  <p className="mt-4 font-semibold text-gray-400">No reviews yet</p>
                  <p className="mt-1 text-sm text-gray-300">Customer reviews will appear here once approved by admin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map(review => {
                    const name = review.authorUsername || review.authorName || "Customer"
                    return (
                      <div key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-[#FF4D00] text-sm font-black text-white">
                              {getInitials(name)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{name}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            {review.isVerifiedPurchase && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">✓ Verified</span>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <StarRow rating={review.rating} />
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              review.status === "Published" || review.status === "Approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : review.status === "Pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-600"
                            }`}>
                              {review.status}
                            </span>
                          </div>
                        </div>

                        {review.comment && (
                          <p className="mt-3 text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                        )}

                        {review.images && review.images.length > 0 && (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {review.images.map((img, i) => (
                              <img key={i} src={img} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                            ))}
                          </div>
                        )}

                        {review.helpfulCount > 0 && (
                          <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                            <ThumbsUp className="h-3 w-3" />
                            {review.helpfulCount} found this helpful
                          </div>
                        )}

                        {review.restaurantReply && (
                          <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Your reply: </span>
                              {review.restaurantReply}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}