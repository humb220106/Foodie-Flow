"use client"

import { Plus, Minus, Trash2, UtensilsCrossed } from "lucide-react"
import { CartItem } from "@/lib/api/customer-service"

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

interface Props {
  items: CartItem[]
  onUpdateQty: (dishId: string, qty: number) => void
  onRemove: (dishId: string) => void
  readonly?: boolean
}

export default function CartItemsList({ items, onUpdateQty, onRemove, readonly = false }: Props) {
  if (items.length === 0) return null

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.dishId} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {/* Image */}
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-orange-50">
            {item.dishImage
              ? <img src={item.dishImage} alt={item.dishName} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center"><UtensilsCrossed className="h-5 w-5 text-orange-200" /></div>
            }
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 line-clamp-1">{item.dishName}</p>
            <p className="text-sm font-bold text-[#FF4D00]">{formatNGN(item.price)}</p>
            {item.specialInstructions && (
              <p className="text-xs text-gray-400 italic line-clamp-1">{item.specialInstructions}</p>
            )}
          </div>

          {/* Controls */}
          {readonly ? (
            <div className="shrink-0 text-right">
              <p className="text-sm font-black text-gray-900">{formatNGN(item.price * item.quantity)}</p>
              <p className="text-xs text-gray-400">× {item.quantity}</p>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                <button onClick={() => onUpdateQty(item.dishId, item.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-[#FF4D00] hover:text-[#FF4D00]">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[20px] text-center text-sm font-black">{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.dishId, item.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF4D00] text-white hover:opacity-90">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <button onClick={() => onRemove(item.dishId)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 hover:border-red-200 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}