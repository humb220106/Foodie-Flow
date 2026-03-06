// "use client"

// import { useEffect, useState } from "react"
// import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
// import { restaurantService, RestaurantResponse } from "@/lib/api/restaurant-service"
// import { AuthService } from "@/lib/api/auth-service"
// import {
//   Loader2,
//   Save,
//   Eye,
//   EyeOff,
//   AlertCircle,
//   CheckCircle,
//   User,
//   Store,
//   Lock,
//   Info,
// } from "lucide-react"

// const authService = new AuthService()

// // function parseJwt(token: string): any {
// //   try {
// //     const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
// //     return JSON.parse(
// //       decodeURIComponent(
// //         atob(base64)
// //           .split("")
// //           .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
// //           .join("")
// //       )
// //     )
// //   } catch {
// //     return null
// //   }
// // }

// function parseJwt(token: string): any {
//   try {
//     const base64Url = token.split(".")[1]
//     if (!base64Url) return null

//     // base64url -> base64
//     let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")

//     // add required padding
//     const pad = base64.length % 4
//     if (pad) base64 += "=".repeat(4 - pad)

//     const json = atob(base64)
//     return JSON.parse(json)
//   } catch {
//     return null
//   }
// }

// export default function RestaurantProfilePage() {
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)
//   const [savingPwd, setSavingPwd] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [success, setSuccess] = useState<string | null>(null)

//   // Restaurant data from API
//   const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null)

//   // Form fields — restaurant info
//   const [restaurantName, setRestaurantName] = useState("")
//   const [restaurantDescription, setRestaurantDescription] = useState("")
//   const [phoneNumber, setPhoneNumber] = useState("")
//   const [address, setAddress] = useState("")
//   const [city, setCity] = useState("")
//   const [state, setState] = useState("")
//   const [country, setCountry] = useState("")
//   const [logo, setLogo] = useState<File | null>(null)
//   const [banner, setBanner] = useState<File | null>(null)

//   // Password fields
//   const [currentPassword, setCurrentPassword] = useState("")
//   const [newPassword, setNewPassword] = useState("")
//   const [showCurrentPwd, setShowCurrentPwd] = useState(false)
//   const [showNewPwd, setShowNewPwd] = useState(false)

//   // Account info from JWT (signup details)
//   const [jwtData, setJwtData] = useState<{ username: string; email: string; role: string } | null>(null)

//   // useEffect(() => {
//   //   // Decode JWT for account-level info (username, email, role from registration)
//   //   const token = localStorage.getItem("access_token")
//   //   if (token) {
//   //     const payload = parseJwt(token)
//   //     setJwtData({
//   //       username: payload?.unique_name || payload?.username || "—",
//   //       email: payload?.email || "—",
//   //       role: payload?.role || payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "Restaurant",
//   //     })
//   //   }
//   //   void load()
//   // }, [])


//   useEffect(() => {
//   const token =
//     localStorage.getItem("access_token") ||
//     localStorage.getItem("token") ||
//     localStorage.getItem("jwt")

//   if (token) {
//     const payload = parseJwt(token)

//     const username =
//       payload?.unique_name ||
//       payload?.username ||
//       payload?.name ||
//       payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
//       "—"

//     const email =
//       payload?.email ||
//       payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
//       payload?.Email ||
//       "—"

//     const role =
//       payload?.role ||
//       payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
//       "Restaurant"

//     setJwtData({ username, email, role })
//   } else {
//     setJwtData({ username: "—", email: "—", role: "Restaurant" })
//   }

//   void load()
// }, [])

// console.log("token:", localStorage.getItem("access_token"))
// console.log("payload:", parseJwt(localStorage.getItem("access_token") || ""))

