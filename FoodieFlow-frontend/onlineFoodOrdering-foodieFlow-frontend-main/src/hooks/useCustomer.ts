// "use client"

// import { useState, useEffect, useCallback } from "react"
// import { useRouter } from "next/navigation"
// import {
//   customerService,
//   cartService,
//   RestaurantResponse,
//   DishResponse,
//   CategoryResponse,
//   OrderResponse,
//   MenuResponse,
//   ReviewResponse,
//   ReviewSummary,
//   CreateOrderRequest,
//   UserProfile,
// } from "@/lib/api/customer-service"
// import { clearTokens } from "@/lib/api/tokens"

// // ── useCustomerAuth ────────────────────────────────────────────────────────────
// // Redirects to /login if no token. Returns parsed token user + full profile.

// export function useCustomerAuth() {
//   const router = useRouter()
//   const [tokenUser, setTokenUser] = useState<{ id: string; username: string; email: string; roles: string[] } | null>(null)
//   const [profile, setProfile]     = useState<UserProfile | null>(null)
//   const [loading, setLoading]     = useState(true)

//   useEffect(() => {
//     const u = customerService.parseUserFromToken()
//     if (!u) { router.replace("/login"); return }
//     setTokenUser(u)
//     customerService.getProfile()
//       .then(p => setProfile(p))
//       .catch(() => {/* profile fetch failing is non-fatal */})
//       .finally(() => setLoading(false))
//   }, [router])

//   function logout() {
//     clearTokens()
//     router.push("/login")
//   }

//   return { tokenUser, profile, loading, logout }
// }

// // ── useCart ────────────────────────────────────────────────────────────────────
// // Reactive wrapper around cartService (localStorage). Re-renders on change.

// export function useCart() {
//   const [items, setItems] = useState(() => cartService.get())

//   function refresh() { setItems(cartService.get()) }

//   function addItem(item: Parameters<typeof cartService.add>[0]) {
//     const ok = cartService.add(item)
//     if (ok) refresh()
//     return ok
//   }

//   function removeItem(dishId: string) {
//     cartService.remove(dishId)
//     refresh()
//   }

//   function updateQty(dishId: string, quantity: number) {
//     cartService.updateQty(dishId, quantity)
//     refresh()
//   }

//   function clearCart() {
//     cartService.clear()
//     refresh()
//   }

//   const total = items.reduce((s, c) => s + c.price * c.quantity, 0)
//   const count = items.reduce((s, c) => s + c.quantity, 0)

//   return { items, total, count, addItem, removeItem, updateQty, clearCart }
// }

// // ── useRestaurantPage ──────────────────────────────────────────────────────────
// // Loads restaurant + menu + reviews for the restaurant detail page.

// export function useRestaurantPage(restaurantId: string) {
//   const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null)
//   const [menu, setMenu]             = useState<MenuResponse | null>(null)
//   const [reviews, setReviews]       = useState<ReviewResponse[]>([])
//   const [summary, setSummary]       = useState<ReviewSummary | null>(null)
//   const [loading, setLoading]       = useState(true)
//   const [error, setError]           = useState<string | null>(null)

//   const load = useCallback(async () => {
//     if (!restaurantId) return
//     try {
//       setLoading(true); setError(null)
//       const [rest, menuData, reviewData] = await Promise.allSettled([
//         customerService.getRestaurantById(restaurantId),
//         customerService.getDefaultMenu(restaurantId),
//         customerService.getRestaurantReviews(restaurantId, 1, 10),
//       ])
//       if (rest.status === "fulfilled")   setRestaurant(rest.value)
//       else throw new Error("Restaurant not found")
//       if (menuData.status === "fulfilled") setMenu(menuData.value)
//       if (reviewData.status === "fulfilled" && reviewData.value) {
//         setReviews(reviewData.value.reviews?.map(r => r.review) ?? [])
//         setSummary(reviewData.value.summary ?? null)
//       }
//     } catch (e: any) {
//       setError(e?.message || "Failed to load restaurant.")
//     } finally {
//       setLoading(false)
//     }
//   }, [restaurantId])

//   useEffect(() => { void load() }, [load])

//   return { restaurant, menu, reviews, summary, loading, error, reload: load }
// }

// // ── useOrders ──────────────────────────────────────────────────────────────────
// // Paginated order list with filter support.

// export function useOrders() {
//   const [orders, setOrders]   = useState<OrderResponse[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError]     = useState<string | null>(null)
//   const [page, setPage]       = useState(1)
//   const [hasMore, setHasMore] = useState(false)
//   const PAGE_SIZE = 10

