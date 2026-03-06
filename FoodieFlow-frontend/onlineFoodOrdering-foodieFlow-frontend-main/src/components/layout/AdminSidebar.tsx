"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingBag,
  Tag,
  Utensils,
  FileText,
  Settings,
  LogOut,
  Shield,
  Crown,
  Star,
  ClipboardList,
  Bell,
} from "lucide-react"
import { adminService } from "@/lib/api/admin-service"
import { getAccessToken, clearTokens } from "@/lib/api/tokens"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  // {
  //   label: "Manage Admins",
  //   href: "/admin/admins",
  //   icon: <Shield className="h-5 w-5" />,
  //   adminOnly: true,
  // },
  {
    label: "User Management",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Restaurants",
    href: "/admin/restaurants",
    icon: <Store className="h-5 w-5" />,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: <Tag className="h-5 w-5" />,
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: <Star className="h-5 w-5" />,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: "Audit Logs",
    href: "/admin/audit-logs",
    icon: <ClipboardList className="h-5 w-5" />,
    adminOnly: true,
  },
]

const bottomNavItems: NavItem[] = [
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

function parseJwt(token: string): any {
  try {
    const b = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(
      decodeURIComponent(
        atob(b).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
      )
    )
  } catch { return null }
}

function getUserIdFromToken(token: string): string | null {
  const p = parseJwt(token)
  if (!p) return null
  return (
    p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
    p.sub || p.nameid || p.userId || p.id || null
  )
}

export default function AdminSidebar() {
  const pathname = usePathname()
  // true = user has "Admin" role — they see adminOnly items + Crown
  const [isAdmin, setIsAdmin] = useState(false)
  const [username, setUsername] = useState("")

  useEffect(() => {
    async function checkRole() {
      const token = getAccessToken()
      if (!token) return

      const userId = getUserIdFromToken(token)
      if (!userId) return

      try {
        const user = await adminService.getUserById(userId)
        setUsername(user.username)
        // Anyone with "Admin" (any casing) in their roles array is an admin
        const hasAdminRole = user.roles.some(r =>
          r.toLowerCase() === "admin" ||
          r.toLowerCase() === "superadmin" ||
          r.toLowerCase() === "super_admin"
        )
        setIsAdmin(hasAdminRole)
      } catch {
        // silent — just won't show admin-only items
      }
    }
    void checkRole()
  }, [])

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/")

  const handleLogout = () => {
    clearTokens()
    window.location.href = "/login"
  }

  const visibleNavItems = navItems.filter(item =>
    item.adminOnly ? isAdmin : true
  )

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-gray-200">
      <div className="flex h-full flex-col">

        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF4D00] shadow-sm">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-lg font-black text-gray-900">FoodieFlow</h1>
              {isAdmin && <Crown className="h-3 w-3 text-[#FF4D00]" />}
            </div>
            <p className="text-xs font-semibold text-gray-500">
              {isAdmin ? "Admin Panel" : "Staff Panel"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "bg-[#FF4D00] text-white"
                    : "text-gray-700 hover:bg-orange-50 hover:text-[#FF4D00]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 p-3">
          {/* Logged-in user pill */}
          {username && (
            <div className="mb-2 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF4D00] text-[10px] font-black text-white">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-gray-700">{username}</p>
                <p className="text-[10px] text-gray-400">{isAdmin ? "Admin" : "Staff"}</p>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {bottomNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "bg-[#FF4D00] text-white"
                    : "text-gray-700 hover:bg-orange-50 hover:text-[#FF4D00]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

      </div>
    </aside>
  )
}