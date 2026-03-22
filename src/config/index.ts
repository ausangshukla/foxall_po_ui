// API Configuration
console.log('Environment:', import.meta.env.MODE);
console.log('API_BASE_URL:', import.meta.env.VITE_API_URL);

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const API_ROUTES = {
  // Auth
  LOGIN: '/login',
  LOGOUT: '/logout',

  // Users
  USERS: '/api/v1/users',
  USER: (id: number) => `/api/v1/users/${id}`,

  // Entities
  ENTITIES: '/api/v1/entities',
  ENTITY: (id: number) => `/api/v1/entities/${id}`,

  // Purchase Orders
  PURCHASE_ORDERS: '/api/v1/purchase_orders',
  PURCHASE_ORDER: (id: number) => `/api/v1/purchase_orders/${id}`,
  PURCHASE_ORDER_LINE_ITEMS: (poId: number) => `/api/v1/purchase_orders/${poId}/line_items`,
  PURCHASE_ORDER_LINE_ITEM: (poId: number, id: number) => `/api/v1/purchase_orders/${poId}/line_items/${id}`,

  // Custom Fields
  CUSTOM_FIELD_DEFINITIONS: '/api/v1/custom_field_definitions',
  CUSTOM_FIELD_DEFINITION: (id: number) => `/api/v1/custom_field_definitions/${id}`,
} as const

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'foxall_po_token',
  USER_ID: 'foxall_po_user_id',
} as const
