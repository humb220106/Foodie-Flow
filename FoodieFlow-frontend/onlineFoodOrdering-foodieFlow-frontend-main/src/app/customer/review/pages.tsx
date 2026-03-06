"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { customerService, OrderResponse } from "@/lib/api/customer-service"
import {
  Star, ChevronLeft, Loader2, CheckCircle,
  AlertCircle, Camera, X, UtensilsCrossed, Store,
} from "lucide-react"

// ─── Star picker ───────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star className={`h-9 w-9 transition-colors ${
            s <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"
          }`} />
        </button>
      ))}
    </div>
  )
}

const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"]

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function WriteReviewPage() {
  const router       = useRouter()
  const params       = useSearchParams()
  const orderId      = params.get("orderId") ?? ""

  const [order, setOrder]           = useState<OrderResponse | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [success, setSuccess]       = useState(false)

  // restaurant review state
  const [restRating, setRestRating] = useState(0)
  const [restComment, setRestComment] = useState("")
  const [restImages, setRestImages] = useState<File[]>([])
  const [restPreviews, setRestPreviews] = useState<string[]>([])

  // dish review states — one per dish
  const [dishRatings, setDishRatings]   = useState<Record<string, number>>({})
  const [dishComments, setDishComments] = useState<Record<string, string>>({})

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) { setError("No order specified."); setLoading(false); return }
    customerService.getOrderById(orderId)
      .then(o => { setOrder(o); setLoading(false) })
      .catch(e => { setError(e?.message || "Failed to load order"); setLoading(false) })
  }, [orderId])

  function addRestImages(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files).slice(0, 3 - restImages.length)
    setRestImages(prev => [...prev, ...arr])
    setRestPreviews(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))])
  }

  function removeRestImage(i: number) {
    setRestImages(prev => prev.filter((_, idx) => idx !== i))
    setRestPreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (!order) return
    if (restRating === 0) { setSubmitError("Please rate your overall experience."); return }

    setSubmitting(true)
    setSubmitError(null)

    try {
      // 1. Submit restaurant review
      await customerService.submitRestaurantReview(
        order.restaurantId,
        restRating,
        restComment,
        restImages.length > 0 ? restImages : undefined
      )

      // 2. Submit individual dish reviews (only if rated)
      const ratedDishes = order.items.filter(item => (dishRatings[item.dishId] ?? 0) > 0)
      await Promise.allSettled(
        ratedDishes.map(item =>
          customerService.submitDishReview(
            item.dishId,
            dishRatings[item.dishId],
            dishComments[item.dishId] || ""
          )
        )
      )

      setSuccess(true)
    } catch (e: any) {
      setSubmitError(e?.message || "Failed to submit review. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-xl font-black text-gray-900">Thank you!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your review has been submitted and will be visible after admin approval.
          </p>
          <Link
            href="/customer/orders"
            className="mt-6 block rounded-xl bg-[#FF4D00] py-3 text-sm font-bold text-white hover:opacity-90"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  // ── Loading / error ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF4D00]" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-3 font-bold text-gray-700">{error || "Order not found"}</p>
          <Link href="/customer/orders" className="mt-4 block text-sm font-bold text-[#FF4D00] hover:underline">
            ← Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const alreadyReviewed = order.rating !== null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link href="/customer/orders" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-base font-black text-gray-900">Write a Review</h1>
            <p className="text-xs text-gray-400">Order #{order.orderNumber}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 space-y-5">

        {alreadyReviewed && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            You've already reviewed this order. Submitting again will add a new review.
          </div>
        )}

        {submitError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {submitError}
          </div>
        )}

        {/* Restaurant overall review */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            {order.restaurantLogo ? (
              <img src={order.restaurantLogo} alt="" className="h-12 w-12 rounded-xl object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50">
                <Store className="h-6 w-6 text-orange-300" />
              </div>
            )}
            <div>
              <p className="font-black text-gray-900">{order.restaurantName}</p>
              <p className="text-xs text-gray-400">Overall experience</p>
            </div>
          </div>

          <div className="space-y-1">
            <StarPicker value={restRating} onChange={setRestRating} />
            {restRating > 0 && (
              <p className="text-sm font-bold text-[#FF4D00]">{LABELS[restRating]}</p>
            )}
          </div>

          <textarea
            value={restComment}
            onChange={e => setRestComment(e.target.value)}
            placeholder="Tell others about your experience — food quality, delivery speed, packaging…"
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4D00] focus:bg-white focus:outline-none"
          />

          {/* Image upload */}
          <div>
            <p className="mb-2 text-xs font-bold text-gray-500">Add photos (optional, max 3)</p>
            <div className="flex gap-2 flex-wrap">
              {restPreviews.map((src, i) => (
                <div key={i} className="relative h-16 w-16">
                  <img src={src} alt="" className="h-full w-full rounded-xl object-cover" />
                  <button
                    onClick={() => removeRestImage(i)}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {restImages.length < 3 && (
                <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#FF4D00] transition-colors">
                  <Camera className="h-5 w-5 text-gray-400" />
                  <input type="file" accept="image/*" multiple className="sr-only"
                    onChange={e => addRestImages(e.target.files)} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Per-dish reviews */}
        {order.items.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black text-gray-700 flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-[#FF4D00]" />
              Rate individual dishes (optional)
            </h2>

            {order.items.map(item => (
              <div key={item.dishId} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  {item.dishImage ? (
                    <img src={item.dishImage} alt="" className="h-10 w-10 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                      <UtensilsCrossed className="h-4 w-4 text-orange-200" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate text-sm">{item.dishName}</p>
                    <p className="text-xs text-gray-400">×{item.quantity}</p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button"
                      onClick={() => setDishRatings(prev => ({ ...prev, [item.dishId]: s }))}
                      className="transition-transform hover:scale-110">
                      <Star className={`h-7 w-7 transition-colors ${
                        s <= (dishRatings[item.dishId] ?? 0) ? "fill-yellow-400 text-yellow-400" : "fill-gray-100 text-gray-200"
                      }`} />
                    </button>
                  ))}
                </div>

                {(dishRatings[item.dishId] ?? 0) > 0 && (
                  <textarea
                    value={dishComments[item.dishId] ?? ""}
                    onChange={e => setDishComments(prev => ({ ...prev, [item.dishId]: e.target.value }))}
                    placeholder={`Comment on ${item.dishName}…`}
                    rows={2}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm placeholder-gray-400 focus:border-[#FF4D00] focus:bg-white focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || restRating === 0}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#FF4D00] py-4 text-base font-black text-white shadow-lg shadow-orange-500/25 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</> : "Submit Review"}
        </button>

        <p className="text-center text-xs text-gray-400 pb-6">
          Reviews are subject to admin approval before being published.
        </p>
      </main>
    </div>
  )
}