//   const load = useCallback(async (p: number, reset = false) => {
//     try {
//       setLoading(true); setError(null)
//       const res = await customerService.getMyOrders(p, PAGE_SIZE)
//       setOrders(prev => reset ? res.data : [...prev, ...res.data])
//       setHasMore(res.data.length === PAGE_SIZE)
//       setPage(p)
//     } catch (e: any) {
//       setError(e?.message || "Failed to load orders.")
//     } finally {
//       setLoading(false)
//     }
//   }, [])

//   useEffect(() => { void load(1, true) }, [load])

//   function loadMore() { load(page + 1) }

//   return { orders, loading, error, hasMore, loadMore, reload: () => load(1, true) }
// }

// // ── useOrderDetail ─────────────────────────────────────────────────────────────
// // Single order with live polling while active.

// const ACTIVE_STATUSES: OrderResponse["status"][] = ["Pending","Accepted","Preparing","Ready","PickedUp","OnTheWay"]

// export function useOrderDetail(orderId: string) {
//   const [order, setOrder]     = useState<OrderResponse | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError]     = useState<string | null>(null)
//   const [cancelling, setCancelling] = useState(false)

//   const load = useCallback(async () => {
//     try {
//       setLoading(true); setError(null)
//       const o = await customerService.getOrderById(orderId)
//       setOrder(o)
//     } catch (e: any) {
//       setError(e?.message || "Failed to load order.")
//     } finally {
//       setLoading(false)
//     }
//   }, [orderId])

//   useEffect(() => { void load() }, [load])

//   // Poll every 10 s while active
//   useEffect(() => {
//     if (!order || !ACTIVE_STATUSES.includes(order.status)) return
//     const t = setInterval(load, 10000)
//     return () => clearInterval(t)
//   }, [order, load])

//   async function cancelOrder(reason: string): Promise<boolean> {
//     try {
//       setCancelling(true)
//       const updated = await customerService.cancelOrder(orderId, reason)
//       setOrder(updated)
//       return true
//     } catch { return false } finally { setCancelling(false) }
//   }

//   return { order, loading, error, cancelling, reload: load, cancelOrder }
// }

// // ── useCheckout ────────────────────────────────────────────────────────────────
// // Handles the full checkout + pay flow.

// export function useCheckout() {
//   const [placing, setPlacing]   = useState(false)
//   const [paying, setPaying]     = useState(false)
//   const [error, setError]       = useState<string | null>(null)
//   const [orderId, setOrderId]   = useState<string | null>(null)
//   const [orderNumber, setOrderNumber] = useState<string | null>(null)

//   async function placeAndPay(req: CreateOrderRequest): Promise<boolean> {
//     try {
//       setError(null)
//       setPlacing(true)
//       const created = await customerService.placeOrder(req)
//       setOrderId(created.orderId)
//       setOrderNumber(created.orderNumber)
//       setPlacing(false)

//       setPaying(true)
//       await customerService.payOrder(created.orderId)
//       cartService.clear()
//       return true
//     } catch (e: any) {
//       setError(e?.message || "Checkout failed.")
//       return false
//     } finally {
//       setPlacing(false)
//       setPaying(false)
//     }
//   }

//   return { placing, paying, error, orderId, orderNumber, placeAndPay }
// }

// // ── useSearch ─────────────────────────────────────────────────────────────────
// // Debounced restaurant search.

// export function useSearch(initialQuery = "") {
//   const [query, setQuery]             = useState(initialQuery)
//   const [results, setResults]         = useState<RestaurantResponse[]>([])
//   const [categories, setCategories]   = useState<CategoryResponse[]>([])
//   const [loading, setLoading]         = useState(false)
//   const [error, setError]             = useState<string | null>(null)

//   useEffect(() => {
//     customerService.getRootCategories()
//       .then(setCategories)
//       .catch(() => {})
//   }, [])

//   useEffect(() => {
//     if (!query.trim()) { setResults([]); return }
//     const t = setTimeout(async () => {
//       setLoading(true); setError(null)
//       try { setResults(await customerService.searchRestaurants(query.trim())) }
//       catch (e: any) { setError(e?.message || "Search failed."); setResults([]) }
//       finally { setLoading(false) }
//     }, 350)
//     return () => clearTimeout(t)
//   }, [query])

//   return { query, setQuery, results, categories, loading, error }
// }

