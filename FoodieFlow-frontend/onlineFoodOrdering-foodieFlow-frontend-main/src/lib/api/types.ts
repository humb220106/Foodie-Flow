// ===================================
// REQUEST TYPES
// ===================================

export interface RegisterCustomerRequest {
  username: string
  email: string
  password: string
  phone: string
  role: "Customer"
  ipAddress?: string
}

export interface RegisterRestaurantRequest {
  // User credentials (required)
  username: string
  email: string
  password: string
  phone: string
  role: "Restaurant"
  
  // Restaurant info (required)
  restaurantName: string
  
  // Optional restaurant details
  restaurantDescription?: string
  restaurantPhone?: string
  cuisineType?: string
  taxID?: string
  
  // Optional location
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  
  // Optional images (handled via FormData)
  restaurantLogo?: File
  restaurantBanner?: File
  
  ipAddress?: string
}

export interface LoginRequest {
  username: string
  password: string
  ipAddress?: string
  userAgent?: string
}

export interface VerifyEmailRequest {
  token: string
}

export interface ResendVerificationRequest {
  email: string
}

export interface RefreshTokenRequest {
  refreshToken: string
  ipAddress?: string
  userAgent?: string
}

export interface RevokeTokenRequest {
  refreshToken: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

// ===================================
// RESPONSE TYPES
// ===================================

export interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: string // ISO 8601 date string
}

export interface LoginResponse {
  message: string
  data: TokenData
}

export interface RefreshTokenResponse {
  message: string
  data: TokenData
}

export interface RegisterResponse {
  message: string
}

export interface RegisterRestaurantResponse {
  message: string
  restaurantName?: string
}

export interface VerifyEmailResponse {
  message: string
}

export interface GenericMessageResponse {
  message: string
}

export interface UserSession {
  id: string
  ipAddress: string
  userAgent: string
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}

export interface SessionsResponse {
  data: UserSession[]
}

export interface ApiErrorResponse {
  message: string
  errors?: Record<string, string[]>
}