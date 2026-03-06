"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Utensils,
  Phone,
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

function looksLikeEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

// username must be 3-50 chars, letters only
function validUsername(v: string) {
  return /^[a-zA-Z]{3,50}$/.test(v.trim())
}

export default function RegisterPage() {
  const router = useRouter()
  
  // Backend-required fields
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const strength = useMemo(() => passwordStrength(password), [password])
  const passwordsMatch = confirm.length > 0 && confirm === password

  const canSubmit = useMemo(() => {
    return (
      validUsername(username) &&
      looksLikeEmail(email) &&
      phone.trim().length >= 8 &&
      password.trim().length >= 8 &&
      confirm.trim().length >= 8 &&
      password === confirm &&
      !isLoading
    )
  }, [username, email, phone, password, confirm, isLoading])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      setIsLoading(true)

      const response = await authService.registerCustomer({
        username: username.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
      })

      setSuccessMsg(
        response.message ||
          "Registration successful. Redirecting to login..."
      )

      // Clear fields
      setUsername("")
      setEmail("")
      setPhone("")
      setPassword("")
      setConfirm("")
      
      // Redirect straight to login — email verification is disabled
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err?.message || "Something went wrong.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left image panel */}
        <section className="relative hidden overflow-hidden lg:block">
          <Image
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836"
            alt="Food background"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 0vw, 50vw"
          />
          <div className="absolute inset-0 bg-black/55" />

          <div className="absolute bottom-10 left-10 right-10">
            <div className="flex items-center gap-2 text-white">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg">
                <Utensils className="h-7 w-7 text-white" />
              </div>
              <span className="text-lg font-black">FoodieFlow</span>
            </div>

            <h1 className="mt-6 text-5xl font-black leading-tight text-white">
              Join FoodieFlow and
              <br />
              discover the best
              <br />
              tastes
            </h1>

            <p className="mt-5 max-w-lg text-base text-white/80">
              Experience the finest cuisines from local gems delivered right to your doorstep.
            </p>
          </div>
        </section>

        {/* Right form panel */}
        <section className="flex items-center justify-center bg-[#faf7f4] px-4 py-12 md:px-6">
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white p-7 shadow-lg shadow-orange-500/5 ring-1 ring-gray-100 md:p-8">
              <h2 className="text-2xl font-black text-gray-900">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Enter your details to get started
              </p>

              {/* Messages */}
              {errorMsg && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  {successMsg}
                </div>
              )}

              <form className="mt-7 space-y-5" onSubmit={onSubmit}>
                {/* Username */}
                <div>
                  <label className="text-sm font-bold text-gray-800">Username</label>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
                    <User className="h-4 w-4 text-gray-400" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="johndoe"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Use 3–50 characters, letters only
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-bold text-gray-800">Email</label>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full bg-transparent text-sm outline-none"
                      type="email"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-bold text-gray-800">Phone Number</label>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="w-full bg-transparent text-sm outline-none"
                      type="tel"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-sm font-bold text-gray-800">Password</label>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
                    <Lock className="h-4 w-4 text-gray-400" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                    Confirm Password
                  </label>

                  <div
                    className={[
                      "mt-2 flex items-center gap-3 rounded-xl border bg-white px-4 py-3",
                      confirm.length === 0
                        ? "border-gray-200"
                        : passwordsMatch
                          ? "border-emerald-400"
                          : "border-red-300",
                      "focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20",
                    ].join(" ")}
                  >
                    <Lock className="h-4 w-4 text-gray-400" />
                    <input
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-transparent text-sm outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>

                    {passwordsMatch && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </div>

                  {confirm.length > 0 && passwordsMatch && (
                    <p className="mt-2 text-xs font-bold text-emerald-600">
                      Passwords match!
                    </p>
                  )}
                </div>

                <button
                  disabled={!canSubmit}
                  className="w-full rounded-xl bg-[#FF4D00] py-3 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? "Creating..." : "Create Account"}
                </button>

                <div className="pt-2 text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-black text-[#FF4D00]">
                    Login
                  </Link>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-bold text-gray-400">OR</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="text-center text-sm text-gray-700">
                  Are you a business?{" "}
                  <Link
                    href="/restaurant"
                    className="font-black text-[#FF4D00]"
                  >
                    Register as Restaurant Owner
                  </Link>
                </div>

                <p className="pt-3 text-center text-xs text-gray-500">
                  By creating an account, you agree to FoodieFlow&apos;s{" "}
                  <a className="underline hover:text-[#FF4D00]" href="#">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a className="underline hover:text-[#FF4D00]" href="#">
                    Privacy Policy
                  </a>
                  .
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}