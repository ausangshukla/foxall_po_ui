// API Configuration
console.log('Environment:', import.meta.env.MODE);
console.log('API_BASE_URL:', import.meta.env.VITE_API_URL);

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8081'

export const API_ROUTES = {
  // Auth
  LOGIN: '/api/auth/login',

  // Users
  USERS: '/api/users',
  USER: (id: number) => `/api/users/${id}`,

  // Entities
  ENTITIES: '/api/entities',
  ENTITY: (id: number) => `/api/entities/${id}`,

  // Purchase Orders
  PURCHASE_ORDERS: '/api/purchase-orders',
  PURCHASE_ORDER: (id: number) => `/api/purchase-orders/${id}`,

  // Custom Fields
  CUSTOM_FIELD_DEFINITIONS: '/api/custom_field_definitions',
} as const

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'foxall_po_token',
  USER_ID: 'foxall_po_user_id',
} as const