//   async function load() {
//     try {
//       setLoading(true)
//       setError(null)
//       const me = await restaurantService.getMyRestaurant()
//       setRestaurant(me)
//       if (me) {
//         setRestaurantName(me.restaurantName || "")
//         setRestaurantDescription(me.restaurantDescription || "")
//         setPhoneNumber(me.phoneNumber || "")
//         setAddress(me.address || "")
//         setCity(me.city || "")
//         setState(me.state || "")
//         setCountry(me.country || "")
//       }
//     } catch (e: any) {
//       setError(e?.message || "Failed to load profile")
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function saveProfile() {
//     if (!restaurant) return
//     setError(null)
//     setSuccess(null)
//     try {
//       setSaving(true)
//       const fd = new FormData()
//       fd.append("restaurantName", restaurantName)
//       fd.append("restaurantDescription", restaurantDescription)
//       fd.append("phoneNumber", phoneNumber)
//       fd.append("address", address)
//       fd.append("city", city)
//       fd.append("state", state)
//       fd.append("country", country)
//       if (logo) fd.append("restaurantLogo", logo)
//       if (banner) fd.append("restaurantBanner", banner)

//       const updated = await restaurantService.updateRestaurant(restaurant.id, fd)
//       setRestaurant(updated)
//       setLogo(null)
//       setBanner(null)
//       setSuccess("Profile updated successfully!")
//     } catch (e: any) {
//       setError(e?.message || "Failed to save profile")
//     } finally {
//       setSaving(false)
//     }
//   }

//   async function changePassword() {
//     setError(null)
//     setSuccess(null)
//     if (!currentPassword.trim() || !newPassword.trim()) {
//       setError("Please fill in both current and new password.")
//       return
//     }
//     if (newPassword.length < 6) {
//       setError("New password must be at least 6 characters.")
//       return
//     }
//     try {
//       setSavingPwd(true)
//       const res = await authService.changePassword({ currentPassword, newPassword })
//       setCurrentPassword("")
//       setNewPassword("")
//       setSuccess(res?.message || "Password updated. Please log in again.")
//     } catch (e: any) {
//       setError(e?.message || "Failed to change password")
//     } finally {
//       setSavingPwd(false)
//     }
//   }

//   const displayName = restaurant?.restaurantName || jwtData?.username || "Restaurant"

//   return (
//     <div className="flex min-h-screen bg-gray-50">
//       <RestaurantSidebar restaurantName={displayName} restaurantLogo={restaurant?.restaurantLogo} />

//       <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>
//         <header className="border-b border-gray-200 bg-white px-8 py-6">
//           <h1 className="text-2xl font-black text-gray-900">Profile</h1>
//           <p className="mt-1 text-sm text-gray-500">
//             Manage your restaurant info, view your account details, and change your password.
//           </p>
//         </header>

//         <div className="mx-auto max-w-5xl p-8 space-y-6">
//           {/* Alerts */}
//           {loading && (
//             <div className="flex items-center gap-2 text-sm text-gray-500">
//               <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
//             </div>
//           )}
//           {error && (
//             <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//               <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
//               {error}
//             </div>
//           )}
//           {success && (
//             <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
//               <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
//               {success}
//             </div>
//           )}

//           {!loading && (
//             <div className="space-y-6">
//               {/* ── Account Info (from signup / JWT) ── */}
//               <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
//                 <div className="flex items-center gap-2 mb-4">
//                   <User className="h-5 w-5 text-blue-600" />
//                   <h2 className="text-base font-black text-gray-900">Account Details</h2>
//                   <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
//                     Read Only
//                   </span>
//                 </div>
//                 <div className="grid gap-4 sm:grid-cols-3">
//                   {[
//                     { label: "Username", value: jwtData?.username || "—" },
//                     { label: "Email", value: jwtData?.email || "—" },
//                     { label: "Role", value: jwtData?.role || "Restaurant" },
//                   ].map(({ label, value }) => (
//                     <div key={label} className="rounded-lg bg-white px-4 py-3 border border-blue-100">
//                       <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
//                       <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{value}</p>
//                     </div>
//                   ))}
//                 </div>
//                 <p className="mt-3 flex items-center gap-1.5 text-xs text-blue-600">
//                   <Info className="h-3.5 w-3.5" />
//                   These are your registration details. To update username/email, contact support.
//                 </p>
//               </div>

//               {/* ── Restaurant Info Form ── */}
//               <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
//                 <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
//                   <Store className="h-5 w-5 text-[#FF4D00]" />
//                   <h2 className="text-base font-black text-gray-900">Restaurant Info</h2>
//                 </div>

//                 {!restaurant ? (
//                   <div className="p-6">
//                     <p className="text-sm text-gray-600">No restaurant profile found for this account.</p>
//                     <p className="mt-1 text-xs text-gray-400">
//                       Make sure you are logged in with a restaurant account.
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="p-6 grid gap-5">
//                     {/* Read-only quick stats */}
//                     <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4">
//                       {[
//                         { label: "Rating", value: restaurant.averageRating ? `${restaurant.averageRating}/5` : "—" },
//                         { label: "Reviews", value: restaurant.totalReviews || 0 },
//                         { label: "Total Sales", value: `₦${(restaurant.totalSales || 0).toLocaleString()}` },
//                       ].map(({ label, value }) => (
//                         <div key={label} className="text-center">
//                           <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
//                           <p className="mt-1 text-lg font-black text-gray-900">{value}</p>
//                         </div>
//                       ))}
//                     </div>

//                     <div>
//                       <label className="text-xs font-bold text-gray-600">Restaurant Name *</label>
//                       <input
//                         value={restaurantName}
//                         onChange={(e) => setRestaurantName(e.target.value)}
//                         className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-orange-100"
//                         placeholder="e.g. Joseph Palace"
//                       />
//                     </div>

//                     <div>
//                       <label className="text-xs font-bold text-gray-600">Description</label>
//                       <textarea
//                         value={restaurantDescription}
//                         onChange={(e) => setRestaurantDescription(e.target.value)}
//                         rows={3}
//                         className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-orange-100"
//                         placeholder="Tell customers about your restaurant..."
//                       />
//                     </div>

//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div>
//                         <label className="text-xs font-bold text-gray-600">Phone</label>
//                         <input
//                           value={phoneNumber}
//                           onChange={(e) => setPhoneNumber(e.target.value)}
//                           className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
//                           placeholder="+234..."
//                         />
//                       </div>
//                       <div>
//                         <label className="text-xs font-bold text-gray-600">Country</label>
//                         <input
//                           value={country}
//                           onChange={(e) => setCountry(e.target.value)}
//                           className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
//                           placeholder="Nigeria"
//                         />
//                       </div>
//                     </div>

//                     <div>
//                       <label className="text-xs font-bold text-gray-600">Address</label>
//                       <input
//                         value={address}
//                         onChange={(e) => setAddress(e.target.value)}
//                         className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
//                         placeholder="123 Main Street..."
//                       />
//                     </div>

//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div>
//                         <label className="text-xs font-bold text-gray-600">City</label>
//                         <input
//                           value={city}
//                           onChange={(e) => setCity(e.target.value)}
//                           className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
//                           placeholder="Lagos"
//                         />
//                       </div>
//                       <div>
//                         <label className="text-xs font-bold text-gray-600">State</label>
//                         <input
//                           value={state}
//                           onChange={(e) => setState(e.target.value)}
//                           className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
//                           placeholder="Lagos State"
//                         />
//                       </div>
//                     </div>

//                     <div className="grid gap-4 sm:grid-cols-2">
//                       <div>
//                         <label className="text-xs font-bold text-gray-600">Logo (optional)</label>
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={(e) => setLogo(e.target.files?.[0] || null)}
//                           className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-orange-50 file:px-2 file:py-1 file:text-xs file:font-bold file:text-[#FF4D00]"
//                         />
//                         {restaurant.restaurantLogo && (
//                           <img src={restaurant.restaurantLogo} alt="logo" className="mt-2 h-12 w-12 rounded-lg object-cover border border-gray-200" />
//                         )}
//                       </div>
//                       <div>
//                         <label className="text-xs font-bold text-gray-600">Banner (optional)</label>
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={(e) => setBanner(e.target.files?.[0] || null)}
//                           className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-orange-50 file:px-2 file:py-1 file:text-xs file:font-bold file:text-[#FF4D00]"
//                         />
//                         {restaurant.restaurantBanner && (
//                           <img src={restaurant.restaurantBanner} alt="banner" className="mt-2 h-12 w-full rounded-lg object-cover border border-gray-200" />
//                         )}
//                       </div>
//                     </div>

//                     <div className="flex justify-end pt-2">
//                       <button
//                         onClick={saveProfile}
//                         disabled={saving}
//                         className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-90 disabled:opacity-60"
//                       >
//                         {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
//                         Save Changes
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* ── Change Password ── */}
//               <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
//                 <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
//                   <Lock className="h-5 w-5 text-[#FF4D00]" />
//                   <h2 className="text-base font-black text-gray-900">Change Password</h2>
//                 </div>
//                 <div className="p-6 space-y-4">
//                   {/* <p className="text-xs text-gray-500">
//                     Connected to <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">POST /api/auth/change-password</code> — ✅ Implemented
//                   </p> */}

