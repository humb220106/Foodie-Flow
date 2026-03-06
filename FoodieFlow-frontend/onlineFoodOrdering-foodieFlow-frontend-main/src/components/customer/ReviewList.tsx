"use client"

import { useState } from "react"
import { Star, ThumbsUp, Loader2 } from "lucide-react"
import { ReviewResponse, ReviewSummary, customerService } from "@/lib/api/customer-service"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function getInitials(name: string) {
  if (!name) return "?"
  const p = name.trim().split(" ")
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase()
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 text-xs text-gray-400">{star}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-xs text-gray-400">{count}</span>
    </div>
  )
}

interface Props {
  reviews: ReviewResponse[]
  summary: ReviewSummary | null
  onLoadMore?: () => void
  loadingMore?: boolean
  hasMore?: boolean
}

export default function ReviewList({ reviews, summary, onLoadMore, loadingMore, hasMore }: Props) {
  const [helpful, setHelpful] = useState<Set<string>>(new Set())
  const [markingId, setMarkingId] = useState<string | null>(null)

  async function markHelpful(reviewId: string) {
    if (helpful.has(reviewId)) return
    try {
      setMarkingId(reviewId)
      await customerService.markReviewHelpful(reviewId)
      setHelpful(prev => new Set([...prev, reviewId]))
    } catch { /* non-fatal */ } finally { setMarkingId(null) }
  }

  return (
    <div className="space-y-4">
      {summary && summary.totalReviews > 0 && (
        <div className="flex items-center gap-6 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-center shrink-0">
            <p className="text-4xl font-black text-gray-900">{summary.averageRating.toFixed(1)}</p>
            <div className="mt-1 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3 w-3 ${i < Math.round(summary.averageRating) ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-400">{summary.totalReviews} total</p>
          </div>
          <div className="flex-1 space-y-1">
            <RatingBar star={5} count={summary.fiveStar  ?? summary.fiveStars  ?? 0} total={summary.totalReviews} />
            <RatingBar star={4} count={summary.fourStar  ?? summary.fourStars  ?? 0} total={summary.totalReviews} />
            <RatingBar star={3} count={summary.threeStar ?? summary.threeStars ?? 0} total={summary.totalReviews} />
            <RatingBar star={2} count={summary.twoStar   ?? summary.twoStars   ?? 0} total={summary.totalReviews} />
            <RatingBar star={1} count={summary.oneStar   ?? 0}                       total={summary.totalReviews} />
          </div>
        </div>
      )}

      {reviews.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-10 text-center">
          <Star className="h-10 w-10 text-gray-200" />
          <p className="mt-3 font-bold text-gray-400">No reviews yet</p>
          <p className="text-sm text-gray-400">Be the first to leave a review</p>
        </div>
      )}

      {reviews.map(review => {
        const displayName = review.authorUsername || review.authorName || "Customer"
        return (
          <div key={review.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-[#FF4D00] text-[11px] font-black text-white">
                  {getInitials(displayName)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{displayName}</p>
                  <p className="text-[10px] text-gray-400">{formatDate(review.createdAt)}</p>
                </div>
                {review.isVerifiedPurchase && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">✓ Verified</span>
                )}
              </div>
              <div className="flex gap-0.5 shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                ))}
              </div>
            </div>

            {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {review.images.map((img, i) => (
                  <img key={i} src={img} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                ))}
              </div>
            )}

            {review.restaurantReply && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <span className="font-bold">Restaurant replied: </span>{review.restaurantReply}
              </div>
            )}

            <button
              onClick={() => markHelpful(review.id)}
              disabled={helpful.has(review.id) || markingId === review.id}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                helpful.has(review.id) ? "text-emerald-600" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {markingId === review.id
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <ThumbsUp className="h-3 w-3" />
              }
              Helpful ({review.helpfulCount + (helpful.has(review.id) ? 1 : 0)})
            </button>
          </div>
        )
      })}

      {hasMore && (
        <button onClick={onLoadMore} disabled={loadingMore}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2">
          {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</> : "Load more reviews"}
        </button>
      )}
    </div>
  )
}