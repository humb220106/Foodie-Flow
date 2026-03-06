import { API_BASE_URL } from "@/lib/config"

export const API = {
  auth: {
    registerCustomer: `${API_BASE_URL}/api/auth/register`,
    registerRestaurant: `${API_BASE_URL}/api/auth/register-restaurant`,
    login: `${API_BASE_URL}/api/auth/login`,
    verifyEmail: `${API_BASE_URL}/api/auth/verify-email`,
    resendVerification: `${API_BASE_URL}/api/auth/resend-verification`,
    refreshToken: `${API_BASE_URL}/api/auth/refresh-token`,
    revokeToken: `${API_BASE_URL}/api/auth/revoke-token`,
    revokeAllTokens: `${API_BASE_URL}/api/auth/revoke-all-tokens`,
    sessions: `${API_BASE_URL}/api/auth/sessions`,
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
    changePassword: `${API_BASE_URL}/api/auth/change-password`,
  },

  // Future endpoints
  // restaurants: `${API_BASE_URL}/api/restaurants`,
  // menu: `${API_BASE_URL}/api/menu`,
  // orders: `${API_BASE_URL}/api/orders`,
  // search: `${API_BASE_URL}/api/search`,
}