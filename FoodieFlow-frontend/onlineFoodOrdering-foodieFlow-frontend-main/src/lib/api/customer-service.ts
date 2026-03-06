
import { apiClient } from "@/lib/api/client"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  username: string
  email: string
  emailVerified: boolean
  phoneNumber: string | null
  address: string | null
  roles: string[]
  createdAt: string
  lastLoginAt: string | null
}

export interface RestaurantResponse {
  id: string
  userId: string
  restaurantName: string
  restaurantSlug: string
  restaurantDescription: string | null
  restaurantLogo: string | null
  restaurantBanner: string | null
  totalSales: number       // may be 0 — backend uses totalRevenue
  totalRevenue?: number    // actual backend field for revenue
  averageRating: number
  totalReviews: number     // may be 0 — backend uses reviewCount
  reviewCount?: number     // actual backend field for review count
  totalOrders?: number 
   orderCount?: number    // backend field for order count
  createdAt: string
}

export interface DishResponse {
  id: string
  restaurantId: string
  restaurantName: string
  title: string
  slug: string
  description: string
  shortDescription: string | null
  price: number
  isAvailable: boolean
  categoryId: string
  categoryName: string
  tags: string | null
  primaryImage: string | null
  images: string[] | null
  videoUrl: string | null
  status: string
  isActive: boolean
  isFeatured: boolean
  viewCount: number
  favoriteCount: number
  averageRating: number
  reviewCount: number
  createdAt: string
}

export interface CategoryResponse {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parentCategoryId: string | null
  productCount: number
  createdAt: string
}

export interface OrderItemRequest {
  dishId: string
  quantity: number
  specialInstructions?: string
  customizations?: string
}

export interface CreateOrderRequest {
  restaurantId: string
  items: OrderItemRequest[]
  deliveryAddress?: string
  deliveryCity?: string
  deliveryState?: string
  deliveryPostalCode?: string
  deliveryInstructions?: string
  deliveryLatitude?: number
  deliveryLongitude?: number
  customerPhone: string
  customerNotes?: string
}

export interface OrderItemResponse {
  id: string
  dishId: string
  dishName: string
  dishImage: string | null
  unitPrice: number
  quantity: number
  subTotal: number
  specialInstructions: string | null
  customizations: string | null
}

export type OrderStatus =
  | "Pending" | "Accepted" | "Preparing" | "Ready"
  | "PickedUp" | "OnTheWay" | "Delivered" | "Completed"
  | "Cancelled" | "Rejected"

export interface OrderResponse {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerPhone: string
  restaurantId: string
  restaurantName: string
  restaurantLogo: string | null
  items: OrderItemResponse[]
  subTotal: number
  deliveryFee: number
  serviceFee: number
  tax: number
  discount: number
  totalAmount: number
  deliveryAddress: string
  deliveryCity: string
  deliveryState: string
  deliveryInstructions: string | null
  status: OrderStatus
  paymentMethod: string | null
  createdAt: string
  acceptedAt: string | null
  preparingAt: string | null
  readyAt: string | null
  deliveredAt: string | null
  estimatedDeliveryTime: string | null
  customerNotes: string | null
  restaurantNotes: string | null
  rating: number | null
  review: string | null
}

export interface CreateOrderResponse {
  orderId: string
  orderNumber: string
  totalAmount: number
  status: OrderStatus
  createdAt: string
  estimatedDeliveryTime: string | null
}

export interface ReviewResponse {
  id: string
  authorId: string
  authorUsername: string   // API returns "authorUsername" not "authorName"
  authorName?: string      // keep as alias for backwards compat
  rating: number
  comment: string | null
  images: string[] | null
  restaurantReply: string | null
  repliedAt: string | null
  isVerifiedPurchase: boolean
  helpfulCount: number
  status: string           // "Published" | "Pending" | "Rejected" (customer-facing)
  createdAt: string
  updatedAt: string | null
}

export interface ReviewSummary {
  averageRating: number
  totalReviews: number
  fiveStar: number    // API returns singular: fiveStar not fiveStars
  fourStar: number
  threeStar: number
  twoStar: number
  oneStar: number
  // keep plural aliases for any existing UI references
  fiveStars?: number
  fourStars?: number
  threeStars?: number
  twoStars?: number
}

export interface MenuSectionDishResponse {
  dishId: string
  dishName: string
  dishImage: string | null
  price: number
  isAvailable: boolean
  displayOrder: number
}

export interface MenuSectionResponse {
  id: string
  name: string
  description: string | null
  displayOrder: number
  dishes: MenuSectionDishResponse[]
}

export interface MenuResponse {
  id: string
  restaurantId: string
  restaurantName: string
  name: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  sections: MenuSectionResponse[]
}