// // ── useProfile ────────────────────────────────────────────────────────────────
// // Loads full profile + review history.

// export function useProfile() {
//   const [profile, setProfile]     = useState<UserProfile | null>(null)
//   const [dishReviews, setDishReviews]           = useState<any[]>([])
//   const [restaurantReviews, setRestaurantReviews] = useState<any[]>([])
//   const [loading, setLoading]     = useState(true)
//   const [error, setError]         = useState<string | null>(null)

//   useEffect(() => {
//     async function load() {
//       try {
//         setLoading(true); setError(null)
//         const [prof, dr, rr] = await Promise.allSettled([
//           customerService.getProfile(),
//           customerService.getMyDishReviews(),
//           customerService.getMyRestaurantReviews(),
//         ])
//         if (prof.status === "fulfilled") setProfile(prof.value)
//         if (dr.status === "fulfilled")   setDishReviews(dr.value.data ?? [])
//         if (rr.status === "fulfilled")   setRestaurantReviews(rr.value.data ?? [])
//       } catch (e: any) {
//         setError(e?.message || "Failed to load profile.")
//       } finally {
//         setLoading(false)
//       }
//     }
//     void load()
//   }, [])

//   return { profile, dishReviews, restaurantReviews, loading, error }
// }





"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  customerService,
  cartService,
  RestaurantResponse,
  DishResponse,
  CategoryResponse,
  OrderResponse,
  MenuResponse,
  ReviewResponse,
  ReviewSummary,
  CreateOrderRequest,
  UserProfile,
} from "@/lib/api/customer-service"
import { clearTokens } from "@/lib/api/tokens"

// ── useCustomerAuth ────────────────────────────────────────────────────────────
// Redirects to /login if no token. Returns parsed token user + full profile.

export function useCustomerAuth() {
  const router = useRouter()
  const [tokenUser, setTokenUser] = useState<{ id: string; username: string; email: string; roles: string[] } | null>(null)
  const [profile, setProfile]     = useState<UserProfile | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const u = customerService.parseUserFromToken()
    if (!u) { router.replace("/login"); return }
    setTokenUser(u)
    customerService.getProfile()
      .then(p => setProfile(p))
      .catch(() => {/* profile fetch failing is non-fatal */})
      .finally(() => setLoading(false))
  }, [router])

  function logout() {
    clearTokens()
    router.push("/login")
  }

  return { tokenUser, profile, loading, logout }
}

// ── useCart ────────────────────────────────────────────────────────────────────
// Reactive wrapper around cartService (localStorage). Re-renders on change.

export function useCart() {
  const [items, setItems] = useState(() => cartService.get())

  function refresh() { setItems(cartService.get()) }

  function addItem(item: Parameters<typeof cartService.add>[0]) {
    const ok = cartService.add(item)
    if (ok) refresh()
    return ok
  }

  function removeItem(dishId: string) {
    cartService.remove(dishId)
    refresh()
  }

  function updateQty(dishId: string, quantity: number) {
    cartService.updateQty(dishId, quantity)
    refresh()
  }

  function clearCart() {
    cartService.clear()
    refresh()
  }

  const total = items.reduce((s, c) => s + c.price * c.quantity, 0)
  const count = items.reduce((s, c) => s + c.quantity, 0)

  return { items, total, count, addItem, removeItem, updateQty, clearCart }
}

// ── useRestaurantPage ──────────────────────────────────────────────────────────
// Loads restaurant + menu + reviews for the restaurant detail page.

export function useRestaurantPage(restaurantId: string) {
  const [restaurant, setRestaurant] = useState<RestaurantResponse | null>(null)
  const [menu, setMenu]             = useState<MenuResponse | null>(null)
  const [reviews, setReviews]       = useState<ReviewResponse[]>([])
  const [summary, setSummary]       = useState<ReviewSummary | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!restaurantId) return
    try {
      setLoading(true); setError(null)
      const [rest, menuData, reviewData] = await Promise.allSettled([
        customerService.getRestaurantById(restaurantId),
        customerService.getDefaultMenu(restaurantId),
        customerService.getRestaurantReviews(restaurantId, 1, 10),
      ])
      if (rest.status === "fulfilled")   setRestaurant(rest.value)
      else throw new Error("Restaurant not found")
      if (menuData.status === "fulfilled") setMenu(menuData.value)
      if (reviewData.status === "fulfilled" && reviewData.value) {
        setReviews(reviewData.value.items?.map(r => r.review) ?? [])
        setSummary(reviewData.value.summary ?? null)
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load restaurant.")
    } finally {
      setLoading(false)
    }
  }, [restaurantId])

  useEffect(() => { void load() }, [load])

  return { restaurant, menu, reviews, summary, loading, error, reload: load }
}