//                   <div>
//                     <label className="text-xs font-bold text-gray-600">Current Password</label>
//                     <div className="relative mt-1">
//                       <input
//                         type={showCurrentPwd ? "text" : "password"}
//                         value={currentPassword}
//                         onChange={(e) => setCurrentPassword(e.target.value)}
//                         className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#FF4D00]"
//                         placeholder="Enter current password"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowCurrentPwd((v) => !v)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                       >
//                         {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                       </button>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="text-xs font-bold text-gray-600">New Password</label>
//                     <div className="relative mt-1">
//                       <input
//                         type={showNewPwd ? "text" : "password"}
//                         value={newPassword}
//                         onChange={(e) => setNewPassword(e.target.value)}
//                         className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#FF4D00]"
//                         placeholder="Minimum 6 characters"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowNewPwd((v) => !v)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                       >
//                         {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                       </button>
//                     </div>
//                   </div>

//                   <button
//                     onClick={changePassword}
//                     disabled={savingPwd}
//                     className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-800 bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60"
//                   >
//                     {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
//                     Update Password
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }






"use client"

import { useEffect, useState } from "react"
import RestaurantSidebar from "@/components/layout/RestaurantSidebar"
import { restaurantService, RestaurantResponse } from "@/lib/api/restaurant-service"
import { customerService } from "@/lib/api/customer-service"
import { AuthService } from "@/lib/api/auth-service"
import {
  Loader2,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  User,
  Store,
  Lock,
  Info,
} from "lucide-react"

