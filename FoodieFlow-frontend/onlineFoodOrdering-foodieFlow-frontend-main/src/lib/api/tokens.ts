// const ACCESS_TOKEN_KEY = "ff_access_token"
// const REFRESH_TOKEN_KEY = "ff_refresh_token"
// const EXPIRES_AT_KEY = "ff_expires_at"

// function isBrowser() {
//   return typeof window !== "undefined"
// }

// export type StoredTokens = {
//   accessToken: string
//   refreshToken: string
//   expiresAt?: string
// }

// export function setTokens(tokens: StoredTokens) {
//   if (!isBrowser()) return
//   sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
//   sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
//   if (tokens.expiresAt) sessionStorage.setItem(EXPIRES_AT_KEY, tokens.expiresAt)
// }

// export function getAccessToken() {
//   if (!isBrowser()) return null
//   return sessionStorage.getItem(ACCESS_TOKEN_KEY)
// }

// export function getRefreshToken() {
//   if (!isBrowser()) return null
//   return sessionStorage.getItem(REFRESH_TOKEN_KEY)
// }

// export function getExpiresAt() {
//   if (!isBrowser()) return null
//   return sessionStorage.getItem(EXPIRES_AT_KEY)
// }

// export function clearTokens() {
//   if (!isBrowser()) return
//   sessionStorage.removeItem(ACCESS_TOKEN_KEY)
//   sessionStorage.removeItem(REFRESH_TOKEN_KEY)
//   sessionStorage.removeItem(EXPIRES_AT_KEY)
// }

// export function isTokenExpiredSoon(bufferMs = 5 * 60 * 1000) {
//   const expiresAt = getExpiresAt()
//   if (!expiresAt) return false
//   const exp = new Date(expiresAt).getTime()
//   return Date.now() + bufferMs >= exp
// }

// this was what claude give me based when i asked to update based on the file
// 4. Update lib/api/tokens.ts ⚠️ (Use localStorage instead of sessionStorage)
// According to the documentation, tokens should persist across browser sessions. Here's the updated version:

// Backward compatible: support both the original keys used in this repo
// and the keys currently written by AuthService (access_token, refresh_token, token_expires_at).
const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const EXPIRES_AT_KEY = "token_expires_at"

const LEGACY_ACCESS_TOKEN_KEY = "ff_access_token"
const LEGACY_REFRESH_TOKEN_KEY = "ff_refresh_token"
const LEGACY_EXPIRES_AT_KEY = "ff_expires_at"

function isBrowser() {
  return typeof window !== "undefined"
}

export type StoredTokens = {
  accessToken: string
  refreshToken: string
  expiresAt?: string
}

export function setTokens(tokens: StoredTokens) {
  if (!isBrowser()) return
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
  if (tokens.expiresAt) {
    localStorage.setItem(EXPIRES_AT_KEY, tokens.expiresAt)
  }
}

export function getAccessToken() {
  if (!isBrowser()) return null
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  if (!isBrowser()) return null
  return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY)
}

export function getExpiresAt() {
  if (!isBrowser()) return null
  return localStorage.getItem(EXPIRES_AT_KEY) || localStorage.getItem(LEGACY_EXPIRES_AT_KEY)
}

export function clearTokens() {
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_EXPIRES_AT_KEY)
}

export function isTokenExpiredSoon(bufferMs = 5 * 60 * 1000) {
  const expiresAt = getExpiresAt()
  if (!expiresAt) return false
  const exp = new Date(expiresAt).getTime()
  return Date.now() + bufferMs >= exp
}

export function hasValidToken(): boolean {
  const accessToken = getAccessToken()
  if (!accessToken) return false
  
  // Check if token is expired or expiring soon
  return !isTokenExpiredSoon()
}
