"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft, MapPin, Phone, FileText, Loader2,
  CheckCircle, ShoppingCart, UtensilsCrossed, Package,
  ArrowRight, Utensils, AlertCircle, User,
} from "lucide-react"
import {
  cartService, CartItem, customerService,
  CreateOrderRequest,
} from "@/lib/api/customer-service"
import { useCheckout } from "@/hooks/useCustomer"

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN", maximumFractionDigits: 0,
  }).format(n)
}

// ── Input Field ───────────────────────────────────────────────────────────────

function Field({
  label, icon, required, error, children,
}: {
  label: string
  icon: React.ReactNode
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-black text-gray-600 uppercase tracking-wide">
        <span className="text-[#FF4D00]">{icon}</span>
        {label}
        {required && <span className="text-[#FF4D00]">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs font-semibold text-red-500">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
}

const inputCls =
  "h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-800 placeholder:text-gray-300 outline-none transition-all focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/15 disabled:bg-gray-50 disabled:text-gray-400"

// ── Success Screen ────────────────────────────────────────────────────────────

function SuccessScreen({
  orderNumber, orderId,
}: { orderNumber: string; orderId: string }) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      {/* Animated checkmark ring */}
      <div className="relative mb-6">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-14 w-14 text-emerald-500" />
        </div>
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-100 opacity-30" />
      </div>

      <h1 className="text-3xl font-black text-gray-900">Order Placed!</h1>
      <p className="mt-2 text-sm text-gray-500 max-w-xs">
        Your order has been received and payment confirmed. The restaurant is being notified.
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Order Number</p>
        <p className="mt-1 text-2xl font-black text-emerald-700">#{orderNumber}</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => router.push(`/customer/orders/${orderId}`)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FF4D00] py-4 font-black text-white shadow-lg shadow-orange-400/30 hover:opacity-90 transition-opacity"
        >
          <Package className="h-5 w-5" /> Track My Order
        </button>
        <Link
          href="/customer/dashboard"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-4 font-black text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Utensils className="h-5 w-5" /> Back to Home
        </Link>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const { placing, paying, error: checkoutError, orderId, orderNumber, placeAndPay } = useCheckout()

  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)
  const [done, setDone] = useState(false)

  // Form fields
  const [address, setAddress]       = useState("")
  const [city, setCity]             = useState("")
  const [state, setState]           = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [phone, setPhone]           = useState("")
  const [instructions, setInstructions] = useState("")
  const [notes, setNotes]           = useState("")

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const u = customerService.parseUserFromToken()
    if (!u) { router.replace("/login"); return }
    const cartItems = cartService.get()
    if (cartItems.length === 0) { router.replace("/customer/cart"); return }
    setItems(cartItems)
    setMounted(true)
  }, [router])

  const subtotal    = items.reduce((s, c) => s + c.price * c.quantity, 0)
  const deliveryFee = 500
  const total       = subtotal + deliveryFee
  const totalItems  = items.reduce((s, c) => s + c.quantity, 0)
  const restaurant  = items[0] ?? null

  const isLoading = placing || paying

  function validate() {
    const e: Record<string, string> = {}
    if (!address.trim())  e.address = "Delivery address is required"
    if (!city.trim())     e.city    = "City is required"
    if (!phone.trim())    e.phone   = "Phone number is required"
    else if (!/^[\d\s\+\-\(\)]{7,15}$/.test(phone.trim())) e.phone = "Enter a valid phone number"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handlePlaceOrder() {
    if (!validate()) return
    if (!restaurant) return

    const req: CreateOrderRequest = {
      restaurantId:        restaurant.restaurantId,
      items:               items.map(i => ({ dishId: i.dishId, quantity: i.quantity, specialInstructions: i.specialInstructions })),
      deliveryAddress:     address.trim(),
      deliveryCity:        city.trim(),
      deliveryState:       state.trim() || undefined,
      deliveryPostalCode:  postalCode.trim() || undefined,
      deliveryInstructions: instructions.trim() || undefined,
      customerPhone:       phone.trim(),
      customerNotes:       notes.trim() || undefined,
    }

    const success = await placeAndPay(req)
    if (success) setDone(true)
  }

  // ── States ────────────────────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#FF4D00]" />
      </div>
    )
  }

  if (done && orderId && orderNumber) {
    return <SuccessScreen orderId={orderId} orderNumber={orderNumber} />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4 md:px-6">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h1 className="font-black text-gray-900 leading-tight">Checkout</h1>
            <p className="text-xs text-gray-400">{totalItems} item{totalItems !== 1 ? "s" : ""} · {restaurant?.restaurantName}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-lg px-4 py-6 md:px-6 space-y-5">

        {/* ── Order Items Summary ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
            <h2 className="font-black text-gray-900 text-sm">Your Order</h2>
            <Link
              href="/customer/cart"
              className="text-xs font-bold text-[#FF4D00] hover:opacity-80"
            >
              Edit cart
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <div key={item.dishId} className="flex items-center gap-3 px-5 py-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-orange-50">
                  {item.dishImage
                    ? <img src={item.dishImage} alt={item.dishName} className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center"><UtensilsCrossed className="h-4 w-4 text-orange-200" /></div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 line-clamp-1">{item.dishName}</p>
                  <p className="text-xs text-gray-400">{formatNGN(item.price)} × {item.quantity}</p>
                </div>
                <p className="text-sm font-black text-[#FF4D00] shrink-0">{formatNGN(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          {/* Totals */}
          <div className="border-t border-gray-100 px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-bold text-gray-900">{formatNGN(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery fee</span>
              <span className="font-bold text-gray-900">{formatNGN(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-black text-gray-900 text-base pt-1 border-t border-gray-100">
              <span>Total</span>
              <span className="text-[#FF4D00]">{formatNGN(total)}</span>
            </div>
          </div>
        </div>

        {/* ── Delivery Details ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-5 py-3.5">
            <h2 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#FF4D00]" /> Delivery Details
            </h2>
          </div>
          <div className="px-5 py-5 space-y-4">

            <Field label="Street Address" icon={<MapPin className="h-3.5 w-3.5" />} required error={errors.address}>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                value={address}
                onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: "" })) }}
                disabled={isLoading}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="City" icon={<MapPin className="h-3.5 w-3.5" />} required error={errors.city}>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Lagos"
                  value={city}
                  onChange={e => { setCity(e.target.value); setErrors(p => ({ ...p, city: "" })) }}
                  disabled={isLoading}
                />
              </Field>
              <Field label="State" icon={<MapPin className="h-3.5 w-3.5" />}>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Lagos State"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  disabled={isLoading}
                />
              </Field>
            </div>

            <Field label="Phone Number" icon={<Phone className="h-3.5 w-3.5" />} required error={errors.phone}>
              <input
                type="tel"
                className={inputCls}
                placeholder="+234 800 000 0000"
                value={phone}
                onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: "" })) }}
                disabled={isLoading}
              />
            </Field>

            <Field label="Delivery Instructions" icon={<FileText className="h-3.5 w-3.5" />}>
              <input
                type="text"
                className={inputCls}
                placeholder="e.g. Gate code is 1234, call on arrival"
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                disabled={isLoading}
              />
            </Field>

            <Field label="Order Notes" icon={<FileText className="h-3.5 w-3.5" />}>
              <textarea
                className={`${inputCls} h-20 resize-none py-3`}
                placeholder="Any special requests for the restaurant?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={isLoading}
              />
            </Field>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {checkoutError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-red-700">Order failed</p>
              <p className="text-xs text-red-600 mt-0.5">{checkoutError}</p>
            </div>
          </div>
        )}

        {/* ── Place Order Button ── */}
        <button
          onClick={handlePlaceOrder}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FF4D00] py-4 font-black text-white shadow-xl shadow-orange-500/25 transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {placing ? "Placing order…" : "Processing payment…"}
            </>
          ) : (
            <>
              Place Order · {formatNGN(total)}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          By placing this order you agree to our terms of service
        </p>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
        <div className="flex">
          {[
            { href: "/customer/dashboard", icon: <Utensils className="h-5 w-5" />,    label: "Home"    },
            { href: "/customer/orders",    icon: <Package className="h-5 w-5" />,      label: "Orders"  },
            { href: "/customer/cart",      icon: <ShoppingCart className="h-5 w-5" />, label: "Cart"    },
            { href: "/customer/profile",   icon: <User className="h-5 w-5" />,         label: "Profile" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold text-gray-400 hover:text-[#FF4D00] transition-colors">
              {item.icon}{item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}