const authService = new AuthService()

// function parseJwt(token: string): any {
//   try {
//     const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
//     return JSON.parse(
//       decodeURIComponent(
//         atob(base64)
//           .split("")
//           .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
//           .join("")
//       )
//     )
//   } catch {
//     return null
//   }
// }

function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1]
    if (!base64Url) return null

    // base64url -> base64
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")

    // add required padding
    const pad = base64.length % 4
    if (pad) base64 += "=".repeat(4 - pad)

    const json = atob(base64)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export default function RestaurantProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Restaurant data from API
  const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null)
  const [realReviewCount, setRealReviewCount] = useState<number | null>(null)

  // Form fields — restaurant info
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantDescription, setRestaurantDescription] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [country, setCountry] = useState("")
  const [logo, setLogo] = useState<File | null>(null)
  const [banner, setBanner] = useState<File | null>(null)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)

  // Account info from JWT (signup details)
  const [jwtData, setJwtData] = useState<{ username: string; email: string; role: string } | null>(null)

  // useEffect(() => {
  //   // Decode JWT for account-level info (username, email, role from registration)
  //   const token = localStorage.getItem("access_token")
  //   if (token) {
  //     const payload = parseJwt(token)
  //     setJwtData({
  //       username: payload?.unique_name || payload?.username || "—",
  //       email: payload?.email || "—",
  //       role: payload?.role || payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "Restaurant",
  //     })
  //   }
  //   void load()
  // }, [])


  useEffect(() => {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt")

  if (token) {
    const payload = parseJwt(token)

    const username =
      payload?.unique_name ||
      payload?.username ||
      payload?.name ||
      payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
      "—"

    const email =
      payload?.email ||
      payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
      payload?.Email ||
      "—"

    const role =
      payload?.role ||
      payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      "Restaurant"

    setJwtData({ username, email, role })
  } else {
    setJwtData({ username: "—", email: "—", role: "Restaurant" })
  }

  void load()
}, [])

