"use client"

import { useState } from "react"
import { adminService } from "@/lib/api/admin-service"
import type {
  OrderStatus,
  ReviewStatus,
  PushNotificationRequest,
} from "@/lib/api/admin-service"

export function useAdmin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function clearError() {
    setError(null)
  }

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    try {
      setIsLoading(true)
      setError(null)
      return await fn()
    } catch (err: any) {
      const message = err?.message || "An unexpected error occurred"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // ==================== DASHBOARD ====================

  async function getDashboardStats() {
    return run(() => adminService.getDashboardStats())
  }

  // ==================== USERS ====================

  async function getUsers(page = 1, pageSize = 20) {
    return run(() => adminService.getUsers(page, pageSize))
  }

  async function getUserById(id: string) {
    return run(() => adminService.getUserById(id))
  }

  async function updateUserStatus(id: string, isActive: boolean, reason?: string) {
    return run(() => adminService.updateUserStatus(id, isActive, reason))
  }

  async function assignUserRole(id: string, role: string) {
    return run(() => adminService.assignUserRole(id, role))
  }

  async function deleteUser(id: string) {
    return run(() => adminService.deleteUser(id))
  }

  // ==================== RESTAURANTS ====================

  async function getRestaurants(page = 1, pageSize = 20) {
    return run(() => adminService.getRestaurants(page, pageSize))
  }

  async function getRestaurantById(id: string) {
    return run(() => adminService.getRestaurantById(id))
  }

  async function updateRestaurantStatus(id: string, isActive: boolean, reason?: string) {
    return run(() => adminService.updateRestaurantStatus(id, isActive, reason))
  }

  async function deleteRestaurant(id: string) {
    return run(() => adminService.deleteRestaurant(id))
  }

  // ==================== DISHES ====================

  async function getDishes(page = 1, pageSize = 20) {
    return run(() => adminService.getDishes(page, pageSize))
  }

  async function updateDishStatus(id: string, isActive: boolean, isAvailable: boolean) {
    return run(() => adminService.updateDishStatus(id, isActive, isAvailable))
  }

  async function deleteDish(id: string) {
    return run(() => adminService.deleteDish(id))
  }

  // ==================== ORDERS ====================

  async function getOrders(page = 1, pageSize = 20) {
    return run(() => adminService.getOrders(page, pageSize))
  }

  async function getOrdersByStatus(status: OrderStatus, page = 1, pageSize = 20) {
    return run(() => adminService.getOrdersByStatus(status, page, pageSize))
  }

  async function getOrderById(id: string) {
    return run(() => adminService.getOrderById(id))
  }

  // ==================== REVIEWS ====================

  async function getReviews(page = 1, pageSize = 20) {
    return run(() => adminService.getReviews(page, pageSize))
  }

  async function updateReviewStatus(id: string, status: ReviewStatus, reason?: string) {
    return run(() => adminService.updateReviewStatus(id, status, reason))
  }

  async function deleteReview(id: string) {
    return run(() => adminService.deleteReview(id))
  }

  // ==================== AUDIT LOGS ====================

  async function getAuditLogs(page = 1, pageSize = 50) {
    return run(() => adminService.getAuditLogs(page, pageSize))
  }

  async function getUserAuditLogs(userId: string, page = 1, pageSize = 50) {
    return run(() => adminService.getUserAuditLogs(userId, page, pageSize))
  }

  // ==================== CATEGORIES ====================

  async function getCategories() {
    return run(() => adminService.getOnlyCategories())
  }

  async function createCategory(data: { name: string; description?: string; icon?: string; parentCategoryId?: string }) {
    return run(() => adminService.createCategory(data))
  }

  async function updateCategory(id: string, data: { name?: string; description?: string; icon?: string; parentCategoryId?: string }) {
    return run(() => adminService.updateCategory(id, data))
  }

  async function deleteCategory(id: string) {
    return run(() => adminService.deleteCategory(id))
  }

  // ==================== FOOD TYPES ====================

  async function getFoodTypes() {
    return run(() => adminService.getOnlyFoodTypes())
  }

  async function createFoodType(data: { name: string; description?: string; icon?: string; parentCategoryId?: string }) {
    return run(() => adminService.createFoodType(data))
  }

  async function updateFoodType(id: string, data: { name?: string; description?: string; icon?: string; parentCategoryId?: string }) {
    return run(() => adminService.updateFoodType(id, data))
  }

  async function deleteFoodType(id: string) {
    return run(() => adminService.deleteFoodType(id))
  }

  // ==================== NOTIFICATIONS ====================

  async function sendPushNotification(data: PushNotificationRequest) {
    return run(() => adminService.sendPushNotification(data))
  }

  return {
    isLoading,
    error,
    clearError,

    // Dashboard
    getDashboardStats,

    // Users
    getUsers,
    getUserById,
    updateUserStatus,
    assignUserRole,
    deleteUser,

    // Restaurants
    getRestaurants,
    getRestaurantById,
    updateRestaurantStatus,
    deleteRestaurant,

    // Dishes
    getDishes,
    updateDishStatus,
    deleteDish,

    // Orders
    getOrders,
    getOrdersByStatus,
    getOrderById,

    // Reviews
    getReviews,
    updateReviewStatus,
    deleteReview,

    // Audit Logs
    getAuditLogs,
    getUserAuditLogs,

    // Categories
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,

    // Food Types
    getFoodTypes,
    createFoodType,
    updateFoodType,
    deleteFoodType,

    // Notifications
    sendPushNotification,
  }
}