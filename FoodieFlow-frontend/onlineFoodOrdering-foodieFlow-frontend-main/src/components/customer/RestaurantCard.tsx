// Restaurant card
import Link from "next/link"
import { Star, UtensilsCrossed } from "lucide-react"
import type { RestaurantResponse } from "@/lib/api/customer-service"

interface Props {
  restaurant: RestaurantResponse
  /** Optional — show compact row layout instead of card grid */
  compact?: boolean
}

export default function RestaurantCard({ restaurant: r, compact = false }: Props) {
  if (compact) {
    return (
      <Link href={`/customer/restaurant/${r.id}`}
        className="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#FF4D00]/40 hover:shadow-md transition-all">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-orange-50">
          {r.restaurantLogo
            ? <img src={r.restaurantLogo} alt={r.restaurantName} className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center"><UtensilsCrossed className="h-6 w-6 text-orange-200" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 group-hover:text-[#FF4D00] transition-colors truncate">{r.restaurantName}</h3>
          {r.restaurantDescription && (
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{r.restaurantDescription}</p>
          )}
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <Star className={`h-3 w-3 ${r.averageRating > 0 ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
            <span className="font-semibold">{r.averageRating > 0 ? r.averageRating.toFixed(1) : "New"}</span>
            <span>· {r.totalReviews} review{r.totalReviews !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/customer/restaurant/${r.id}`}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-[#FF4D00]/40 transition-all overflow-hidden">
      {/* Banner */}
      <div className="relative h-44 bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
        {r.restaurantBanner
          ? <img src={r.restaurantBanner} alt={r.restaurantName} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="flex h-full items-center justify-center"><UtensilsCrossed className="h-16 w-16 text-orange-200" /></div>
        }
        {r.restaurantLogo && (
          <img src={r.restaurantLogo} alt="" className="absolute bottom-3 left-3 h-12 w-12 rounded-xl border-2 border-white object-cover shadow-md" />
        )}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-bold shadow-sm">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {r.averageRating > 0 ? r.averageRating.toFixed(1) : "New"}
        </div>
      </div>
      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-black text-gray-900 group-hover:text-[#FF4D00] transition-colors line-clamp-1">{r.restaurantName}</h3>
        {r.restaurantDescription && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{r.restaurantDescription}</p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{r.totalReviews} review{r.totalReviews !== 1 ? "s" : ""}</span>
          <span className="font-semibold text-[#FF4D00]">View menu →</span>
        </div>
      </div>
    </Link>
  )
}