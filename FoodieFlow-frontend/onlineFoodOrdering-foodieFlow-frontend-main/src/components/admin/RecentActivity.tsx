"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface RecentActivityProps {
  activities: Array<{
    orderId: string
    customer: string
    customerAvatar?: string
    amount: number
    status: "Delivered" | "Pending" | "Cancelled"
    action: string
  }>
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-100 text-emerald-700"
      case "Pending":
        return "bg-orange-100 text-orange-700"
      case "Cancelled":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-black text-gray-900">Recent Activity</h2>
        <Link
          href="/admin/orders"
          className="text-sm font-bold text-[#FF4D00] hover:opacity-80"
        >
          View All Orders
        </Link>
      </div>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-3 text-left text-xs font-bold text-gray-600 uppercase">
                Order ID
              </th>
              <th className="pb-3 text-left text-xs font-bold text-gray-600 uppercase">
                Customer
              </th>
              <th className="pb-3 text-right text-xs font-bold text-gray-600 uppercase">
                Amount
              </th>
              <th className="pb-3 text-center text-xs font-bold text-gray-600 uppercase">
                Status
              </th>
              <th className="pb-3 text-center text-xs font-bold text-gray-600 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.orderId} className="group hover:bg-gray-50">
                <td className="py-4">
                  <span className="text-sm font-bold text-gray-900">
                    {activity.orderId}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white">
                      {activity.customerAvatar || getInitials(activity.customer)}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {activity.customer}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <span className="text-sm font-bold text-gray-900">
                    ${activity.amount.toFixed(2)}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex justify-center">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(
                        activity.status
                      )}`}
                    >
                      {activity.status}
                    </span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex justify-center">
                    <button className="text-gray-400 hover:text-[#FF4D00]">
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}