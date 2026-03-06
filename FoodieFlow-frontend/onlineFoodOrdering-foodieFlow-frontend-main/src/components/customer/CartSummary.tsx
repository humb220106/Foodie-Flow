import { ArrowRight } from "lucide-react"
import Link from "next/link"

function formatNGN(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n)
}

interface Props {
  subtotal: number
  deliveryFee?: number
  serviceFee?: number
  tax?: number
  discount?: number
  showCheckoutButton?: boolean
  checkoutHref?: string
  label?: string
}

export default function CartSummary({
  subtotal,
  deliveryFee = 0,
  serviceFee = 0,
  tax = 0,
  discount = 0,
  showCheckoutButton = true,
  checkoutHref = "/customer/checkout",
  label = "Proceed to Checkout",
}: Props) {
  const total = subtotal + deliveryFee + serviceFee + tax - discount

  const rows = [
    { label: "Subtotal",     value: subtotal,    show: true },
    { label: "Delivery fee", value: deliveryFee, show: deliveryFee > 0 },
    { label: "Service fee",  value: serviceFee,  show: serviceFee  > 0 },
    { label: "Tax",          value: tax,         show: tax > 0 },
    { label: "Discount",     value: -discount,   show: discount > 0 },
  ].filter(r => r.show)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
      <h3 className="font-black text-gray-900 mb-3">Order Summary</h3>
      {rows.map(row => (
        <div key={row.label} className="flex justify-between text-sm text-gray-600">
          <span>{row.label}</span>
          <span className={row.value < 0 ? "font-semibold text-emerald-600" : "font-bold text-gray-900"}>
            {formatNGN(Math.abs(row.value))}{row.value < 0 ? " off" : ""}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 text-lg">
        <span>Total</span>
        <span className="text-[#FF4D00]">{formatNGN(total)}</span>
      </div>
      {showCheckoutButton && subtotal > 0 && (
        <Link href={checkoutHref}
          className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#FF4D00] px-5 py-4 font-black text-white shadow-lg shadow-orange-500/25 hover:opacity-95 transition-opacity">
          <span>{label}</span>
          <ArrowRight className="h-5 w-5" />
        </Link>
      )}
    </div>
  )
}
