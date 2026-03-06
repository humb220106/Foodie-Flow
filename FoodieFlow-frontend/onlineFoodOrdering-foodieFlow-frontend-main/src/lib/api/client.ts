/**
 * API Client for FoodieFlow
 * Handles authentication, request/response formatting, and error handling
 */

import { getAccessToken } from "./tokens"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7297"

interface RequestOptions extends RequestInit {
  token?: string
  skipAuth?: boolean
}

/**
 * Generic API client with proper error handling
 * Handles 204 No Content responses correctly
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuth, ...fetchOptions } = options

  // Build full URL
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`

  // Setup headers as a plain object to allow string indexing
  const headers: Record<string, string> = {
    ...(typeof fetchOptions.headers === "object" && !Array.isArray(fetchOptions.headers)
      ? fetchOptions.headers as Record<string, string>
      : {}),
  }

  // Add Content-Type for JSON bodies (but not for FormData)
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json"
  }

  // Add authentication token
  if (!skipAuth) {
    const authToken = token || getAccessToken()
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`
    }
  }

  try {
    // Make the request
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    })

    // Handle error responses
    if (!response.ok) {
      // Try to parse error response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        // If JSON parsing fails, use status text
      }

      throw new Error(errorMessage)
    }

    // Handle 204 No Content (DELETE operations)
    if (response.status === 204) {
      return undefined as T
    }

    // Handle empty responses
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      return undefined as T
    }

    // Parse JSON response
    const data = await response.json()
    return data as T

  } catch (error: any) {
    // Network errors or other fetch errors
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      throw new Error("Network error: Unable to connect to server")
    }
    
    // Re-throw other errors
    throw error
  }
}

/**
 * Specialized client for file uploads (multipart/form-data)
 */
export async function apiClientUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: options.method ?? "POST",   // allow PUT/PATCH overrides
    body: formData,
    // Don't set Content-Type - browser will set it with boundary for multipart
  })
}

/**
 * GET request helper
 */
export async function get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, { ...options, method: "GET" })
}

/**
 * POST request helper
 */
export async function post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request helper
 */
export async function put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request helper - properly handles 204 No Content
 */
export async function del(endpoint: string, options?: RequestOptions): Promise<void> {
  await apiClient<void>(endpoint, { ...options, method: "DELETE" })
}

/**
 * PATCH request helper
 */
export async function patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
  return apiClient<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  })
}