// ── Cart (client-side only) ───────────────────────────────────────────────────

export interface CartItem {
  dishId: string
  dishName: string
  dishImage: string | null
  price: number
  quantity: number
  restaurantId: string
  restaurantName: string
  specialInstructions?: string
}

const CART_KEY = "ff_cart"

export const cartService = {
  get(): CartItem[] {
    if (typeof window === "undefined") return []
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]") } catch { return [] }
  },
  save(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  },
  add(item: CartItem): boolean {
    const cart = this.get()
    // Different restaurant → confirm clear
    if (cart.length > 0 && cart[0].restaurantId !== item.restaurantId) {
      if (!confirm(`Your cart has items from ${cart[0].restaurantName}. Clear and add from ${item.restaurantName}?`)) return false
      this.save([])
    }
    const fresh = this.get()
    const existing = fresh.find(c => c.dishId === item.dishId)
    if (existing) {
      this.save(fresh.map(c => c.dishId === item.dishId ? { ...c, quantity: c.quantity + item.quantity } : c))
    } else {
      this.save([...fresh, item])
    }
    return true
  },
  remove(dishId: string) {
    this.save(this.get().filter(c => c.dishId !== dishId))
  },
  updateQty(dishId: string, quantity: number) {
    if (quantity <= 0) { this.remove(dishId); return }
    this.save(this.get().map(c => c.dishId === dishId ? { ...c, quantity } : c))
  },
  clear() { localStorage.removeItem(CART_KEY) },
  total(): number {
    return this.get().reduce((sum, c) => sum + c.price * c.quantity, 0)
  },
  count(): number {
    return this.get().reduce((sum, c) => sum + c.quantity, 0)
  },
}

// ── API Service ───────────────────────────────────────────────────────────────

class CustomerService {

  // ── Auth/Profile ───────────────────────────────────────────────────────────

  async getProfile(): Promise<UserProfile> {
    return apiClient<UserProfile>("/api/auth/me")
  }

  // ── Restaurants ────────────────────────────────────────────────────────────

  async searchRestaurants(q: string, page = 1, pageSize = 20): Promise<RestaurantResponse[]> {
    // Backend returns direct array (ActionResult<List<RestaurantResponse>>) — no wrapper
    const r = await apiClient<RestaurantResponse[]>(
      `/api/restaurant/search?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`
    )
    return Array.isArray(r) ? r : []
  }

  async getAllRestaurants(page = 1, pageSize = 20): Promise<RestaurantResponse[]> {
    // Backend has no get-all endpoint — search?q=a matches almost every restaurant
    // because .Contains("a") is true for most names. Returns direct array (no wrapper).
    const r = await apiClient<RestaurantResponse[]>(
      `/api/restaurant/search?q=a&page=${page}&pageSize=${pageSize}`
    )
    return Array.isArray(r) ? r : []
  }

  async getRestaurantById(id: string): Promise<RestaurantResponse> {
    // RestaurantController returns the object directly (no data wrapper)
    return apiClient<RestaurantResponse>(`/api/restaurant/${id}`)
  }

  async getRestaurantBySlug(slug: string): Promise<RestaurantResponse> {
    return apiClient<RestaurantResponse>(`/api/restaurant/store/${slug}`)
  }

  // ── Dishes ─────────────────────────────────────────────────────────────────

  async getDish(id: string): Promise<DishResponse> {
    const r = await apiClient<{ data: DishResponse }>(`/api/dish/${id}`)
    return r.data
  }

  async getDishesByRestaurant(restaurantId: string, page = 1, pageSize = 50): Promise<{ data: DishResponse[]; count: number }> {
    const r = await apiClient<{ data: DishResponse[]; count: number; page: number; pageSize: number }>(
      `/api/dish/restaurant/${restaurantId}?page=${page}&pageSize=${pageSize}`
    )
    return { data: r.data ?? [], count: r.count ?? 0 }
  }

