import { useState, useEffect, useCallback } from 'react'
import { adminApi, AdminApiError } from '../services/adminApi'
import type { AdminUser, AdminRole } from '../types/admin.types'

export function useAdminAuth(requiredRole: AdminRole = 'super_admin') {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verify session on mount
  const checkSession = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const user = await adminApi.me()
      // Verify platform role
      if (user.role !== requiredRole && user.role !== 'super_admin') {
        throw new AdminApiError(
          `Access Denied: This portal requires ${requiredRole.replace('_', ' ')} privileges. Your role is ${user.role}.`,
          403,
          user.role
        )
      }
      setAdminUser(user)
    } catch (err: unknown) {
      setAdminUser(null)
      if (err instanceof AdminApiError && err.status === 403) {
        setError(err.message)
      }
      // 401 just means not logged in yet, no error message needed on mount
    } finally {
      setLoading(false)
    }
  }, [requiredRole])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      // Step 1: authenticate with standard credentials
      await adminApi.login(email, password)
      // Step 2: verify platform staff role via backend
      const user = await adminApi.me()
      
      // Step 3: check if user has the permitted role
      if (user.role !== requiredRole && user.role !== 'super_admin') {
        // Clear session since user is unauthorized for this portal
        await adminApi.logout()
        const deniedMsg = `Access Denied: Your account does not have Super Admin privileges.`
        setError(deniedMsg)
        throw new Error(deniedMsg)
      }

      setAdminUser(user)
      return user
    } catch (err: unknown) {
      const msg = (err as Error).message || 'Invalid credentials or unauthorized.'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await adminApi.logout()
    } finally {
      setAdminUser(null)
      setLoading(false)
    }
  }

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    adminUser,
    loading,
    error,
    login,
    logout,
    checkSession,
    clearError,
    isAuthenticated: !!adminUser,
  }
}
