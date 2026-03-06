import { apiClient, apiClientUpload } from "@/lib/api/client"

const ADMIN_API = {
  dashboard: "/api/admin/dashboard",
  users: {
    list: "/api/admin/users",
    details: (id: string) => `/api/admin/users/${id}`,
    status: (id: string) => `/api/admin/users/${id}/status`,
    roles: (id: string) => `/api/admin/users/${id}/roles`,
    delete: (id: string) => `/api/admin/users/${id}`,
  },
  restaurants: {
    list: "/api/admin/restaurants",
    details: (id: string) => `/api/admin/restaurants/${id}`,
    status: (id: string) => `/api/admin/restaurants/${id}/status`,
    delete: (id: string) => `/api/admin/restaurants/${id}`,
  },
  dishes: {
    list: "/api/admin/dishes",
    status: (id: string) => `/api/admin/dishes/${id}/status`,
    delete: (id: string) => `/api/admin/dishes/${id}`,
  },
  orders: {
    list: "/api/admin/orders",
    byStatus: (status: string) => `/api/admin/orders/status/${status}`,
    details: (id: string) => `/api/admin/orders/${id}`,
    updateStatus: (id: string) => `/api/admin/orders/${id}/status`,
  },
  reviews: {
    list: "/api/admin/reviews",
    status: (id: string) => `/api/admin/reviews/${id}/status`,
    delete: (id: string) => `/api/admin/reviews/${id}`,
  },
  auditLogs: {
    list: "/api/admin/audit-logs",
    byUser: (userId: string) => `/api/admin/audit-logs/users/${userId}`,
  },
  categories: {
    list: "/api/category",
    root: "/api/category/root",
    details: (id: string) => `/api/category/${id}`,
    create: "/api/category",
    update: (id: string) => `/api/category/${id}`,
    delete: (id: string) => `/api/category/${id}`,
  },
  notifications: {
    send: "/api/admin/notifications/push",
  },
  reports: {
    summary:     "/api/admin/reports/summary",
    revenue:     (days: number) => `/api/admin/reports/revenue?days=${days}`,
    orders:      (days: number) => `/api/admin/reports/orders?days=${days}`,
    users:       (days: number) => `/api/admin/reports/users?days=${days}`,
    restaurants: "/api/admin/reports/restaurants",
  },
}

export interface DailyStatEntry { date: string; value: number }
export interface DashboardStats {
  totalUsers: number; totalRestaurants: number; totalDishes: number
  totalOrders: number; totalReviews: number; totalRevenue: number
  pendingOrders: number; activeRestaurants: number; newUsersToday: number
  ordersToday: number; revenueToday: number
  last7DaysOrders: DailyStatEntry[]; last7DaysRevenue: DailyStatEntry[]
}
export interface PagedResult<T> {
  items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number
}
export interface AdminUser {
  id: string; username: string; email: string; phoneNumber: string
  isActive: boolean; emailVerified: boolean; roles: string[]
  createdAt: string; lastLoginAt: string | null; lastLoginIp: string | null
  failedLoginAttempts: number; isLockedOut: boolean
}
export interface AdminRestaurant {
  id: string; userId: string; ownerUsername: string; restaurantName: string
  restaurantSlug: string; restaurantDescription: string | null
  restaurantLogo: string | null; phoneNumber: string; address: string
  city: string; country: string; isActive: boolean; totalListings: number
  totalOrders: number; totalRevenue: number; averageRating: number
  reviewCount: number; createdAt: string
}
export interface AdminDish {
  id: string; restaurantId: string; restaurantName: string; title: string
  slug: string; price: number; isActive: boolean; isAvailable: boolean
  isFeatured: boolean; viewCount: number; reviewCount: number
  averageRating: number; createdAt: string
}
export type OrderStatus = "Pending" | "Confirmed" | "Preparing" | "OutForDelivery" | "Delivered" | "Cancelled"
export interface AdminOrder {
  id: string; orderNumber: string; customerId: string; customerUsername: string
  restaurantId: string; restaurantName: string; totalAmount: number
  status: OrderStatus; itemCount: number; createdAt: string; deliveredAt: string | null
}
export type ReviewStatus = "Pending" | "Approved" | "Rejected" | "Published"
export interface AdminReview {
  id: string; authorId: string; authorUsername: string
  dishId: string | null; dishTitle: string | null
  restaurantId: string | null; restaurantName: string | null
  rating: number; comment: string; status: ReviewStatus
  isVerifiedPurchase: boolean; createdAt: string
}
export interface AuditLog {
  id: string; userId: string | null; username: string | null
  action: string; details: string; ipAddress: string
  isSuccess: boolean; createdAt: string
}
export interface Category {
  id: string; name: string; slug: string; description: string | null
  icon: string | null; parentCategoryId: string | null
  dishCount: number; createdAt: string
}
export type FoodType = Category

