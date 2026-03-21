import { STORAGE_KEYS } from '../config'

// Safe localStorage wrapper
export const storage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN)
    } catch {
      return null
    }
  },

  setToken: (token: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    } catch {
      // Ignore storage errors
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
    } catch {
      // Ignore storage errors
    }
  },

  getUserId: (): number | null => {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.USER_ID)
      return id ? parseInt(id, 10) : null
    } catch {
      return null
    }
  },

  setUserId: (userId: number | null): void => {
    try {
      if (userId === null) {
        localStorage.removeItem(STORAGE_KEYS.USER_ID)
      } else {
        localStorage.setItem(STORAGE_KEYS.USER_ID, userId.toString())
      }
    } catch {
      // Ignore storage errors
    }
  },

  removeUserId: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_ID)
    } catch {
      // Ignore storage errors
    }
  },

  clearAuth: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_ID)
    } catch {
      // Ignore storage errors
    }
  },
}
