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
  PURCHASE_ORDER_AVAILABLE_ACTIONS: (id: number) => `/api/v1/purchase_orders/${id}/available_actions`,
  PURCHASE_ORDER_TRANSITION: (id: number) => `/api/v1/purchase_orders/${id}/transition`,
  PURCHASE_ORDER_TRANSITION_ATTEMPTS: (id: number) => `/api/v1/purchase_orders/${id}/transition_attempts`,
  PURCHASE_ORDER_LINE_ITEMS: (poId: number) => `/api/v1/purchase_orders/${poId}/line_items`,
  PURCHASE_ORDER_LINE_ITEM: (poId: number, id: number) => `/api/v1/purchase_orders/${poId}/line_items/${id}`,

  // Custom Fields
  CUSTOM_FIELD_DEFINITIONS: '/api/v1/custom_field_definitions',
  CUSTOM_FIELD_DEFINITION: (id: number) => `/api/v1/custom_field_definitions/${id}`,

  // External Parties
  EXTERNAL_PARTIES: '/api/v1/external_parties',
  EXTERNAL_PARTY: (id: number) => `/api/v1/external_parties/${id}`,
  EXTERNAL_PARTIES_FOR_PO: (poId: number) => `/api/v1/purchase_orders/${poId}/external_parties`,

  // PO States
  PO_STATES: '/api/v1/po_states',
  PO_STATE: (id: number) => `/api/v1/po_states/${id}`,

  // PO Transition Rules
  PO_TRANSITION_RULES: '/api/v1/po_transition_rules',
  PO_TRANSITION_RULE: (id: number) => `/api/v1/po_transition_rules/${id}`,

  // Notification Rules
  NOTIFICATION_RULES: '/api/v1/notification_rules',
  NOTIFICATION_RULE: (id: number) => `/api/v1/notification_rules/${id}`,

  // Seller Confirmation (public — no JWT)
  SELLER_CONFIRMATION: (poId: number) => `/api/v1/public/seller_confirmations/${poId}`,
  SELLER_CONFIRMATIONS: '/api/v1/public/seller_confirmations',

  // Post-transition action panel
  PURCHASE_ORDER_TRANSITION_ACTIONS: (id: number) => `/api/v1/purchase_orders/${id}/transition_actions`,
  PURCHASE_ORDER_EXECUTE_TRANSITION_ACTION: (id: number) => `/api/v1/purchase_orders/${id}/execute_transition_action`,
} as const

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'foxall_po_token',
  USER_ID: 'foxall_po_user_id',
} as const
