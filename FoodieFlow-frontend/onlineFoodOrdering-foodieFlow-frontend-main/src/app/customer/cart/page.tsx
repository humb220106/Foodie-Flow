"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, ShoppingCart, Trash2, Plus, Minus,
  Utensils, UtensilsCrossed, ArrowRight, Package, User,
  AlertCircle,
} from "lucide-react"
import { cartService, CartItem, customerService } from "@/lib/api/customer-service"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(n)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const u = customerService.parseUserFromToken()
    if (!u) { router.replace("/login"); return }
    setItems(cartService.get())
    setMounted(true)
  }, [router])

  function refresh() {
    setItems(cartService.get())
  }

  function updateQty(dishId: string, qty: number) {
    cartService.updateQty(dishId, qty)
    refresh()
  }

  function remove(dishId: string) {
    cartService.remove(dishId)
    refresh()
  }

  function clear() {
    if (!confirm("Clear your entire cart?")) return
    cartService.clear()
    refresh()
  }

  const subtotal    = items.reduce((s, c) => s + c.price * c.quantity, 0)
  const deliveryFee = subtotal > 0 ? 500 : 0
  const total       = subtotal + deliveryFee
  const totalItems  = items.reduce((s, c) => s + c.quantity, 0)
  const restaurant  = items[0]
    ? { id: items[0].restaurantId, name: items[0].restaurantName }
    : null

  // Don't render until hydrated (avoids localStorage SSR mismatch)
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#FF4D00]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 font-black text-gray-900">
              <ShoppingCart className="h-5 w-5 text-[#FF4D00]" />
              My Cart
              {totalItems > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FF4D00] text-[10px] font-black text-white">
                  {totalItems}
                </span>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-500 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear cart
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-6 md:px-6 space-y-5">

        {/* ── Empty state ── */}
        {items.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50 mb-4">
              <ShoppingCart className="h-9 w-9 text-orange-200" />
            </div>
            <p className="text-xl font-black text-gray-400">Your cart is empty</p>
            <p className="mt-1 text-sm text-gray-400">Add some dishes to get started!</p>
            <Link
              href="/customer/dashboard"
              className="mt-6 flex items-center gap-2 rounded-xl bg-[#FF4D00] px-6 py-3 font-black text-white hover:opacity-90 shadow-lg shadow-orange-500/25"
            >
              <Utensils className="h-4 w-4" /> Browse restaurants
            </Link>
          </div>
        )}

        {/* ── Cart has items ── */}
        {items.length > 0 && (
          <>
            {/* From restaurant */}
            {restaurant && (
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                    <Utensils className="h-4 w-4 text-[#FF4D00]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400">Ordering from</p>
                    <p className="text-sm font-black text-gray-900">{restaurant.name}</p>
                  </div>
                </div>
                <Link
                  href={`/customer/restaurant/${restaurant.id}`}
                  className="rounded-xl border border-[#FF4D00]/30 bg-orange-50 px-3 py-1.5 text-xs font-black text-[#FF4D00] hover:bg-orange-100 transition-colors"
                >
                  + Add more
                </Link>
              </div>
            )}

            {/* Items list */}
            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.dishId}
                  className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-orange-200 transition-colors"
                >
                  {/* Image */}
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-orange-50">
                    {item.dishImage ? (
                      <img src={item.dishImage} alt={item.dishName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <UtensilsCrossed className="h-6 w-6 text-orange-200" />
                      </div>
                    )}
                  </div>

                  {/* Name + price */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-900 leading-tight line-clamp-1 text-[15px]">
                      {item.dishName}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#FF4D00]">{formatNGN(item.price)}</p>
                    <p className="mt-0.5 text-xs text-gray-400 font-semibold">
                      {formatNGN(item.price * item.quantity)} total
                    </p>
                  </div>

                  {/* Qty + delete */}
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1">
                      <button
                        onClick={() => updateQty(item.dishId, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600 hover:border-[#FF4D00] hover:text-[#FF4D00] transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[20px] text-center text-sm font-black text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.dishId, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF4D00] text-white hover:opacity-90 transition-opacity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => remove(item.dishId)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-400 hover:border-red-300 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
              <h3 className="font-black text-gray-900 text-base">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                  <span className="font-bold text-gray-900">{formatNGN(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery fee (estimate)</span>
                  <span className="font-bold text-gray-900">{formatNGN(deliveryFee)}</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 text-lg">
                <span>Estimated Total</span>
                <span className="text-[#FF4D00]">{formatNGN(total)}</span>
              </div>
              <p className="text-xs text-gray-400">Final total is confirmed at checkout</p>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => router.push("/customer/checkout")}
              className="flex w-full items-center justify-between rounded-2xl bg-[#FF4D00] px-6 py-4 font-black text-white shadow-xl shadow-orange-500/25 hover:opacity-95 active:scale-[0.98] active:shadow-md transition-all"
            >
              <span className="text-lg">Proceed to Checkout</span>
              <ArrowRight className="h-5 w-5" />
            </button>

            {/* Alert if mixed restaurant (shouldn't happen but safety) */}
            {new Set(items.map(i => i.restaurantId)).size > 1 && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Your cart has items from multiple restaurants. Only one restaurant is allowed per order.
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
        <div className="flex">
          {[
            { href: "/customer/dashboard", icon: <Utensils className="h-5 w-5" />,    label: "Home"    },
            { href: "/customer/orders",    icon: <Package className="h-5 w-5" />,      label: "Orders"  },
            { href: "/customer/cart",      icon: <ShoppingCart className="h-5 w-5" />, label: "Cart", active: true },
            { href: "/customer/profile",   icon: <User className="h-5 w-5" />,         label: "Profile" },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold transition-colors ${
                "active" in item && item.active ? "text-[#FF4D00]" : "text-gray-400 hover:text-[#FF4D00]"
              }`}
            >
              {item.icon}{item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}