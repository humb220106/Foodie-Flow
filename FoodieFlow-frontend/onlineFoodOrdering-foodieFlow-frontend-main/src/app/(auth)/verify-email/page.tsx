"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  Loader2,
  Utensils,
} from "lucide-react"
import { authService } from "@/lib/api/auth-service"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setStatus("error")
      setMessage("No verification token provided. Please check your email for the verification link.")
    }
  }, [token])

  async function verifyEmail(verificationToken: string) {
    try {
      const response = await authService.verifyEmail(verificationToken)

      setStatus("success")
      setMessage(response.message || "Email verified successfully. You can now log in.")
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Verification error:", error)
      setStatus("error")
      setMessage(error.message || "Verification failed. The token may have expired.")
    }
  }

  async function handleResendVerification(e: React.FormEvent) {
    e.preventDefault()
    setResendMessage(null)
    setIsResending(true)

    try {
      const response = await authService.resendVerification(email.trim())
      
      setResendMessage(
        response.message || 
        "If an unverified account exists with this email, a verification link has been sent."
      )
    } catch (error: any) {
      console.error("Resend error:", error)
      setResendMessage(error.message || "Failed to resend verification email. Please try again.")
    } finally {
      setIsResending(false)
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
          {/* Loading State */}
          {status === "loading" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF4D00]" />
              </div>
              <h1 className="mt-6 text-2xl font-black text-gray-900">
                Verifying your email...
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Please wait while we verify your email address.
              </p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="mt-6 text-2xl font-black text-gray-900">
                Email Verified!
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Redirecting to login page...
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-xl bg-[#FF4D00] px-6 py-3 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:opacity-95"
              >
                Go to Login
              </Link>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="mt-6 text-2xl font-black text-gray-900">
                Verification Failed
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>

              {/* Resend Verification Form */}
              <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
                <h2 className="text-sm font-black text-gray-900">
                  Need a new verification link?
                </h2>
                <p className="mt-1 text-xs text-gray-600">
                  Enter your email address and we'll send you a new link.
                </p>

                <form className="mt-4 space-y-4" onSubmit={handleResendVerification}>
                  <div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="w-full bg-transparent text-sm outline-none"
                        required
                        disabled={isResending}
                      />
                    </div>
                  </div>

                  {resendMessage && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      {resendMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isResending || !email.trim()}
                    className="w-full rounded-xl bg-[#FF4D00] py-2.5 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : "Resend Verification Email"}
                  </button>
                </form>
              </div>

              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-bold text-[#FF4D00] hover:opacity-90"
              >
                Back to Login
              </Link>
            </div>
          )}
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