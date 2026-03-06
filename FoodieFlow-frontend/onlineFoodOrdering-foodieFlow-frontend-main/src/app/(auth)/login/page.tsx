"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  Utensils,
} from "lucide-react"
import { authService } from "@/lib/api/auth-service"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  // UI states
  const [isLoading, setIsLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return username.trim().length > 2 && password.trim().length >= 6 && !isLoading
  }, [username, password, isLoading])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setIsLoading(true)

    // Hardcoded admin login
    if (username.trim() === "Admin" && password === "Admin123") {
      setSuccessMsg("Admin login successful! Redirecting...");
      setTimeout(() => {
        router.push("/admin/dashboard/");
      }, 1000);
      setIsLoading(false);
      return;
    }

    try {
      // Use authService for login
      const response = await authService.login({
        username: username.trim(),
        password: password
      })
      
      setSuccessMsg("Login successful! Redirecting...")
      
      // Get user role from the token or make an API call to get user info
      const userRole = await getUserRole()
      
      // Route based on user role
      // setTimeout(() => {
      //   if (userRole === "Restaurant") {
      //     router.push("/restaurant/dashboard")
      //   } else if (userRole === "Customer") {
      //     router.push("/customer")
      //   } else if (userRole === "Admin") {
      //     router.push("/admin/dashboard")
      //   } 
      // }, 1000)

      setTimeout(() => {
  const r = (userRole || "").toLowerCase()

  if (r === "restaurant" || r === "owner" || r === "restaurantowner") {
    router.push("/restaurant/dashboard")
  } else if (r === "admin") {
    router.push("/admin/dashboard")
  } else {
    router.push("/customer/dashboard")
  }
}, 1000)


    } catch (error: any) {
      console.error("Login error:", error)
      setErrorMsg(error.message || "Login failed. Please check your credentials and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Get user role from JWT token or API call
   */
  // async function getUserRole(): Promise<string> {
  //   try {
  //     const accessToken = localStorage.getItem("access_token")
      
  //     if (!accessToken) {
  //       return "Customer" // Default
  //     }

  //     // Option 1: Decode JWT to get role (if role is in the token)
  //     const payload = parseJwt(accessToken)
  //     if (payload?.role) {
  //       return payload.role
  //     }

  //     // Option 2: Call /api/auth/me or /api/user/profile to get user info
  //     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
  //       method: "GET",
  //       headers: {
  //         "Authorization": `Bearer ${accessToken}`
  //       }
  //     })

  //     if (response.ok) {
  //       const userData = await response.json()
  //       return userData.role || userData.data?.role || "Customer"
  //     }

  //     return "Customer" // Default
  //   } catch (error) {
  //     console.error("Error getting user role:", error)
  //     return "Customer" // Default
  //   }
  // }

  async function getUserRole(): Promise<string> {
  try {
    const accessToken = localStorage.getItem("access_token")
    if (!accessToken) return "Customer"

    const payload = parseJwt(accessToken)

    // ✅ handle common .NET claim keys
    const roleValue =
      payload?.role ??
      payload?.roles ??
      payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
      payload?.["roles"] ??
      null

    // roles can be string or array
    const role =
      Array.isArray(roleValue) ? roleValue[0] : (roleValue as string | null)

    if (role) return String(role)

    // If you REALLY have /api/auth/me implemented, keep this.
    // Otherwise remove it (it will always fail and default to Customer).
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (res.ok) {
      const userData = await res.json()
      return userData.role || userData.data?.role || "Customer"
    }

    return "Customer"
  } catch {
    return "Customer"
  }
}




  /**
   * Parse JWT token to extract payload
   */
  function parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error("Error parsing JWT:", error)
      return null
    }
  }

  return (
    <main className="min-h-screen bg-[#faf7f4]">
      {/* Top bar (simple, like screenshot) */}
      <header className="border-b border-orange-100/60 bg-white/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-black text-gray-900">
            {/* Logo */}
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 shadow-lg">
                  <Utensils className="h-7 w-7 text-white" />
                </div>
            <span>
              Foodie<span className="text-[#FF4D00]">Flow</span>
            </span>
          </Link>

          <Link
            href="/register(customer)"
            className="rounded-xl bg-[#FF4D00] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-95"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Page */}
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        {/* Success toast (like screenshot) */}
        {successMsg && (
          <div className="mx-auto mb-6 flex max-w-md items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm">
            <CheckCircle2 className="h-5 w-5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-lg shadow-orange-500/5 ring-1 ring-gray-100 md:p-8">
          <h1 className="text-center text-3xl font-black text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Please enter your details to sign in
          </p>

          <form className="mt-7 space-y-5" onSubmit={onSubmit}>
            {/* Username */}
            <div>
              <label className="text-sm font-bold text-gray-800">
                Username
              </label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20">
                <Mail className="h-4 w-4 text-gray-400" />
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-transparent text-sm outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-bold text-gray-800">
                Password
              </label>
              <div
                className={[
                  "mt-2 flex items-center gap-3 rounded-xl border bg-white px-4 py-3",
                  errorMsg ? "border-red-300" : "border-gray-200",
                  "focus-within:border-[#FF4D00] focus-within:ring-2 focus-within:ring-[#FF4D00]/20",
                ].join(" ")}
              >
                <Lock className="h-4 w-4 text-gray-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-transparent text-sm outline-none"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {errorMsg && (
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-[#FF4D00]"
                  disabled={isLoading}
                />
                Remember me
              </label>

              <Link
                href="/forgot-password"
                className="text-sm font-bold text-[#FF4D00] hover:opacity-90"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-xl bg-[#FF4D00] py-3 text-sm font-black text-white shadow-md shadow-orange-500/25 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-bold text-gray-400">OR</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Google (UI only for now) */}
            {/* <button
              type="button"
              className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
              disabled={isLoading}
            >
              Continue with Google
            </button> */}

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/register(customer)" className="font-black text-[#FF4D00]">
                Sign up for free
              </Link>
            </p>
          </form>
        </div>

        {/* Footer mini links like screenshot */}
        <div className="mt-10 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} FoodieFlow Inc. All rights reserved.
          <div className="mt-2 flex items-center justify-center gap-4">
            <a className="hover:text-[#FF4D00]" href="#">Privacy Policy</a>
            <a className="hover:text-[#FF4D00]" href="#">Terms of Service</a>
          </div>
        </div>
      </section>
    </main>
  )
}