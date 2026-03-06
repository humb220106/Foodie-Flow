

import { apiClient, apiClientUpload } from "@/lib/api/client"

// ============================================================
// BACKEND API ENDPOINTS
// ============================================================
// ✅ IMPLEMENTED:
//   GET    /api/restaurant/me            → getMyRestaurant()
//   PUT    /api/restaurant/{id}          → updateRestaurant()
//   GET    /api/category                 → getCategories()
//   GET    /api/dish/my-dishes           → getMyDishes()
//   POST   /api/dish                     → createDish()
//   PUT    /api/dish/{id}               → updateDish()
//   DELETE /api/dish/{id}               → deleteDish()
//   GET    /api/order/restaurant         → getRestaurantOrders()
//   GET    /api/order/restaurant/active  → getActiveOrders()
//   POST   /api/order/{id}/accept        → acceptOrder()
//   POST   /api/order/{id}/reject        → rejectOrder()
//   POST   /api/order/{id}/preparing     → markAsPreparing()
//   POST   /api/order/{id}/ready         → markAsReady()
//   POST   /api/order/{id}/delivered     → markAsDelivered()
//   POST   /api/order/{id}/cancel        → cancelOrder()
//   POST   /api/auth/change-password     → changePassword() (via AuthService)
//   POST   /api/menu                     → createMenu()
//   GET    /api/menu/{id}               → getMenuById()
//   GET    /api/menu/restaurant/{id}     → getRestaurantMenus()
//   GET    /api/menu/restaurant/{id}/default → getDefaultMenu()
//   PUT    /api/menu/{id}               → updateMenu()
//   DELETE /api/menu/{id}               → deleteMenu()
//   POST   /api/menu/{id}/sections       → addMenuSection()
//   PUT    /api/menu/{id}/sections/{sid} → updateMenuSection()
//   DELETE /api/menu/{id}/sections/{sid} → deleteMenuSection()
//   POST   /api/menu/{id}/sections/{sid}/dishes → addDishToSection()
//   DELETE /api/menu/{id}/sections/{sid}/dishes/{did} → removeDishFromSection()
//   POST   /api/book                     → createBook()
//   GET    /api/book/{id}               → getBookById()
//   GET    /api/book/slug/{slug}         → getBookBySlug()
//   GET    /api/book/my-books            → getMyBooks()
//   GET    /api/book/restaurant/{id}     → getRestaurantBooks()
//   GET    /api/book/search              → searchBooks()
//   PUT    /api/book/{id}               → updateBook()
//   DELETE /api/book/{id}               → deleteBook()
// ============================================================

const RESTAURANT_API = {
  restaurant: {
    me: "/api/restaurant/me",
    update: (id: string) => `/api/restaurant/${id}`,
  },
  category: {
    list: "/api/category",
    root: "/api/category/root",
  },
  dish: {
    myDishes: "/api/dish/my-dishes",
    create: "/api/dish",
    update: (id: string) => `/api/dish/${id}`,
    delete: (id: string) => `/api/dish/${id}`,
  },
  orders: {
    restaurant: "/api/order/restaurant",
    restaurantActive: "/api/order/restaurant/active",
    restaurantByStatus: (status: string) => `/api/order/restaurant/status/${status}`,
    accept: (id: string) => `/api/order/${id}/accept`,
    reject: (id: string) => `/api/order/${id}/reject`,
    preparing: (id: string) => `/api/order/${id}/preparing`,
    ready: (id: string) => `/api/order/${id}/ready`,
    delivered: (id: string) => `/api/order/${id}/delivered`,
    cancel: (id: string) => `/api/order/${id}/cancel`,
  },
  menu: {
    create: "/api/menu",
    byId: (id: string) => `/api/menu/${id}`,
    byRestaurant: (restaurantId: string) => `/api/menu/restaurant/${restaurantId}`,
    defaultMenu: (restaurantId: string) => `/api/menu/restaurant/${restaurantId}/default`,
    sections: (menuId: string) => `/api/menu/${menuId}/sections`,
    section: (menuId: string, sectionId: string) => `/api/menu/${menuId}/sections/${sectionId}`,
    sectionDishes: (menuId: string, sectionId: string) => `/api/menu/${menuId}/sections/${sectionId}/dishes`,
    sectionDish: (menuId: string, sectionId: string, dishId: string) =>
      `/api/menu/${menuId}/sections/${sectionId}/dishes/${dishId}`,
  },
  books: {
    create: "/api/book",
    byId: (id: string) => `/api/book/${id}`,
    bySlug: (slug: string) => `/api/book/slug/${slug}`,
    myBooks: "/api/book/my-books",
    byRestaurant: (restaurantId: string) => `/api/book/restaurant/${restaurantId}`,
    search: "/api/book/search",
  },
}

