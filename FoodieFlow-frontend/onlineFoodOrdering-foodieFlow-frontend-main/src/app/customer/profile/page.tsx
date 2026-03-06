"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronRight, User, Mail, Phone, MapPin, Shield,
  Star, CheckCircle, XCircle, LogOut, Lock, Loader2,
  Utensils, Package, AlertCircle,
} from "lucide-react"
import { authService } from "@/lib/api/auth-service"
import { customerService } from "@/lib/api/customer-service"
import { clearTokens } from "@/lib/api/tokens"
import { useProfile } from "@/hooks/useCustomer"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="mt-0.5 text-[#FF4D00]">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="mt-0.5 text-sm font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  )
}

function ChangePasswordSection() {
  const [current, setCurrent]   = useState("")
  const [next, setNext]         = useState("")
  const [confirm, setConfirm]   = useState("")
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (next !== confirm) { setError("New passwords do not match."); return }
    if (next.length < 8)  { setError("Password must be at least 8 characters."); return }
    try {
      setLoading(true); setError(null)
      await authService.changePassword({ currentPassword: current, newPassword: next })
      setSuccess(true)
      setCurrent(""); setNext(""); setConfirm("")
    } catch (e: any) {
      setError(e?.message || "Failed to change password.")
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <CheckCircle className="h-4 w-4 shrink-0" /> Password changed successfully!
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {[
        { label: "Current password", value: current, onChange: setCurrent },
        { label: "New password",     value: next,    onChange: setNext    },
        { label: "Confirm new",      value: confirm, onChange: setConfirm },
      ].map(f => (
        <div key={f.label}>
          <label className="mb-1 block text-xs font-bold text-gray-500">{f.label}</label>
          <input
            type="password"
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-[#FF4D00]/20"
          />
        </div>
      ))}
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
      <button type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF4D00] py-3 font-black text-white hover:opacity-90 disabled:opacity-50">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : "Update Password"}
      </button>
    </form>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { profile, dishReviews, restaurantReviews, loading, error } = useProfile()
  const [tokenUser, setTokenUser] = useState<{ username: string; email: string } | null>(null)
  const [showPwSection, setShowPwSection] = useState(false)

  useEffect(() => {
    const u = customerService.parseUserFromToken()
    if (!u) { router.replace("/login"); return }
    setTokenUser(u)
  }, [router])

  function logout() { clearTokens(); router.push("/login") }

  const totalReviews = dishReviews.length + restaurantReviews.length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/customer/dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50">
              <ChevronRight className="h-4 w-4 rotate-180 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2 font-black text-gray-900">
              <User className="h-5 w-5 text-[#FF4D00]" /> My Profile
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-6 md:px-6 space-y-5">

        {/* Loading */}
        {loading && (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF4D00]" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Avatar card */}
        {(profile || tokenUser) && (
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-[#FF4D00] text-2xl font-black text-white shadow-lg shadow-orange-500/30">
              {(profile?.username ?? tokenUser?.username ?? "?")[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{profile?.username ?? tokenUser?.username}</h2>
              <p className="text-sm text-gray-500">{profile?.email ?? tokenUser?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                {profile?.roles.map(role => (
                  <span key={role} className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-black text-[#FF4D00]">
                    {role}
                  </span>
                ))}
                {profile?.emailVerified ? (
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    <XCircle className="h-3 w-3" /> Unverified
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/customer/orders" className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:border-[#FF4D00]/40 transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <Package className="h-5 w-5 text-[#FF4D00]" />
            </div>
            <p className="mt-2 text-sm font-black text-gray-900">My Orders</p>
            <p className="text-xs text-gray-400">View order history</p>
          </Link>
          <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50">
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="mt-2 text-sm font-black text-gray-900">{totalReviews} Reviews</p>
            <p className="text-xs text-gray-400">{dishReviews.length} dish · {restaurantReviews.length} restaurant</p>
          </div>
        </div>

        {/* Profile details */}
        {profile && (
          <div className="rounded-2xl border border-gray-200 bg-white px-5 shadow-sm">
            <h3 className="pt-4 pb-1 font-black text-gray-900">Account Details</h3>
            <InfoRow icon={<User className="h-4 w-4" />}    label="Username"   value={profile.username} />
            <InfoRow icon={<Mail className="h-4 w-4" />}    label="Email"      value={profile.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />}   label="Phone"      value={profile.phoneNumber || <span className="text-gray-400 italic">Not set</span>} />
            <InfoRow icon={<MapPin className="h-4 w-4" />}  label="Address"    value={profile.address || <span className="text-gray-400 italic">Not set</span>} />
            <InfoRow icon={<Shield className="h-4 w-4" />}  label="Member since" value={formatDate(profile.createdAt)} />
            {profile.lastLoginAt && (
              <InfoRow icon={<CheckCircle className="h-4 w-4" />} label="Last login" value={formatDate(profile.lastLoginAt)} />
            )}
          </div>
        )}

        {/* My reviews */}
        {totalReviews > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="font-black text-gray-900">My Reviews</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {[...dishReviews, ...restaurantReviews].slice(0, 5).map((r: any, i: number) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900">
                      {r.dishTitle || r.restaurantName || "Review"}
                    </p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-3 w-3 ${j < r.review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`} />
                      ))}
                    </div>
                  </div>
                  {r.review.comment && (
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">{r.review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change password */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowPwSection(v => !v)}
            className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                <Lock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-black text-gray-900">Change Password</p>
                <p className="text-xs text-gray-400">Update your account password</p>
              </div>
            </div>
            <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showPwSection ? "rotate-90" : ""}`} />
          </button>
          {showPwSection && (
            <div className="border-t border-gray-100 px-5 py-4">
              <ChangePasswordSection />
            </div>
          )}
        </div>

        {/* Sign out */}
        <button onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200 py-4 font-black text-red-600 hover:bg-red-50 transition-colors mb-8">
          <LogOut className="h-5 w-5" /> Sign Out
        </button>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white md:hidden">
        <div className="flex">
          {[
            { href: "/customer/dashboard", icon: <Utensils className="h-5 w-5" />, label: "Home",    active: false },
            { href: "/customer/orders",    icon: <Package className="h-5 w-5" />,  label: "Orders",  active: false },
            { href: "/customer/profile",   icon: <User className="h-5 w-5" />,     label: "Profile", active: true  },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold ${item.active ? "text-[#FF4D00]" : "text-gray-400"}`}>
              {item.icon}{item.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="h-16 md:hidden" />
    </div>
  )
}