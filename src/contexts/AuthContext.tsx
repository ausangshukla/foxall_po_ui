import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthRequired } from '../api/client'
import {
  login as loginApi,
  logout as logoutApi,
  getCurrentUser,
  isAuthenticated as checkIsAuthenticated,
} from '../api/auth'
import type {
  LoginRequest,
  LoginResponse,
  UserResponse,
  UserRole,
} from '../types/api'

// ============================================
// Auth Context Types
// ============================================
interface AuthContextType {
  user: UserResponse | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<LoginResponse>
  logout: () => void
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  canManageUsers: () => boolean
  canManageAllUsers: () => boolean
  refreshUser: () => Promise<void>
}

// ============================================
// Create Context
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================
// Auth Provider Component
// ============================================
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (checkIsAuthenticated()) {
        try {
          const currentUser = await getCurrentUser()
          setUser(currentUser)
        } catch {
          // Failed to get current user, logout
          logoutApi()
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  // Listen for auth required events (e.g., token expired)
  useEffect(() => {
    const unsubscribe = onAuthRequired((redirectTo?: string) => {
      setUser(null)
      // Build redirect URL with session expired message
      const params = new URLSearchParams()
      params.set('reason', 'session_expired')
      if (redirectTo && redirectTo !== '/login') {
        params.set('redirectTo', redirectTo)
      }
      navigate(`/login?${params.toString()}`, { replace: true })
    })

    return unsubscribe
  }, [navigate])

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    const result = await loginApi(credentials)
    // Map result (which is LoginResponse, having user data) to UserResponse
    // We try to get current user info for more details if available, but trust login result first
    const mappedUser: UserResponse = {
      id: result.id || (result.user_id as number) || 0,
      entity_id: result.entity_id || 0,
      first_name: result.first_name || '',
      last_name: result.last_name || '',
      email: result.email || '',
      phone: result.phone || '',
      wa_enabled: result.wa_enabled || false,
      email_enabled: result.email_enabled || false,
      roles: result.roles || [],
    }

    // Try to get current user to refresh full user info
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else if (mappedUser.email) {
        setUser(mappedUser)
      }
    } catch {
      if (mappedUser.email) {
        setUser(mappedUser)
      }
    }

    return result
  }, [])

  // Logout function
  const logout = useCallback(() => {
    logoutApi()
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (checkIsAuthenticated()) {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch {
        setUser(null)
      }
    }
  }, [])

  // Role checking helpers
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return user?.roles.includes(role) ?? false
    },
    [user]
  )

  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      return roles.some(role => user?.roles.includes(role)) ?? false
    },
    [user]
  )

  // Permission helpers based on roles
  const canManageUsers = useCallback((): boolean => {
    return hasAnyRole(['super', 'internal_manager'])
  }, [hasAnyRole])

  const canManageAllUsers = useCallback((): boolean => {
    return hasRole('super')
  }, [hasRole])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    canManageUsers,
    canManageAllUsers,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================
// Use Auth Hook
// ============================================
// Custom hooks are allowed to be exported from context files (React best practice)
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ============================================
// Protected Route Hook
// ============================================
// Custom hooks are allowed to be exported from context files (React best practice)
// eslint-disable-next-line react-refresh/only-export-components
export function useRequireAuth(redirectTo: string = '/login'): boolean {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo])

  return isAuthenticated
}

// ============================================
// Require Role Hook
// ============================================
// Custom hooks are allowed to be exported from context files (React best practice)
// eslint-disable-next-line react-refresh/only-export-components
export function useRequireRole(
  role: UserRole,
  redirectTo: string = '/'
): boolean {
  const { hasRole, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true })
      } else if (!hasRole(role)) {
        navigate(redirectTo, { replace: true })
      }
    }
  }, [isAuthenticated, hasRole, isLoading, navigate, redirectTo, role])

  return isAuthenticated && hasRole(role)
}
