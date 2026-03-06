"use client"

import { useEffect, useState, useMemo } from "react"
import AdminSidebar from "@/components/layout/AdminSidebar"
import { adminService, AuditLog, PagedResult } from "@/lib/api/admin-service"
import {
  Search, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, XCircle, Shield,
  Clock, Wifi, User,
} from "lucide-react"

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

/** Colour-code the action verb */
function ActionBadge({ action }: { action: string }) {
  const a = action.toLowerCase()
  const style =
    a.includes("delete") || a.includes("remove") ? "bg-red-50 text-red-700 border-red-200" :
    a.includes("create") || a.includes("add")    ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    a.includes("update") || a.includes("edit") || a.includes("change") ? "bg-blue-50 text-blue-700 border-blue-200" :
    a.includes("login") || a.includes("auth")    ? "bg-purple-50 text-purple-700 border-purple-200" :
    "bg-gray-50 text-gray-600 border-gray-200"

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${style}`}>
      {action}
    </span>
  )
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [result, setResult]   = useState<PagedResult<AuditLog> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState("")
  const [successFilter, setSuccessFilter] = useState<"all" | "success" | "failed">("all")
  const [error, setError]     = useState<string | null>(null)

  async function load(p = page) {
    try {
      setLoading(true)
      setError(null)
      const data = await adminService.getAuditLogs(p, 50)
      setResult(data)
    } catch (e: any) {
      setError(e?.message || "Failed to load audit logs.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load(page) }, [page])

  const logs = useMemo(() => {
    let list = result?.items ?? []
    if (successFilter === "success") list = list.filter(l => l.isSuccess)
    if (successFilter === "failed")  list = list.filter(l => !l.isSuccess)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(l =>
      [l.action, l.details, l.username ?? "", l.ipAddress].join(" ").toLowerCase().includes(q)
    )
    return list
  }, [result, successFilter, search])

  const totalPages = result?.totalPages ?? 1
  const allLogs    = result?.items ?? []
  const successCnt = allLogs.filter(l => l.isSuccess).length
  const failedCnt  = allLogs.filter(l => !l.isSuccess).length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>

        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Audit Logs</h1>
              <p className="mt-0.5 text-sm text-gray-500">
                Full record of all admin actions — create, update, delete, login events
              </p>
            </div>
            <button
              onClick={() => load(page)}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </header>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 border-b border-gray-200 bg-white px-8 py-4">
          {[
            { label: "Total",    count: allLogs.length,  color: "text-gray-700",    bg: "bg-gray-50",    key: "all" },
            { label: "Success",  count: successCnt,      color: "text-emerald-600", bg: "bg-emerald-50", key: "success" },
            { label: "Failed",   count: failedCnt,       color: "text-red-600",     bg: "bg-red-50",     key: "failed" },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSuccessFilter(s.key as "all" | "success" | "failed")}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all hover:shadow-sm ${
                successFilter === s.key ? "border-[#FF4D00] ring-2 ring-[#FF4D00]/20" : "border-gray-200"
              } ${s.bg}`}
            >
              <span className={`text-sm font-bold ${s.color}`}>{s.label}</span>
              <span className={`text-2xl font-black ${s.color}`}>{s.count}</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-8 py-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search action, details, user, IP address…"
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-[#FF4D00]"
            />
          </div>
          <p className="text-xs text-gray-400 ml-auto">
            Showing <span className="font-bold text-gray-600">{logs.length}</span> of{" "}
            <span className="font-bold text-gray-600">{result?.totalCount ?? 0}</span> entries
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-8 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Logs table */}
        <main className="p-8 pt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-white border border-gray-200" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
              <Shield className="h-12 w-12 text-gray-200" />
              <p className="mt-3 text-sm font-semibold text-gray-400">No audit logs found.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Table header */}
              <div className="grid border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-bold uppercase text-gray-500"
                style={{ gridTemplateColumns: "1fr 2fr 1.5fr 1fr auto" }}>
                <span>Action</span>
                <span>Details</span>
                <span>User</span>
                <span>IP Address</span>
                <span>Time</span>
              </div>

              {/* Rows */}
              {logs.map((log, i) => (
                <div
                  key={log.id}
                  className={`grid items-start gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 ${
                    i < logs.length - 1 ? "border-b border-gray-100" : ""
                  } ${!log.isSuccess ? "bg-red-50/30" : ""}`}
                  style={{ gridTemplateColumns: "1fr 2fr 1.5fr 1fr auto" }}
                >
                  {/* Action */}
                  <div className="flex items-center gap-2">
                    {log.isSuccess
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      : <XCircle      className="h-4 w-4 shrink-0 text-red-500" />}
                    <ActionBadge action={log.action} />
                  </div>

                  {/* Details */}
                  <p className="text-sm text-gray-700 leading-snug line-clamp-2">
                    {log.details || <span className="text-gray-300">—</span>}
                  </p>

                  {/* User */}
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="truncate text-sm font-semibold text-gray-700">
                      {log.username ?? <span className="text-gray-400 font-normal">System</span>}
                    </span>
                  </div>

                  {/* IP */}
                  <div className="flex items-center gap-1.5">
                    <Wifi className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="font-mono text-xs text-gray-500">{log.ipAddress || "—"}</span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">
                <p className="text-xs text-gray-400">
                  <span className="font-bold text-gray-600">{result?.totalCount}</span> total log entries
                </p>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page <span className="font-bold text-gray-700">{page}</span> of{" "}
                <span className="font-bold text-gray-700">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}