"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/api/auth-service"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
    setIsLoading(false)
  }, [])

 // ✅ CORRECT - Hook accepts username and password as separate params
const login = async (username: string, password: string) => {
  // Then passes them as an object to the service
  await authService.login({ username, password })
  setIsAuthenticated(true)
}

  const logout = async () => {
    await authService.logout()
    setIsAuthenticated(false)
    router.push("/login")
  }

  const logoutAll = async () => {
    await authService.logoutAll()
    setIsAuthenticated(false)
    router.push("/login")
  }

  return {
    isAuthenticated,
    isLoading,
    login,
    logout,
    logoutAll,
  }
}