  async searchDishes(q: string, categoryId?: string, minPrice?: number, maxPrice?: number, page = 1, pageSize = 20): Promise<DishResponse[]> {
    const params = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) })
    if (categoryId) params.set("categoryId", categoryId)
    if (minPrice !== undefined) params.set("minPrice", String(minPrice))
    if (maxPrice !== undefined) params.set("maxPrice", String(maxPrice))
    const r = await apiClient<{ data: DishResponse[] }>(`/api/dish/search?${params}`)
    return r.data ?? []
  }

  // ── Categories ─────────────────────────────────────────────────────────────

  async getCategories(): Promise<CategoryResponse[]> {
    // CategoryController returns array directly (ActionResult<List<CategoryResponse>>)
    const r = await apiClient<CategoryResponse[] | { data: CategoryResponse[] }>("/api/category")
    return Array.isArray(r) ? r : (r as any).data ?? []
  }

  async getRootCategories(): Promise<CategoryResponse[]> {
    const r = await apiClient<CategoryResponse[] | { data: CategoryResponse[] }>("/api/category/root")
    return Array.isArray(r) ? r : (r as any).data ?? []
  }

  // ── Menu ───────────────────────────────────────────────────────────────────

  async getDefaultMenu(restaurantId: string): Promise<MenuResponse | null> {
    try {
      const r = await apiClient<{ data: MenuResponse }>(`/api/menu/restaurant/${restaurantId}/default`)
      return r.data
    } catch { return null }
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  async placeOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
    const r = await apiClient<{ data: CreateOrderResponse }>("/api/order", {
      method: "POST",
      body: JSON.stringify(req),
    })
    return r.data
  }

  async payOrder(orderId: string): Promise<{ message: string; paymentReference: string }> {
    return apiClient(`/api/order/${orderId}/pay`, { method: "POST" })
  }

  async getMyOrders(page = 1, pageSize = 20): Promise<{ data: OrderResponse[]; count: number }> {
    const r = await apiClient<{ data: OrderResponse[]; page: number; pageSize: number; count: number }>(
      `/api/order/my-orders?page=${page}&pageSize=${pageSize}`
    )
    return { data: r.data ?? [], count: r.count ?? 0 }
  }

  async getMyActiveOrders(): Promise<OrderResponse[]> {
    const r = await apiClient<{ data: OrderResponse[] }>("/api/order/my-orders/active")
    return r.data ?? []
  }

  async getOrderById(id: string): Promise<OrderResponse> {
    const r = await apiClient<{ data: OrderResponse }>(`/api/order/${id}`)
    return r.data
  }

  async cancelOrder(id: string, reason: string): Promise<OrderResponse> {
    const r = await apiClient<{ data: OrderResponse }>(`/api/order/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
    return r.data
  }

  // ── Reviews ────────────────────────────────────────────────────────────────

  async getRestaurantReviews(restaurantId: string, page = 1, pageSize = 20) {
    const r = await apiClient<{
      data: { items: Array<{ restaurantId: string; restaurantName: string; review: ReviewResponse }>; summary: ReviewSummary; page: number; pageSize: number; totalCount: number }
    }>(`/api/review/restaurant/${restaurantId}?page=${page}&pageSize=${pageSize}`)
    return r.data
  }

  async getDishReviews(dishId: string, page = 1, pageSize = 20) {
    const r = await apiClient<{
      data: { items: Array<{ dishId: string; dishTitle: string; review: ReviewResponse }>; summary: ReviewSummary; page: number; pageSize: number; totalCount: number }
    }>(`/api/review/dish/${dishId}?page=${page}&pageSize=${pageSize}`)
    return r.data
  }

  async submitRestaurantReview(restaurantId: string, rating: number, comment: string, images?: File[]) {
    const form = new FormData()
    form.append("restaurantId", restaurantId)
    form.append("rating", String(rating))
    if (comment) form.append("comment", comment)
    images?.forEach(img => form.append("images", img))
    return apiClient("/api/review/restaurant", { method: "POST", body: form })
  }

  async submitDishReview(dishId: string, rating: number, comment: string, images?: File[]) {
    const form = new FormData()
    form.append("dishId", dishId)
    form.append("rating", String(rating))
    if (comment) form.append("comment", comment)
    images?.forEach(img => form.append("images", img))
    return apiClient("/api/review/dish", { method: "POST", body: form })
  }

  async markReviewHelpful(reviewId: string) {
    return apiClient(`/api/review/${reviewId}/helpful`, { method: "POST" })
  }

  async getMyDishReviews(page = 1, pageSize = 20) {
    const r = await apiClient<{ data: any[]; page: number; pageSize: number; count: number }>(
      `/api/review/my/dishes?page=${page}&pageSize=${pageSize}`
    )
    return r
  }

  async getMyRestaurantReviews(page = 1, pageSize = 20) {
    const r = await apiClient<{ data: any[]; page: number; pageSize: number; count: number }>(
      `/api/review/my/restaurants?page=${page}&pageSize=${pageSize}`
    )
    return r
  }

  // ── Token helpers ──────────────────────────────────────────────────────────

  parseUserFromToken(): { id: string; username: string; email: string; roles: string[] } | null {
    if (typeof window === "undefined") return null
    const token = localStorage.getItem("access_token")
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      return {
        id: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.sub || "",
        username: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || payload.name || "",
        email: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || payload.email || "",
        roles: (() => {
          const r = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
          return Array.isArray(r) ? r : r ? [r] : []
        })(),
      }
    } catch { return null }
  }
}

export const customerService = new CustomerService()