// ── Report types ───────────────────────────────────────────────────────────

export interface MonthlyStatEntry {
  year: number; month: number; monthName: string; value: number
}

export interface TopRestaurantRevenueEntry {
  restaurantId: string; restaurantName: string; revenue: number; orderCount: number
}

export interface OrderStatusBreakdown {
  status: string; count: number; percentage: number
}

export interface RoleBreakdown {
  role: string; count: number
}

export interface RevenueReport {
  totalRevenue: number
  totalRevenueThisMonth: number
  totalRevenueLastMonth: number
  revenueGrowthPercent: number
  dailyRevenue: DailyStatEntry[]
  monthlyRevenue: MonthlyStatEntry[]
  topRestaurantsByRevenue: TopRestaurantRevenueEntry[]
}

export interface OrdersReport {
  totalOrders: number
  ordersThisMonth: number
  ordersLastMonth: number
  orderGrowthPercent: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  dailyOrders: DailyStatEntry[]
  statusBreakdown: OrderStatusBreakdown[]
}

export interface UsersReport {
  totalUsers: number
  newUsersThisMonth: number
  newUsersLastMonth: number
  userGrowthPercent: number
  activeUsers: number
  inactiveUsers: number
  dailySignups: DailyStatEntry[]
  roleBreakdown: RoleBreakdown[]
}

export interface RestaurantsReport {
  totalRestaurants: number
  activeRestaurants: number
  inactiveRestaurants: number
  newRestaurantsThisMonth: number
  topRestaurantsByOrders: TopRestaurantRevenueEntry[]
  topRestaurantsByRevenue: TopRestaurantRevenueEntry[]
}

export interface AdminSummaryReport {
  revenue: RevenueReport
  orders: OrdersReport
  users: UsersReport
  restaurants: RestaurantsReport
}
export interface PushNotificationRequest {
  recipientType: "all" | "customers" | "restaurants"; title: string; message: string
}
export interface PushNotificationResponse {
  message: string; recipientCount: number; sentAt: string
}

function buildPagedQuery(page = 1, pageSize = 20) {
  return `?page=${page}&pageSize=${pageSize}`
}

class AdminService {