// ==================== TYPES ====================

export interface RestaurantResponse {
  id: string
  userId: string
  restaurantName: string
  restaurantSlug: string
  restaurantDescription: string | null
  restaurantLogo: string | null
  restaurantBanner: string | null
  phoneNumber?: string
  address?: string
  city?: string
  state?: string
  country?: string
  totalSales: number
  averageRating: number
  totalReviews: number
  createdAt: string
}

export interface CategoryResponse {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  parentCategoryId: string | null
  dishCount: number
  createdAt: string
}

export type FoodType = CategoryResponse

export interface DishResponse {
  id: string
  restaurantId: string
  restaurantName: string
  title: string
  slug: string
  description: string | null
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

export interface Paginated<T> {
  data: T[]
  page: number
  pageSize: number
  count: number
}

export interface OrderItemResponse {
  id: string
  dishId: string
  dishTitle: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface OrderResponse {
  id: string
  orderId?: string
  orderNumber?: string
  customerId: string
  customerName?: string
  customerUsername?: string
  customerPhone?: string
  restaurantId: string
  restaurantName?: string
  restaurantLogo?: string
  items: OrderItemResponse[]
  subTotal?: number
  deliveryFee?: number
  serviceFee?: number
  tax?: number
  discount?: number
  totalAmount: number
  status: OrderStatus
  deliveryAddress?: string
  deliveryCity?: string
  deliveryState?: string
  deliveryInstructions?: string
  customerNotes?: string
  restaurantNotes?: string
  paymentMethod?: string
  notes?: string
  rating?: number
  review?: string
  createdAt: string
  updatedAt?: string
  acceptedAt?: string
  preparingAt?: string
  readyAt?: string
  deliveredAt?: string
  estimatedDeliveryTime?: string
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"      // backend name for Accepted
  | "Accepted"       // UI alias
  | "Preparing"
  | "OutForDelivery" // backend name for Out for Delivery
  | "Ready"          // UI alias
  | "Delivered"
  | "Completed"
  | "Cancelled"
  | "Rejected"

// ── Menu Types ──────────────────────────────────────────────────────────────

export interface MenuSectionDishResponse {
  dishId: string
  dishName: string
  dishImage?: string
  price: number
  isAvailable: boolean
  displayOrder: number
}

export interface MenuSectionResponse {
  id: string
  name: string
  description?: string
  displayOrder: number
  dishes: MenuSectionDishResponse[]
}

export interface MenuResponse {
  id: string
  restaurantId: string
  restaurantName: string
  name: string
  description?: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt?: string
  sections: MenuSectionResponse[]
}

export interface MenuSummaryResponse {
  id: string
  name: string
  description?: string
  isDefault: boolean
  isActive: boolean
  sectionCount: number
  createdAt: string
}

export interface CreateMenuSectionRequest {
  name: string
  description?: string
  displayOrder?: number
  dishes?: { dishId: string; displayOrder?: number }[]
}

export interface CreateMenuRequest {
  name: string
  description?: string
  isDefault?: boolean
  sections?: CreateMenuSectionRequest[]
}

export interface UpdateMenuRequest {
  name?: string
  description?: string
  isDefault?: boolean
  isActive?: boolean
}

export interface UpdateMenuSectionRequest {
  name?: string
  description?: string
  displayOrder?: number
}

// ── Book Types ───────────────────────────────────────────────────────────────

export interface BookResponse {
  id: string
  restaurantId: string
  restaurantName: string
  title: string
  slug: string
  content: string
  excerpt?: string
  coverImage?: string
  tags?: string
  isPublished: boolean
  viewCount: number
  publishedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface BookSummaryResponse {
  id: string
  title: string
  slug: string
  excerpt?: string
  coverImage?: string
  tags?: string
  isPublished: boolean
  viewCount: number
  publishedAt?: string
  createdAt: string
}

export interface CreateBookRequest {
  title: string
  content: string
  excerpt?: string
  coverImage?: File
  tags?: string
  isPublished?: boolean
}

export interface UpdateBookRequest {
  title?: string
  content?: string
  excerpt?: string
  coverImage?: File
  tags?: string
  isPublished?: boolean
}

// ==================== SERVICE ====================

class RestaurantService {
  // -------- Restaurant --------

  async getMyRestaurant(): Promise<RestaurantResponse | null> {
    try {
      const res = await apiClient<RestaurantResponse>(RESTAURANT_API.restaurant.me, { method: "GET" })
      return res
    } catch (e: any) {
      if (String(e?.message || "").includes("404")) return null
      throw e
    }
  }

  async updateRestaurant(id: string, formData: FormData): Promise<RestaurantResponse> {
    const res = await apiClientUpload<RestaurantResponse>(RESTAURANT_API.restaurant.update(id), formData, {
      method: "PUT",
    } as any)
    return res
  }

  // -------- Categories --------

  async getCategories(): Promise<CategoryResponse[]> {
    return apiClient<CategoryResponse[]>(RESTAURANT_API.category.list, { method: "GET" })
  }

  /**
   * Cuisine categories — parentCategoryId is null (top-level).
   * e.g. Nigerian, Italian — set by Admin.
   */
  async getCuisineCategories(): Promise<CategoryResponse[]> {
    const all = await this.getCategories()
    return all.filter((c) => c.parentCategoryId === null)
  }

  /**
   * Food types — parentCategoryId is set (they are children of a cuisine category).
   * e.g. 🌿 Vegetarian, 🥩 Non-Veg — set by Admin.
   */
  async getFoodTypes(): Promise<CategoryResponse[]> {
    const all = await this.getCategories()
    return all.filter((c) => c.parentCategoryId !== null)
  }

  /** Returns only cuisine categories for the dish form (same as getCuisineCategories). */
  async getCategoriesForDish(): Promise<CategoryResponse[]> {
    return this.getCuisineCategories()
  }

  async getMyDishes(page = 1, pageSize = 20): Promise<Paginated<DishResponse>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    return apiClient<Paginated<DishResponse>>(`${RESTAURANT_API.dish.myDishes}?${params}`, { method: "GET" })
  }

  /**
   * Create a dish via multipart/form-data — backend stores images.
   * Append foodType name into "tags" so it is stored and searchable.
   */
  async createDish(formData: FormData): Promise<DishResponse> {
    const res = await apiClientUpload<{ data: DishResponse }>(RESTAURANT_API.dish.create, formData)
    return (res as any).data ?? (res as any)
  }

  /**
   * Update a dish via multipart/form-data.
   */
  async updateDish(id: string, formData: FormData): Promise<DishResponse> {
    const res = await apiClientUpload<{ data: DishResponse }>(
      RESTAURANT_API.dish.update(id),
      formData,
      { method: "PUT" } as any
    )
    return (res as any).data ?? (res as any)
  }

  async deleteDish(id: string): Promise<void> {
    await apiClient<void>(RESTAURANT_API.dish.delete(id), { method: "DELETE" })
  }

  // -------- Orders --------

  async getRestaurantOrders(page = 1, pageSize = 20, status?: string): Promise<Paginated<OrderResponse>> {
    if (status && status !== "All") {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      const url = `${RESTAURANT_API.orders.restaurantByStatus(status)}?${params}`
      return apiClient<Paginated<OrderResponse>>(url, { method: "GET" })
    }
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    const url = `${RESTAURANT_API.orders.restaurant}?${params}`
    return apiClient<Paginated<OrderResponse>>(url, { method: "GET" })
  }

  async getActiveOrders(): Promise<OrderResponse[]> {
    const res = await apiClient<{ data: OrderResponse[] }>(RESTAURANT_API.orders.restaurantActive, { method: "GET" })
    return (res as any).data ?? (res as any) ?? []
  }

  async acceptOrder(id: string, estimatedPrepTime?: string): Promise<OrderResponse> {
    const body = estimatedPrepTime ? { estimatedPreparationTime: estimatedPrepTime } : {}
    const res = await apiClient<{ data: OrderResponse }>(RESTAURANT_API.orders.accept(id), {
      method: "POST",
      body: JSON.stringify(body),
    })
    return (res as any).data ?? (res as any)
  }

  async rejectOrder(id: string, reason: string): Promise<OrderResponse> {
    const res = await apiClient<{ data: OrderResponse }>(RESTAURANT_API.orders.reject(id), {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
    return (res as any).data ?? (res as any)
  }

  async markAsPreparing(id: string): Promise<OrderResponse> {
    const res = await apiClient<{ data: OrderResponse }>(RESTAURANT_API.orders.preparing(id), { method: "POST", body: "{}" })
    return (res as any).data ?? (res as any)
  }

  async markAsReady(id: string): Promise<OrderResponse> {
    const res = await apiClient<{ data: OrderResponse }>(RESTAURANT_API.orders.ready(id), { method: "POST", body: "{}" })
    return (res as any).data ?? (res as any)
  }

  async markAsDelivered(id: string): Promise<OrderResponse> {
    const res = await apiClient<{ data: OrderResponse }>(RESTAURANT_API.orders.delivered(id), { method: "POST", body: "{}" })
    return (res as any).data ?? (res as any)
  }

  async cancelOrder(id: string, reason: string): Promise<OrderResponse> {
    const res = await apiClient<{ data: OrderResponse }>(RESTAURANT_API.orders.cancel(id), {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
    return (res as any).data ?? (res as any)
  }

  // -------- Menu --------

  async createMenu(payload: CreateMenuRequest): Promise<MenuResponse> {
    const res = await apiClient<{ data: MenuResponse }>(RESTAURANT_API.menu.create, {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return (res as any).data ?? (res as any)
  }

  async getMenuById(id: string): Promise<MenuResponse> {
    const res = await apiClient<{ data: MenuResponse }>(RESTAURANT_API.menu.byId(id), { method: "GET" })
    return (res as any).data ?? (res as any)
  }

  async getRestaurantMenus(restaurantId: string): Promise<MenuSummaryResponse[]> {
    const res = await apiClient<{ data: MenuSummaryResponse[]; count: number }>(
      RESTAURANT_API.menu.byRestaurant(restaurantId),
      { method: "GET" }
    )
    return (res as any).data ?? (res as any) ?? []
  }

  async getDefaultMenu(restaurantId: string): Promise<MenuResponse | null> {
    try {
      const res = await apiClient<{ data: MenuResponse }>(RESTAURANT_API.menu.defaultMenu(restaurantId), { method: "GET" })
      return (res as any).data ?? (res as any)
    } catch (e: any) {
      if (String(e?.message || "").includes("404")) return null
      throw e
    }
  }

  async updateMenu(id: string, payload: UpdateMenuRequest): Promise<MenuResponse> {
    const res = await apiClient<{ data: MenuResponse }>(RESTAURANT_API.menu.byId(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return (res as any).data ?? (res as any)
  }

  async deleteMenu(id: string): Promise<void> {
    await apiClient<void>(RESTAURANT_API.menu.byId(id), { method: "DELETE" })
  }

  async addMenuSection(menuId: string, payload: CreateMenuSectionRequest): Promise<MenuResponse> {
    const res = await apiClient<{ data: MenuResponse }>(RESTAURANT_API.menu.sections(menuId), {
      method: "POST",
      body: JSON.stringify(payload),
    })
    return (res as any).data ?? (res as any)
  }

  async updateMenuSection(menuId: string, sectionId: string, payload: UpdateMenuSectionRequest): Promise<MenuResponse> {
    const res = await apiClient<{ data: MenuResponse }>(RESTAURANT_API.menu.section(menuId, sectionId), {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    return (res as any).data ?? (res as any)
  }

  async deleteMenuSection(menuId: string, sectionId: string): Promise<void> {
    await apiClient<void>(RESTAURANT_API.menu.section(menuId, sectionId), { method: "DELETE" })
  }

  async addDishToSection(menuId: string, sectionId: string, dishId: string, displayOrder = 0): Promise<MenuResponse> {
    const res = await apiClient<{ data: MenuResponse }>(RESTAURANT_API.menu.sectionDishes(menuId, sectionId), {
      method: "POST",
      body: JSON.stringify({ dishId, displayOrder }),
    })
    return (res as any).data ?? (res as any)
  }

  async removeDishFromSection(menuId: string, sectionId: string, dishId: string): Promise<MenuResponse> {
    const res = await apiClient<{ data: MenuResponse }>(
      RESTAURANT_API.menu.sectionDish(menuId, sectionId, dishId),
      { method: "DELETE" }
    )
    return (res as any).data ?? (res as any)
  }

  // -------- Books --------

  async createBook(payload: CreateBookRequest): Promise<BookResponse> {
    const form = new FormData()
    // Append each field explicitly to ensure correct types for multipart/form-data.
    // Booleans must be sent as "true"/"false" strings that ASP.NET can bind,
    // and File objects must be appended directly (not coerced via toString).
    if (payload.title !== undefined) form.append("title", payload.title)
    if (payload.content !== undefined) form.append("content", payload.content)
    if (payload.excerpt !== undefined) form.append("excerpt", payload.excerpt)
    if (payload.tags !== undefined) form.append("tags", payload.tags)
    if (payload.isPublished !== undefined) form.append("isPublished", String(payload.isPublished))
    if (payload.coverImage instanceof File) form.append("coverImage", payload.coverImage)
    const res = await apiClientUpload<{ data: BookResponse }>(RESTAURANT_API.books.create, form)
    return (res as any).data ?? (res as any)
  }

  async getBookById(id: string): Promise<BookResponse> {
    const res = await apiClient<{ data: BookResponse }>(RESTAURANT_API.books.byId(id), { method: "GET" })
    return (res as any).data ?? (res as any)
  }

  async getBookBySlug(slug: string): Promise<BookResponse> {
    const res = await apiClient<{ data: BookResponse }>(RESTAURANT_API.books.bySlug(slug), { method: "GET" })
    return (res as any).data ?? (res as any)
  }

  async getMyBooks(page = 1, pageSize = 20): Promise<Paginated<BookSummaryResponse>> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    return apiClient<Paginated<BookSummaryResponse>>(`${RESTAURANT_API.books.myBooks}?${params}`, { method: "GET" })
  }

  async getRestaurantBooks(restaurantId: string, page = 1): Promise<Paginated<BookSummaryResponse>> {
    const params = new URLSearchParams({ page: String(page) })
    return apiClient<Paginated<BookSummaryResponse>>(
      `${RESTAURANT_API.books.byRestaurant(restaurantId)}?${params}`,
      { method: "GET" }
    )
  }

  async searchBooks(q: string, page = 1): Promise<Paginated<BookSummaryResponse>> {
    const params = new URLSearchParams({ q, page: String(page) })
    return apiClient<Paginated<BookSummaryResponse>>(`${RESTAURANT_API.books.search}?${params}`, { method: "GET" })
  }

  async updateBook(id: string, payload: UpdateBookRequest): Promise<BookResponse> {
    const form = new FormData()
    // Append each field explicitly — booleans must be strings, Files must not be coerced.
    if (payload.title !== undefined) form.append("title", payload.title)
    if (payload.content !== undefined) form.append("content", payload.content)
    if (payload.excerpt !== undefined) form.append("excerpt", payload.excerpt)
    if (payload.tags !== undefined) form.append("tags", payload.tags)
    if (payload.isPublished !== undefined) form.append("isPublished", String(payload.isPublished))
    if (payload.coverImage instanceof File) form.append("coverImage", payload.coverImage)
    const res = await apiClientUpload<{ data: BookResponse }>(RESTAURANT_API.books.byId(id), form, {
      method: "PUT",
    } as any)
    return (res as any).data ?? (res as any)
  }

  async deleteBook(id: string): Promise<void> {
    await apiClient<void>(RESTAURANT_API.books.byId(id), { method: "DELETE" })
  }
}

export const restaurantService = new RestaurantService()