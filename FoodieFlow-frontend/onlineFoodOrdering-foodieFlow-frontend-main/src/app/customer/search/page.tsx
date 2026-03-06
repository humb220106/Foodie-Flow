// Page placeholder
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight, CheckCircle, Loader2, MapPin, Phone,
  MessageSquare, UtensilsCrossed, ArrowRight, ShoppingCart,
} from "lucide-react"
import { cartService, CartItem, customerService, CreateOrderRequest } from "@/lib/api/customer-service"
import { useCheckout } from "@/hooks/useCustomer"

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-colors focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20 ${className}`}
    />
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { placing, paying, error, orderId, placeAndPay } = useCheckout()

  const [items, setItems] = useState<CartItem[]>([])
  const [done, setDone]   = useState(false)
  const [orderNum, setOrderNum] = useState("")

  // Delivery form
  const [phone, setPhone]                 = useState("")
  const [address, setAddress]             = useState("")
  const [city, setCity]                   = useState("")
  const [state, setState]                 = useState("")
  const [instructions, setInstructions]   = useState("")
  const [notes, setNotes]                 = useState("")
  const [validationErr, setValidationErr] = useState<string | null>(null)

  useEffect(() => {
    const u = customerService.parseUserFromToken()
    if (!u) { router.replace("/login"); return }

    const cart = cartService.get()
    if (cart.length === 0) { router.replace("/customer/cart"); return }
    setItems(cart)

    // pre-fill phone from JWT
    setPhone(u.id ? "" : "")   // phone not in JWT — user fills in
  }, [router])

  const subtotal    = items.reduce((s, c) => s + c.price * c.quantity, 0)
  const restaurant  = items[0]
  const isLoading   = placing || paying

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationErr(null)

    if (!phone.trim())   { setValidationErr("Phone number is required."); return }
    if (!address.trim()) { setValidationErr("Delivery address is required."); return }
    if (!city.trim())    { setValidationErr("City is required."); return }

    const req: CreateOrderRequest = {
      restaurantId: restaurant.restaurantId,
      items: items.map(c => ({ dishId: c.dishId, quantity: c.quantity, specialInstructions: c.specialInstructions })),
      deliveryAddress: address,
      deliveryCity: city,
      deliveryState: state,
      deliveryInstructions: instructions || undefined,
      customerPhone: phone,
      customerNotes: notes || undefined,
    }

    const success = await placeAndPay(req)
    if (success) {
      // orderId is set inside hook; read orderNumber from cart context
      setDone(true)
    }
  }

  // ── Success screen ────────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <div className="w-full max-w-sm">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 mx-auto">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="mt-6 text-2xl font-black text-gray-900">Order placed!</h1>
          <p className="mt-2 text-sm text-gray-500">
            Your order has been placed and payment confirmed. The restaurant is preparing your food.
          </p>
          {orderId && (
            <Link href={`/customer/orders/${orderId}`}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF4D00] py-4 font-black text-white shadow-xl shadow-orange-500/30 hover:opacity-90">
              Track my order <ArrowRight className="h-5 w-5" />
            </Link>
          )}
          <Link href="/customer/orders"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 font-bold text-gray-600 hover:bg-gray-50">
            View all orders
          </Link>
        </div>
      </div>
    )
  }

  // ── Checkout form ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4 md:px-6">
          <Link href="/customer/cart" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50">
            <ChevronRight className="h-4 w-4 rotate-180 text-gray-600" />
          </Link>
          <span className="font-black text-gray-900">Checkout</span>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <main className="container mx-auto max-w-lg px-4 py-6 md:px-6 space-y-5">

          {/* Order summary */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-black text-gray-900">Order from {restaurant?.restaurantName}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {items.map(item => (
                <div key={item.dishId} className="flex items-center gap-3 px-5 py-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-orange-50">
                    {item.dishImage
                      ? <img src={item.dishImage} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><UtensilsCrossed className="h-4 w-4 text-orange-200" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.dishName}</p>
                    <p className="text-xs text-gray-400">{item.quantity} × {formatNGN(item.price)}</p>
                  </div>
                  <p className="text-sm font-black text-gray-900 shrink-0">{formatNGN(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 px-5 py-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span className="font-bold">{formatNGN(subtotal)}</span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>Delivery & service fees calculated at server</span>
              </div>
            </div>
          </div>

          {/* Delivery details */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#FF4D00]" /> Delivery Details
            </h3>

            <Field label="Phone number *">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  required
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
                />
              </div>
            </Field>

            <Field label="Street address *">
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="12 Victoria Island Street" required />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City *">
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Lagos" required />
              </Field>
              <Field label="State">
                <Input value={state} onChange={e => setState(e.target.value)} placeholder="Lagos State" />
              </Field>
            </div>

            <Field label="Delivery instructions">
              <textarea
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="E.g. Ring the bell, leave at the gate…"
                rows={2}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20 resize-none"
              />
            </Field>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-black text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#FF4D00]" /> Order Notes (optional)
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special requests for the restaurant…"
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20 resize-none"
            />
          </div>

          {/* Payment note */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm text-blue-700">
            <p className="font-bold">Payment</p>
            <p className="mt-1 text-xs">This is a demo system using instant payment confirmation. No real payment is processed.</p>
          </div>

          {/* Errors */}
          {(validationErr || error) && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
              {validationErr || error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={isLoading}
            className="flex w-full items-center justify-between rounded-2xl bg-[#FF4D00] px-6 py-4 font-black text-white shadow-xl shadow-orange-500/30 hover:opacity-95 disabled:opacity-60 transition-opacity">
            <span className="text-lg">
              {placing ? "Placing order…" : paying ? "Confirming payment…" : `Place Order · ${formatNGN(subtotal)}`}
            </span>
            {isLoading
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <ArrowRight className="h-5 w-5" />
            }
          </button>

          <p className="text-center text-xs text-gray-400 pb-6">
            By placing this order you agree to our Terms of Service
          </p>
        </main>
      </form>
    </div>
  )
}