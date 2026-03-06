// Page placeholder
"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Utensils,
} from "lucide-react"
import { authService } from "@/lib/api/auth-service"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsLoading(true)

    try {
      const response = await authService.forgotPassword(email.trim())
      
      setSuccessMsg(
        response.message || 
        "If an account exists with this email, a password reset link has been sent."
      )
      
      // Clear email field
      setEmail("")
    } catch (error: any) {
      console.error("Forgot password error:", error)
      setErrorMsg(error.message || "Something went wrong. Please try again.")
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
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-[#FF4D00]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          <h1 className="mt-6 text-center text-3xl font-black text-gray-900">
            Forgot Password?
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            No worries! Enter your email and we'll send you reset instructions.
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
            {/* Email */}
            <div>
              <label className="text-sm font-bold text-gray-800">
                Email Address
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
                <Mail className="h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-transparent text-sm outline-none"
                  disabled={isLoading}
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter the email address associated with your account
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full rounded-xl bg-[#FF4D00] py-3 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> For security reasons, we'll send the reset link even if the email is not registered. Check your spam folder if you don't receive it within a few minutes.
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