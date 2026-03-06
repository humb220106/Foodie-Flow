"use client"

import { Server, Users, Zap, Gift, AlertTriangle } from "lucide-react"

interface SystemHealthProps {
  health: {
    serverStatus: number
    activeCouriers: number
    maxCouriers: number
    apiLatency: number
    activePromotions: number
    unresolvedTickets: number
  }
}

export default function SystemHealth({ health }: SystemHealthProps) {
  const getLatencyColor = (latency: number) => {
    if (latency < 100) return "text-emerald-600"
    if (latency < 200) return "text-orange-600"
    return "text-red-600"
  }

  const getLatencyBg = (latency: number) => {
    if (latency < 100) return "bg-emerald-100"
    if (latency < 200) return "bg-orange-100"
    return "bg-red-100"
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-black text-gray-900">System Health</h2>

      <div className="space-y-5">
        {/* Server Status */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-gray-700">
                Server Status
              </span>
            </div>
            <span className="text-sm font-bold text-emerald-600">
              {health.serverStatus}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-emerald-600"
              style={{ width: `${health.serverStatus}%` }}
            />
          </div>
        </div>

        {/* Active Couriers */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-semibold text-gray-700">
                Active Couriers
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900">
              {health.activeCouriers} / {health.maxCouriers}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-[#FF4D00]"
              style={{
                width: `${(health.activeCouriers / health.maxCouriers) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* API Latency */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${getLatencyColor(health.apiLatency)}`} />
              <span className="text-sm font-semibold text-gray-700">
                API Latency
              </span>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${getLatencyBg(
                health.apiLatency
              )} ${getLatencyColor(health.apiLatency)}`}
            >
              {health.apiLatency}ms
            </span>
          </div>
        </div>

        {/* Active Promotions */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-semibold text-gray-700">
                Active Promotions
              </span>
            </div>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-600">
              {health.activePromotions} Active
            </span>
          </div>
        </div>

        {/* Unresolved Tickets */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-gray-700">
                Unresolved Tickets
              </span>
            </div>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">
              {health.unresolvedTickets} Open
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}