  async getDashboardStats(): Promise<DashboardStats> {
    const r = await apiClient<{ data: DashboardStats }>(ADMIN_API.dashboard)
    return r.data
  }
  async getUsers(page = 1, pageSize = 20): Promise<PagedResult<AdminUser>> {
    const r = await apiClient<{ data: PagedResult<AdminUser> }>(`${ADMIN_API.users.list}${buildPagedQuery(page, pageSize)}`)
    return r.data
  }
  async getUserById(id: string): Promise<AdminUser> {
    const r = await apiClient<{ data: AdminUser }>(ADMIN_API.users.details(id))
    return r.data
  }
  async updateUserStatus(id: string, isActive: boolean, reason?: string): Promise<AdminUser> {
    const r = await apiClient<{ data: AdminUser }>(ADMIN_API.users.status(id), { method: "PATCH", body: JSON.stringify({ isActive, reason }) })
    return r.data
  }
  async assignUserRole(id: string, role: string): Promise<AdminUser> {
    const r = await apiClient<{ data: AdminUser }>(ADMIN_API.users.roles(id), { method: "POST", body: JSON.stringify({ role }) })
    return r.data
  }
  async deleteUser(id: string): Promise<void> {
    await apiClient(ADMIN_API.users.delete(id), { method: "DELETE" })
  }
  async getRestaurants(page = 1, pageSize = 20): Promise<PagedResult<AdminRestaurant>> {
    const r = await apiClient<{ data: PagedResult<AdminRestaurant> }>(`${ADMIN_API.restaurants.list}${buildPagedQuery(page, pageSize)}`)
    return r.data
  }
  async getRestaurantById(id: string): Promise<AdminRestaurant> {
    const r = await apiClient<{ data: AdminRestaurant }>(ADMIN_API.restaurants.details(id))
    return r.data
  }
  async updateRestaurantStatus(id: string, isActive: boolean, reason?: string): Promise<AdminRestaurant> {
    const r = await apiClient<{ data: AdminRestaurant }>(ADMIN_API.restaurants.status(id), { method: "PATCH", body: JSON.stringify({ isActive, reason }) })
    return r.data
  }
  async deleteRestaurant(id: string): Promise<void> {
    await apiClient(ADMIN_API.restaurants.delete(id), { method: "DELETE" })
  }
  async getDishes(page = 1, pageSize = 20): Promise<PagedResult<AdminDish>> {
    const r = await apiClient<{ data: PagedResult<AdminDish> }>(`${ADMIN_API.dishes.list}${buildPagedQuery(page, pageSize)}`)
    return r.data
  }
  async updateDishStatus(id: string, isActive: boolean, isAvailable: boolean): Promise<AdminDish> {
    const r = await apiClient<{ data: AdminDish }>(ADMIN_API.dishes.status(id), { method: "PATCH", body: JSON.stringify({ isActive, isAvailable }) })
    return r.data
  }
  async deleteDish(id: string): Promise<void> {
    await apiClient(ADMIN_API.dishes.delete(id), { method: "DELETE" })
  }
  async getOrders(page = 1, pageSize = 20): Promise<PagedResult<AdminOrder>> {
    const r = await apiClient<{ data: PagedResult<AdminOrder> }>(`${ADMIN_API.orders.list}${buildPagedQuery(page, pageSize)}`)
    return r.data
  }
  async getOrdersByStatus(status: OrderStatus, page = 1, pageSize = 20): Promise<PagedResult<AdminOrder>> {
    const r = await apiClient<{ data: PagedResult<AdminOrder> }>(`${ADMIN_API.orders.byStatus(status)}${buildPagedQuery(page, pageSize)}`)
    return r.data
  }
  async getOrderById(id: string): Promise<AdminOrder> {
    const r = await apiClient<{ data: AdminOrder }>(ADMIN_API.orders.details(id))
    return r.data
  }
  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    await apiClient(ADMIN_API.orders.updateStatus(id), { method: "PATCH", body: JSON.stringify({ status }) })
  }
  async getReviews(page = 1, pageSize = 20): Promise<PagedResult<AdminReview>> {
    const r = await apiClient<{ data: PagedResult<AdminReview> }>(`${ADMIN_API.reviews.list}${buildPagedQuery(page, pageSize)}`)
    return r.data
  }
  async updateReviewStatus(id: string, status: ReviewStatus, reason?: string): Promise<AdminReview> {
    const tryStatus = async (s: string) => {
      const r = await apiClient<{ data: AdminReview; message?: string }>(
        ADMIN_API.reviews.status(id),
        { method: "PATCH", body: JSON.stringify({ status: s, reason }) }
      )
      return r.data
    }
    try {
      return await tryStatus(status)
    } catch (e: any) {
      const msg: string = e?.message || ""
      if ((msg.includes("400") || msg.includes("Bad Request")) && status === "Approved") {
        return await tryStatus("Published")
      }
      throw e
    }
  }
  async deleteReview(id: string): Promise<void> {
    try {
      await apiClient(ADMIN_API.reviews.delete(id), { method: "DELETE" })
    } catch (e: any) {
      if (e?.message?.includes("404") || e?.message?.includes("Not Found")) {
        await apiClient(`/api/review/${id}`, { method: "DELETE" })
      } else {
        throw e
      }
    }
  }
  async getAuditLogs(page = 1, pageSize = 50): Promise<PagedResult<AuditLog>> {
    const r = await apiClient<{ data: PagedResult<AuditLog> }>(`${ADMIN_API.auditLogs.list}?page=${page}&pageSize=${pageSize}`)
    return r.data
  }
  async getUserAuditLogs(userId: string, page = 1, pageSize = 50): Promise<PagedResult<AuditLog>> {
    const r = await apiClient<{ data: PagedResult<AuditLog> }>(`${ADMIN_API.auditLogs.byUser(userId)}?page=${page}&pageSize=${pageSize}`)
    return r.data
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories(): Promise<Category[]> {
    return apiClient<Category[]>(ADMIN_API.categories.list)
  }
  async getRootCategories(): Promise<Category[]> {
    return apiClient<Category[]>(ADMIN_API.categories.root)
  }
  async getCategoryById(id: string): Promise<Category> {
    return apiClient<Category>(ADMIN_API.categories.details(id))
  }

  /**
   * Create a category via multipart/form-data.
   * - Cuisine category → iconFile: File  (uploaded to cloud by backend)
   * - Food type        → iconEmoji: string (emoji stored as plain text)
   */
  async createCategory(data: {
    name: string
    description?: string
    iconFile?: File
    iconEmoji?: string
    parentCategoryId?: string
  }): Promise<Category> {
    const fd = new FormData()
    fd.append("name", data.name)
    if (data.description)      fd.append("description", data.description)
    if (data.parentCategoryId) fd.append("parentCategoryId", data.parentCategoryId)
    if (data.iconFile instanceof File) {
      fd.append("iconFile", data.iconFile)   // → C# IFormFile IconFile
    } else if (data.iconEmoji) {
      fd.append("icon", data.iconEmoji)      // → C# string Icon
    }
    const res = await apiClientUpload<Category>(ADMIN_API.categories.create, fd)
    return (res as any).data ?? res
  }

  /**
   * Update a category via multipart/form-data.
   * Backend deletes old cloud image automatically when a new iconFile is sent.
   */
  async updateCategory(id: string, data: {
    name?: string
    description?: string
    iconFile?: File
    iconEmoji?: string
    parentCategoryId?: string
  }): Promise<Category> {
    const fd = new FormData()
    if (data.name !== undefined)             fd.append("name", data.name)
    if (data.description !== undefined)      fd.append("description", data.description)
    if (data.parentCategoryId !== undefined) fd.append("parentCategoryId", data.parentCategoryId)
    if (data.iconFile instanceof File) {
      fd.append("iconFile", data.iconFile)
    } else if (data.iconEmoji !== undefined) {
      fd.append("icon", data.iconEmoji)
    }
    const res = await apiClientUpload<Category>(
      ADMIN_API.categories.update(id), fd, { method: "PUT" } as any
    )
    return (res as any).data ?? res
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient(ADMIN_API.categories.delete(id), { method: "DELETE" })
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  async sendPushNotification(data: PushNotificationRequest): Promise<PushNotificationResponse> {
    const r = await apiClient<{ data: PushNotificationResponse }>(ADMIN_API.notifications.send, { method: "POST", body: JSON.stringify(data) })
    return r.data
  }

  // ── Reports ────────────────────────────────────────────────────────────────

  async getSummaryReport(): Promise<AdminSummaryReport> {
    const r = await apiClient<{ data: AdminSummaryReport }>(ADMIN_API.reports.summary)
    return r.data
  }

  async getRevenueReport(days = 30): Promise<RevenueReport> {
    const r = await apiClient<{ data: RevenueReport }>(ADMIN_API.reports.revenue(days))
    return r.data
  }

  async getOrdersReport(days = 30): Promise<OrdersReport> {
    const r = await apiClient<{ data: OrdersReport }>(ADMIN_API.reports.orders(days))
    return r.data
  }

  async getUsersReport(days = 30): Promise<UsersReport> {
    const r = await apiClient<{ data: UsersReport }>(ADMIN_API.reports.users(days))
    return r.data
  }

  async getRestaurantsReport(): Promise<RestaurantsReport> {
    const r = await apiClient<{ data: RestaurantsReport }>(ADMIN_API.reports.restaurants)
    return r.data
  }
}

export const adminService = new AdminService()