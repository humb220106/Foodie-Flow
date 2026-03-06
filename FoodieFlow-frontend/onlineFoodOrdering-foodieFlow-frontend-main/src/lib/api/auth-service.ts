/**
 * Authentication Service for FoodieFlow
 * Based on AUTH_API_DOCUMENTATION.md
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7297"

// ==================== INTERFACES ====================

export interface LoginRequest {
  username: string
  password: string
  ipAddress?: string
  userAgent?: string
}

export interface LoginResponse {
  message: string
  data: {
    accessToken: string
    refreshToken: string
    expiresAt: string
  }
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export class AuthService {
  /**
   * Register as Customer
   * Endpoint: POST /api/auth/register
   */
  async registerCustomer(data: {
    username: string
    email: string
    password: string
    phone: string
  }): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          role: "Customer", // Must be exactly "Customer"
        }),
      })

      if (!response.ok) {
        let errorMessage = "Registration failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorData.title || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        throw new Error("Network error: Unable to connect to server")
      }
      throw error
    }
  }

  /**
   * Register as Restaurant Owner
   * Endpoint: POST /api/auth/register-restaurant
   * Content-Type: multipart/form-data
   */
  async registerRestaurant(formData: FormData): Promise<{ message: string; restaurantName?: string }> {
    try {
      // Ensure role is set to "Restaurant" (exact case)
      formData.set("role", "Restaurant")

      const response = await fetch(`${API_BASE_URL}/api/auth/register-restaurant`, {
        method: "POST",
        body: formData,
        // Don't set Content-Type, browser sets it with boundary
      })

      if (!response.ok) {
        let errorMessage = "Restaurant registration failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorData.title || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error: any) {
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        throw new Error("Network error: Unable to connect to server")
      }
      throw error
    }
  }

  /**
   * Login
   * Endpoint: POST /api/auth/login
   * Returns: { message, data: { accessToken, refreshToken, expiresAt } }
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = "Login failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorData.title || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      // Store tokens
      if (result.data?.accessToken) {
        localStorage.setItem("access_token", result.data.accessToken)
      }
      if (result.data?.refreshToken) {
        localStorage.setItem("refresh_token", result.data.refreshToken)
      }
      if (result.data?.expiresAt) {
        localStorage.setItem("token_expires_at", result.data.expiresAt)
      }

      return result
    } catch (error: any) {
      if (error.name === "TypeError" && error.message === "Failed to fetch") {
        throw new Error("Network error: Unable to connect to server")
      }
      throw error
    }
  }

  /**
   * Verify Email
   * Endpoint: POST /api/auth/verify-email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        let errorMessage = "Email verification failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Resend Verification Email
   * Endpoint: POST /api/auth/resend-verification
   */
  async resendVerification(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to resend verification email")
      }

      return await response.json()
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Forgot Password
   * Endpoint: POST /api/auth/forgot-password
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error("Failed to send password reset email")
      }

      return await response.json()
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Reset Password
   * Endpoint: POST /api/auth/reset-password
   * Body: { token, newPassword }
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = "Password reset failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Change Password
   * Endpoint: POST /api/auth/change-password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const accessToken = localStorage.getItem("access_token")

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = "Password change failed"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Refresh Token
   * Endpoint: POST /api/auth/refresh-token
   */
  async refreshToken(refreshToken?: string): Promise<LoginResponse> {
    const token = refreshToken || localStorage.getItem("refresh_token")

    if (!token) {
      throw new Error("No refresh token available")
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: token }),
      })

      if (!response.ok) {
        throw new Error("Token refresh failed")
      }

      const result = await response.json()

      // Update stored tokens
      if (result.data?.accessToken) {
        localStorage.setItem("access_token", result.data.accessToken)
      }
      if (result.data?.refreshToken) {
        localStorage.setItem("refresh_token", result.data.refreshToken)
      }
      if (result.data?.expiresAt) {
        localStorage.setItem("token_expires_at", result.data.expiresAt)
      }

      return result
    } catch (error: any) {
      this.clearTokens()
      throw error
    }
  }

  /**
   * Logout (single device)
   * Endpoint: POST /api/auth/revoke-token
   */
  async logout(): Promise<void> {
    const accessToken = localStorage.getItem("access_token")
    const refreshToken = localStorage.getItem("refresh_token")

    try {
      if (accessToken && refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/revoke-token`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      this.clearTokens()
    }
  }

  /**
   * Logout All Devices
   * Endpoint: POST /api/auth/revoke-all-tokens
   */
  async logoutAll(): Promise<void> {
    const accessToken = localStorage.getItem("access_token")

    try {
      if (accessToken) {
        await fetch(`${API_BASE_URL}/api/auth/revoke-all-tokens`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        })
      }
    } catch (error) {
      console.error("Logout all error:", error)
    } finally {
      this.clearTokens()
    }
  }

  /**
   * Get Active Sessions
   * Endpoint: GET /api/auth/sessions
   */
  async getActiveSessions(): Promise<any[]> {
    const accessToken = localStorage.getItem("access_token")
    const refreshToken = localStorage.getItem("refresh_token")

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/sessions`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "X-Refresh-Token": refreshToken || "",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to get active sessions")
      }

      return await response.json()
    } catch (error: any) {
      throw error
    }
  }

  /**
   * Clear stored tokens
   */
  clearTokens(): void {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("token_expires_at")
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token")
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem("access_token")
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem("refresh_token")
  }
}

// Export singleton instance
export const authService = new AuthService()