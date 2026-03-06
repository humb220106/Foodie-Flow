// Page placeholder
"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Utensils,
} from "lucide-react"
import { authService } from "@/lib/api/auth-service"

function passwordStrength(pw: string) {
  const v = pw.trim()
  if (!v) return { label: "", pct: 0, color: "bg-gray-200", textColor: "text-gray-400" }

  const score =
    (v.length >= 8 ? 25 : 0) +
    (/[A-Z]/.test(v) ? 20 : 0) +
    (/[a-z]/.test(v) ? 20 : 0) +
    (/\d/.test(v) ? 20 : 0) +
    (/[^A-Za-z0-9]/.test(v) ? 15 : 0)

  const pct = Math.min(100, score)
  let label = ""
  let color = "bg-red-500"
  let textColor = "text-red-600"

  if (pct >= 80) {
    label = "STRONG"
    color = "bg-emerald-500"
    textColor = "text-emerald-600"
  } else if (pct >= 50) {
    label = "MEDIUM"
    color = "bg-orange-500"
    textColor = "text-orange-600"
  } else {
    label = "WEAK"
    color = "bg-red-500"
    textColor = "text-red-600"
  }

  return { label, pct, color, textColor }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const strength = useMemo(() => passwordStrength(newPassword), [newPassword])
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword

  const canSubmit = useMemo(() => {
    return (
      newPassword.trim().length >= 8 &&
      confirmPassword === newPassword &&
      !isLoading &&
      !!token
    )
  }, [newPassword, confirmPassword, isLoading, token])

  useEffect(() => {
    if (!token) {
      setErrorMsg("Invalid or missing reset token. Please request a new password reset link.")
    }
  }, [token])


async function onSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  if (!token) {
    setErrorMsg("Invalid reset token. Please request a new password reset link.")
    return
  }

  setErrorMsg(null)
  setSuccessMsg(null)
  setIsLoading(true)

  try {
    // ✅ FIXED: Pass object with token and newPassword
    const response = await authService.resetPassword({
      token: token,
      newPassword: newPassword
    })
    
    setSuccessMsg(
      response.message || 
      "Password reset successful! Redirecting to login..."
    )
    
    // Clear form
    setNewPassword("")
    setConfirmPassword("")
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      router.push("/login")
    }, 2000)
  } catch (error: any) {
    console.error("Reset password error:", error)
    setErrorMsg(
      error.message || 
      "Failed to reset password. The token may have expired. Please request a new reset link."
    )
  } finally {
    setIsLoading(false)
  }
}

  return (
    <main className="min-h-screen bg-[#faf7f4]">
      {/* Top bar */}
      <header className="border-b border-orange-100/60 bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-black text-gray-900">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg">
              <Utensils className="h-7 w-7 text-white" />
            </div>
            <span>
              Foodie<span className="text-[#FF4D00]">Flow</span>
            </span>
          </Link>

          <Link
            href="/login"
            className="rounded-xl bg-[#FF4D00] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Page Content */}
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-lg shadow-orange-500/5 ring-1 ring-gray-100 md:p-8">
          <h1 className="text-center text-3xl font-black text-gray-900">
            Reset Password
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Enter your new password below
          </p>

          {/* Success Message */}
          {successMsg && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="mt-7 space-y-5" onSubmit={onSubmit}>
            {/* New Password */}
            <div>
              <label className="text-sm font-bold text-gray-800">
                New Password
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
                <Lock className="h-4 w-4 text-gray-400" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-transparent text-sm outline-none"
                  disabled={isLoading || !token}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength bar */}
              <div className="mt-3">
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.pct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400">Min 8 chars</span>
                  <span className={`${strength.textColor} transition-colors duration-300`}>
                    {strength.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-bold text-gray-800">
                Confirm New Password
              </label>
              <div
                className={[
                  "mt-2 flex items-center gap-3 rounded-xl border bg-white px-4 py-3",
                  confirmPassword.length === 0
                    ? "border-gray-200"
                    : passwordsMatch
                      ? "border-emerald-400"
                      : "border-red-300",
                  "focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20",
                ].join(" ")}
              >
                <Lock className="h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-transparent text-sm outline-none"
                  disabled={isLoading || !token}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>

                {passwordsMatch && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              </div>

              {confirmPassword.length > 0 && passwordsMatch && (
                <p className="mt-2 text-xs font-bold text-emerald-600">
                  Passwords match!
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-[#FF4D00] py-3 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs text-blue-900">
                <strong>Security Tip:</strong> Use a strong password with a mix of uppercase, lowercase, numbers, and special characters.
              </p>
            </div>

            <p className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <Link href="/login" className="font-black text-[#FF4D00] hover:opacity-90">
                Login
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} FoodieFlow Inc. All rights reserved.
          <div className="mt-2 flex items-center justify-center gap-4">
            <a className="hover:text-[#FF4D00]" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-[#FF4D00]" href="#">
              Terms of Service
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}