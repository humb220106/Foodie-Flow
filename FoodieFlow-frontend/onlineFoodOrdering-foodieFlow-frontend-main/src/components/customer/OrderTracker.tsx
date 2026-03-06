import { useRouter } from "next/navigation"
import { Package, CheckCircle, Clock, MapPin, Star } from "lucide-react"
import type { OrderStatus } from "@/lib/api/customer-service"

const STEPS: { statuses: OrderStatus[]; label: string; icon: React.ReactNode }[] = [
  { statuses: ["Pending"],               label: "Order placed", icon: <Package className="h-4 w-4" /> },
  { statuses: ["Accepted"],              label: "Accepted",     icon: <CheckCircle className="h-4 w-4" /> },
  { statuses: ["Preparing"],             label: "Preparing",    icon: <Clock className="h-4 w-4" /> },
  { statuses: ["Ready"],                 label: "Ready",        icon: <CheckCircle className="h-4 w-4" /> },
  { statuses: ["PickedUp", "OnTheWay"],  label: "On the way",   icon: <MapPin className="h-4 w-4" /> },
  { statuses: ["Delivered","Completed"], label: "Delivered",    icon: <CheckCircle className="h-4 w-4" /> },
]

function getStepIndex(status: OrderStatus) {
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (STEPS[i].statuses.includes(status)) return i
  }
  return 0
}

interface Props {
  status: OrderStatus
  orderId: string
  hasReviewed?: boolean   // pass true if order.rating !== null
}

export default function OrderTracker({ status, orderId, hasReviewed = false }: Props) {
  const router = useRouter()

  const isDelivered = status === "Delivered" || status === "Completed"
  const isCancelled = status === "Cancelled" || status === "Rejected"

  if (isCancelled) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-red-200 bg-red-50 py-4 text-sm font-bold text-red-700">
        Order {status.toLowerCase()}
      </div>
    )
  }

  const currentStep = getStepIndex(status)

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="relative flex items-center justify-between">
        {/* Track line */}
        <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-gray-100" />
        <div
          className="absolute left-0 top-3.5 h-0.5 bg-[#FF4D00] transition-all duration-500"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, i) => {
          const done    = i < currentStep
          const current = i === currentStep
          return (
            <div key={i} className="relative flex flex-col items-center gap-1 z-10">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${
                done    ? "border-[#FF4D00] bg-[#FF4D00] text-white"
                : current ? "border-[#FF4D00] bg-white text-[#FF4D00]"
                : "border-gray-200 bg-white text-gray-300"
              }`}>
                {step.icon}
              </div>
              <span className={`text-[9px] font-bold text-center leading-tight max-w-[52px] ${
                done || current ? "text-gray-700" : "text-gray-300"
              }`}>{step.label}</span>
            </div>
          )
        })}
      </div>

      {/* Leave a review CTA — shown only after delivery */}
      {isDelivered && (
        <button
          onClick={() => router.push(`/customer/review?orderId=${orderId}`)}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-[0.98] ${
            hasReviewed
              ? "border border-gray-200 bg-gray-50 text-gray-400"
              : "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm shadow-orange-200 hover:opacity-90"
          }`}
        >
          <Star className={`h-4 w-4 ${hasReviewed ? "" : "fill-white"}`} />
          {hasReviewed ? "Review submitted ✓" : "Leave a Review"}
        </button>
      )}
    </div>
  )
}