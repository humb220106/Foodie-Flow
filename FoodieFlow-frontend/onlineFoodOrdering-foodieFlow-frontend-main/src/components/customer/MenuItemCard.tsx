// Menu item card
"use client"

import { useState } from "react"
import { Plus, Minus, UtensilsCrossed, Star } from "lucide-react"
import { DishResponse, cartService } from "@/lib/api/customer-service"

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

interface Props {
  dish: DishResponse
  onCartChange?: (count: number) => void
}

export default function MenuItemCard({ dish, onCartChange }: Props) {
  const existing  = cartService.get().find(c => c.dishId === dish.id)
  const [qty, setQty] = useState(existing?.quantity ?? 0)

  function add() {
    const ok = cartService.add({
      dishId: dish.id,
      dishName: dish.title,
      dishImage: dish.primaryImage,
      price: dish.price,
      quantity: 1,
      restaurantId: dish.restaurantId,
      restaurantName: dish.restaurantName,
    })
    if (ok) {
      setQty(cartService.get().find(c => c.dishId === dish.id)?.quantity ?? 1)
      onCartChange?.(cartService.count())
    }
  }

  function dec() {
    const newQty = qty - 1
    cartService.updateQty(dish.id, newQty)
    setQty(newQty < 0 ? 0 : newQty)
    onCartChange?.(cartService.count())
  }

  return (
    <div className={`flex items-start gap-4 rounded-2xl border p-4 transition-all ${
      dish.isAvailable
        ? "border-gray-200 bg-white hover:border-[#FF4D00]/30 hover:shadow-sm"
        : "border-gray-100 bg-gray-50 opacity-60"
    }`}>
      {/* Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-orange-50">
        {dish.primaryImage
          ? <img src={dish.primaryImage} alt={dish.title} className="h-full w-full object-cover" />
          : <div className="flex h-full w-full items-center justify-center"><UtensilsCrossed className="h-7 w-7 text-orange-200" /></div>
        }
        {dish.isFeatured && (
          <div className="absolute left-1 top-1 rounded bg-[#FF4D00] px-1 text-[9px] font-black text-white">★</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-900 leading-tight line-clamp-1">{dish.title}</p>
        {(dish.shortDescription || dish.description) && (
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{dish.shortDescription ?? dish.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className="font-black text-[#FF4D00]">{formatNGN(dish.price)}</span>
          {dish.averageRating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {dish.averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0">
        {dish.isAvailable ? (
          qty > 0 ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-[#FF4D00] bg-orange-50 px-2 py-1">
              <button onClick={dec} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF4D00] text-white">
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[16px] text-center text-sm font-black text-[#FF4D00]">{qty}</span>
              <button onClick={add} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF4D00] text-white">
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button onClick={add}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FF4D00] text-white shadow-md shadow-orange-500/25 hover:opacity-90">
              <Plus className="h-4 w-4" />
            </button>
          )
        ) : (
          <span className="rounded-lg border border-gray-200 px-2 py-1 text-[10px] font-bold text-gray-400">N/A</span>
        )}
      </div>
    </div>
  )
}