// ── useOrders ──────────────────────────────────────────────────────────────────
// Paginated order list with filter support.

export function useOrders() {
  const [orders, setOrders]   = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [page, setPage]       = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const PAGE_SIZE = 10

  const load = useCallback(async (p: number, reset = false) => {
    try {
      setLoading(true); setError(null)
      const res = await customerService.getMyOrders(p, PAGE_SIZE)
      setOrders(prev => reset ? res.data : [...prev, ...res.data])
      setHasMore(res.data.length === PAGE_SIZE)
      setPage(p)
    } catch (e: any) {
      setError(e?.message || "Failed to load orders.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load(1, true) }, [load])

  function loadMore() { load(page + 1) }

  return { orders, loading, error, hasMore, loadMore, reload: () => load(1, true) }
}

// ── useOrderDetail ─────────────────────────────────────────────────────────────
// Single order with live polling while active.

const ACTIVE_STATUSES: OrderResponse["status"][] = ["Pending","Accepted","Preparing","Ready","PickedUp","OnTheWay"]

export function useOrderDetail(orderId: string) {
  const [order, setOrder]     = useState<OrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const o = await customerService.getOrderById(orderId)
      setOrder(o)
    } catch (e: any) {
      setError(e?.message || "Failed to load order.")
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => { void load() }, [load])

  // Poll every 10 s while active
  useEffect(() => {
    if (!order || !ACTIVE_STATUSES.includes(order.status)) return
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [order, load])

  async function cancelOrder(reason: string): Promise<boolean> {
    try {
      setCancelling(true)
      const updated = await customerService.cancelOrder(orderId, reason)
      setOrder(updated)
      return true
    } catch { return false } finally { setCancelling(false) }
  }

  return { order, loading, error, cancelling, reload: load, cancelOrder }
}

// ── useCheckout ────────────────────────────────────────────────────────────────
// Handles the full checkout + pay flow.

export function useCheckout() {
  const [placing, setPlacing]   = useState(false)
  const [paying, setPaying]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [orderId, setOrderId]   = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)

  async function placeAndPay(req: CreateOrderRequest): Promise<boolean> {
    try {
      setError(null)
      setPlacing(true)
      const created = await customerService.placeOrder(req)
      setOrderId(created.orderId)
      setOrderNumber(created.orderNumber)
      setPlacing(false)

      setPaying(true)
      await customerService.payOrder(created.orderId)
      cartService.clear()
      return true
    } catch (e: any) {
      setError(e?.message || "Checkout failed.")
      return false
    } finally {
      setPlacing(false)
      setPaying(false)
    }
  }

  return { placing, paying, error, orderId, orderNumber, placeAndPay }
}

// ── useSearch ─────────────────────────────────────────────────────────────────
// Debounced restaurant search.

export function useSearch(initialQuery = "") {
  const [query, setQuery]             = useState(initialQuery)
  const [results, setResults]         = useState<RestaurantResponse[]>([])
  const [categories, setCategories]   = useState<CategoryResponse[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    customerService.getRootCategories()
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setLoading(true); setError(null)
      try { setResults(await customerService.searchRestaurants(query.trim())) }
      catch (e: any) { setError(e?.message || "Search failed."); setResults([]) }
      finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  return { query, setQuery, results, categories, loading, error }
}

// ── useProfile ────────────────────────────────────────────────────────────────
// Loads full profile + review history.

export function useProfile() {
  const [profile, setProfile]     = useState<UserProfile | null>(null)
  const [dishReviews, setDishReviews]           = useState<any[]>([])
  const [restaurantReviews, setRestaurantReviews] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true); setError(null)
        const [prof, dr, rr] = await Promise.allSettled([
          customerService.getProfile(),
          customerService.getMyDishReviews(),
          customerService.getMyRestaurantReviews(),
        ])
        if (prof.status === "fulfilled") setProfile(prof.value)
        if (dr.status === "fulfilled")   setDishReviews(dr.value.data ?? [])
        if (rr.status === "fulfilled")   setRestaurantReviews(rr.value.data ?? [])
      } catch (e: any) {
        setError(e?.message || "Failed to load profile.")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  return { profile, dishReviews, restaurantReviews, loading, error }
}