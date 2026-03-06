"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  BookOpen,
  User,
  LogOut,
  ListTree,
  Video,
  Star,
} from "lucide-react"
import { restaurantService, RestaurantResponse } from "@/lib/api/restaurant-service"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  backendStatus?: "implemented" | "partial" | "not-implemented"
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/restaurant/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    backendStatus: "implemented",
  },
  {
    label: "Dishes",
    href: "/restaurant/dishes",
    icon: <Utensils className="h-5 w-5" />,
    backendStatus: "implemented",
  },
  {
    label: "Menu Builder",
    href: "/restaurant/menu-uploads",
    icon: <ListTree className="h-5 w-5" />,
    backendStatus: "implemented",
  },
  {
    label: "Orders",
    href: "/restaurant/orders",
    icon: <ShoppingBag className="h-5 w-5" />,
    backendStatus: "partial",
  },
  {
    label: "Blog Posts",
    href: "/restaurant/online-reading",
    icon: <BookOpen className="h-5 w-5" />,
    backendStatus: "implemented",
  },
  {
    label: "Videos",
    href: "/restaurant/videos",
    icon: <Video className="h-5 w-5" />,
    backendStatus: "implemented",
  },
  {
    label: "Review",
    href: "/restaurant/reviews",
    icon: <Star className="h-5 w-5" />,
    backendStatus: "implemented",
  },
  {
    label: "Profile",
    href: "/restaurant/profile",
    icon: <User className="h-5 w-5" />,
    backendStatus: "implemented",
  },
]

interface RestaurantSidebarProps {
  /** Optional override — if not provided, the sidebar fetches restaurant data itself */
  restaurantName?: string
  restaurantLogo?: string | null
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function parseJwtForName(): string {
  if (typeof window === "undefined") return "Restaurant"
  const token = localStorage.getItem("access_token")
  if (!token) return "Restaurant"
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    )
    return payload?.unique_name || payload?.username || "Restaurant"
  } catch {
    return "Restaurant"
  }
}

export default function RestaurantSidebar({ restaurantName, restaurantLogo }: RestaurantSidebarProps) {
  const pathname = usePathname()
  const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null)

  // Self-fetch restaurant profile to get logo & name if not provided via props
  useEffect(() => {
    // Only self-fetch if the caller didn't already supply the logo prop
    if (restaurantLogo !== undefined) return
    restaurantService.getMyRestaurant().then((data) => {
      if (data) setRestaurant(data)
    }).catch(() => {/* ignore — sidebar falls back to initials */})
  }, [restaurantLogo])

  // Resolve display values: explicit props → fetched data → JWT fallback
  const logoUrl = restaurantLogo !== undefined ? restaurantLogo : restaurant?.restaurantLogo ?? null
  const displayName = restaurantName || restaurant?.restaurantName || parseJwtForName()

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/")

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("token_expires_at")
    window.location.href = "/login"
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white flex flex-col">
      {/* FoodieFlow branding */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF4D00] shadow-sm">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900">FoodieFlow</h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#FF4D00]">Restaurant Portal</p>
          </div>
        </div>

        {/* Restaurant identity chip */}
        <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
          {/* Avatar: logo image if available, otherwise initials */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] text-[10px] font-black text-white overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Hide broken image so initials fallback shows naturally
                  ;(e.currentTarget as HTMLImageElement).style.display = "none"
                }}
              />
            ) : (
              getInitials(displayName)
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-gray-900">{displayName}</p>
            <p className="text-[10px] text-gray-400">Logged in as Restaurant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Menu</p>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "bg-[#FF4D00] text-white shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 hover:text-[#FF4D00]"
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>

                {/* Partial-implementation dot */}
                {item.backendStatus === "partial" && (
                  <span
                    title="Backend endpoint exists but not fully wired"
                    className={`h-1.5 w-1.5 rounded-full ${active ? "bg-orange-200" : "bg-amber-400"}`}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}