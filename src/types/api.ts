// ============================================
// Generic API Response Envelope
// ============================================
export interface ApiResponse<T, M = unknown> {
  data: T | null
  meta: M | null
  error: AppErrorResponse | null
}

export interface AppErrorResponse {
  code: string
  message: string
}

// ============================================
// Auth Types
// ============================================
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user_id: number
}

export interface JWTPayload {
  sub: number
  exp: number
}

// ============================================
// Custom Field Types
// ============================================
export interface CustomFieldDefinition {
  id: number
  model_name: string
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'checkbox' | 'select'
  hint: string | null
  possible_values: string | null
  is_mandatory: boolean
}

// ============================================
// User Types
// ============================================
export interface UserResponse {
  id: number
  entity_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  wa_enabled: boolean
  email_enabled: boolean
  roles: string[]
}

export interface CreateUserRequest {
  entity_id: number
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  wa_enabled: boolean
  email_enabled: boolean
  roles?: string[]
}

export interface UpdateUserRequest {
  entity_id?: number
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  wa_enabled?: boolean
  email_enabled?: boolean
  roles?: string[]
}

// ============================================
// Entity Types
// ============================================
export interface EntityResponse {
  id: number
  name: string
  url: string
  entity_type: string
  address: string
}

export interface EntityCreateRequest {
  name: string
  url: string
  entity_type: string
  address: string
}

export interface EntityUpdateRequest {
  name?: string
  url?: string
  entity_type?: string
  address?: string
}

// ============================================
// Role Types
// ============================================
export type UserRole = 'super' | 'admin' | 'employee'

// ============================================
// Purchase Order Types
// ============================================
export type PurchaseOrderStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'sent'
  | 'partially_received'
  | 'received'
  | 'closed'
  | 'cancelled'

export type PurchaseOrderType = 'standard' | 'blanket' | 'service'

export type ShippingMethod = 'air' | 'sea' | 'ground' | 'express'

export type ShippingTerm = 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'DAP' | 'FCA' | 'CPT' | 'CIP'

export interface PurchaseOrderResponse {
  id: number
  entity_id: number
  po_number: string
  vendor_id: number
  status: PurchaseOrderStatus
  po_type: PurchaseOrderType
  order_date: string
  expected_delivery_date: string | null
  actual_delivery_date: string | null
  currency: string
  total_amount: number
  notes: string | null
  // Shipping/Logistics Fields
  shipping_method: ShippingMethod | null
  shipping_terms: ShippingTerm | null
  destination_address: string | null
  bill_to_address: string | null
  incoterm: string | null
  tracking_number: string | null
  carrier: string | null
  custom_fields: Record<string, any> | null
  // Audit Fields
  created_by: number
  approved_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CreatePurchaseOrderRequest {
  entity_id: number
  po_number: string
  vendor_id: number
  status?: PurchaseOrderStatus
  po_type: PurchaseOrderType
  order_date: string
  expected_delivery_date?: string | null
  actual_delivery_date?: string | null
  currency: string
  total_amount: number
  notes?: string | null
  shipping_method?: ShippingMethod | null
  shipping_terms?: ShippingTerm | null
  destination_address?: string | null
  bill_to_address?: string | null
  incoterm?: string | null
  tracking_number?: string | null
  carrier?: string | null
  custom_fields?: Record<string, any> | null
}

export interface UpdatePurchaseOrderRequest {
  entity_id?: number
  po_number?: string
  vendor_id?: number
  status?: PurchaseOrderStatus
  po_type?: PurchaseOrderType
  order_date?: string
  expected_delivery_date?: string | null
  actual_delivery_date?: string | null
  currency?: string
  total_amount?: number
  notes?: string | null
  shipping_method?: ShippingMethod | null
  shipping_terms?: ShippingTerm | null
  destination_address?: string | null
  bill_to_address?: string | null
  incoterm?: string | null
  tracking_number?: string | null
  carrier?: string | null
  custom_fields?: Record<string, any> | null
  approved_by?: number | null
}

// ============================================
// Purchase Order Search Types
// ============================================
export interface PurchaseOrderSearchCondition {
  field: string
  pred: string
  value: string
}

export interface PurchaseOrderSearchRequest {
  page?: number
  per_page?: number
  q?: string
  status?: string
  entity_id?: number
  vendor_id?: number
  order_date_from?: string
  order_date_to?: string
  conditions?: PurchaseOrderSearchCondition[]
}

export interface PurchaseOrderSearchMeta {
  current_page: number
  per_page: number
  total_pages: number
  total_count: number
}

// ============================================
// API Error Types
// ============================================
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class AuthError extends Error {
  constructor(message: string = 'Session expired') {
    super(message)
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class LoginError extends Error {
  constructor(message: string = 'Invalid credentials') {
    super(message)
    this.name = 'LoginError'
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
  }
}