console.log("token:", localStorage.getItem("access_token"))
console.log("payload:", parseJwt(localStorage.getItem("access_token") || ""))

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const me = await restaurantService.getMyRestaurant()
      setRestaurant(me)
      if (me) {
        setRestaurantName(me.restaurantName || "")
        setRestaurantDescription(me.restaurantDescription || "")
        setPhoneNumber(me.phoneNumber || "")
        setAddress(me.address || "")
        setCity(me.city || "")
        setState(me.state || "")
        setCountry(me.country || "")

        // Fetch real review count — backend's totalReviews only counts approved reviews.
        // GET /api/review/restaurant/:id returns totalCount for ALL submitted reviews.
        try {
          const reviewData = await customerService.getRestaurantReviews(me.id, 1, 1)
          const count = reviewData?.totalCount ?? reviewData?.summary?.totalReviews ?? null
          setRealReviewCount(count)
        } catch {
          // silently ignore — fall back to restaurant.totalReviews
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    if (!restaurant) return
    setError(null)
    setSuccess(null)
    try {
      setSaving(true)
      const fd = new FormData()
      fd.append("restaurantName", restaurantName)
      fd.append("restaurantDescription", restaurantDescription)
      fd.append("phoneNumber", phoneNumber)
      fd.append("address", address)
      fd.append("city", city)
      fd.append("state", state)
      fd.append("country", country)
      if (logo) fd.append("restaurantLogo", logo)
      if (banner) fd.append("restaurantBanner", banner)

      const updated = await restaurantService.updateRestaurant(restaurant.id, fd)
      setRestaurant(updated)
      setLogo(null)
      setBanner(null)
      setSuccess("Profile updated successfully!")
    } catch (e: any) {
      setError(e?.message || "Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    setError(null)
    setSuccess(null)
    if (!currentPassword.trim() || !newPassword.trim()) {
      setError("Please fill in both current and new password.")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }
    try {
      setSavingPwd(true)
      const res = await authService.changePassword({ currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setSuccess(res?.message || "Password updated. Please log in again.")
    } catch (e: any) {
      setError(e?.message || "Failed to change password")
    } finally {
      setSavingPwd(false)
    }
  }

  const displayName = restaurant?.restaurantName || jwtData?.username || "Restaurant"

  return (
    <div className="flex min-h-screen bg-gray-50">
      <RestaurantSidebar restaurantName={displayName} restaurantLogo={restaurant?.restaurantLogo} />

      <div className="flex-1 overflow-auto" style={{ marginLeft: 256 }}>
        <header className="border-b border-gray-200 bg-white px-8 py-6">
          <h1 className="text-2xl font-black text-gray-900">Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your restaurant info, view your account details, and change your password.
          </p>
        </header>

        <div className="mx-auto max-w-5xl p-8 space-y-6">
          {/* Alerts */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading profile...
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {!loading && (
            <div className="space-y-6">
              {/* ── Account Info (from signup / JWT) ── */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <h2 className="text-base font-black text-gray-900">Account Details</h2>
                  <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                    Read Only
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Username", value: jwtData?.username || "—" },
                    { label: "Email", value: jwtData?.email || "—" },
                    { label: "Role", value: jwtData?.role || "Restaurant" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-white px-4 py-3 border border-blue-100">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 truncate">{value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-blue-600">
                  <Info className="h-3.5 w-3.5" />
                  These are your registration details. To update username/email, contact support.
                </p>
              </div>

              {/* ── Restaurant Info Form ── */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
                  <Store className="h-5 w-5 text-[#FF4D00]" />
                  <h2 className="text-base font-black text-gray-900">Restaurant Info</h2>
                </div>

                {!restaurant ? (
                  <div className="p-6">
                    <p className="text-sm text-gray-600">No restaurant profile found for this account.</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Make sure you are logged in with a restaurant account.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 grid gap-5">
                    {/* Read-only quick stats */}
                    <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4">
                      {[
                        { label: "Rating", value: restaurant.averageRating ? `${restaurant.averageRating}/5` : "—" },
                        { label: "Reviews", value: realReviewCount ?? restaurant.totalReviews ?? 0 },
                        { label: "Total Sales", value: `₦${(restaurant.totalSales || 0).toLocaleString()}` },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center">
                          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
                          <p className="mt-1 text-lg font-black text-gray-900">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600">Restaurant Name *</label>
                      <input
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-orange-100"
                        placeholder="e.g. Joseph Palace"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600">Description</label>
                      <textarea
                        value={restaurantDescription}
                        onChange={(e) => setRestaurantDescription(e.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00] focus:ring-2 focus:ring-orange-100"
                        placeholder="Tell customers about your restaurant..."
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-gray-600">Phone</label>
                        <input
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                          placeholder="+234..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600">Country</label>
                        <input
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                          placeholder="Nigeria"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-600">Address</label>
                      <input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                        placeholder="123 Main Street..."
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-gray-600">City</label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                          placeholder="Lagos"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600">State</label>
                        <input
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#FF4D00]"
                          placeholder="Lagos State"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-bold text-gray-600">Logo (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setLogo(e.target.files?.[0] || null)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-orange-50 file:px-2 file:py-1 file:text-xs file:font-bold file:text-[#FF4D00]"
                        />
                        {restaurant.restaurantLogo && (
                          <img src={restaurant.restaurantLogo} alt="logo" className="mt-2 h-12 w-12 rounded-lg object-cover border border-gray-200" />
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-600">Banner (optional)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBanner(e.target.files?.[0] || null)}
                          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500 file:mr-2 file:rounded file:border-0 file:bg-orange-50 file:px-2 file:py-1 file:text-xs file:font-bold file:text-[#FF4D00]"
                        />
                        {restaurant.restaurantBanner && (
                          <img src={restaurant.restaurantBanner} alt="banner" className="mt-2 h-12 w-full rounded-lg object-cover border border-gray-200" />
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#FF4D00] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/25 hover:opacity-90 disabled:opacity-60"
                      >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Change Password ── */}
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-4">
                  <Lock className="h-5 w-5 text-[#FF4D00]" />
                  <h2 className="text-base font-black text-gray-900">Change Password</h2>
                </div>
                <div className="p-6 space-y-4">
                  {/* <p className="text-xs text-gray-500">
                    Connected to <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">POST /api/auth/change-password</code> — ✅ Implemented
                  </p> */}

                  <div>
                    <label className="text-xs font-bold text-gray-600">Current Password</label>
                    <div className="relative mt-1">
                      <input
                        type={showCurrentPwd ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#FF4D00]"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600">New Password</label>
                    <div className="relative mt-1">
                      <input
                        type={showNewPwd ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#FF4D00]"
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={savingPwd}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-800 bg-gray-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60"
                  >
                    {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}