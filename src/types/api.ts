// ============================================
// Generic API Response Envelope
// ============================================
export interface ApiResponse<T, M = unknown> {
  data: T | null
  meta?: M | null
  error?: AppErrorResponse | null
  status?: {
    code: number
    message: string
  }
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
  user_id: number | null
  id: number | null
  email: string
  first_name: string | null
  last_name: string | null
  phone?: string
  avatar_url?: string
  username?: string
  wa_enabled?: boolean
  email_enabled?: boolean
  entity_id?: number
  roles: string[] | null
  [key: string]: unknown
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
  resource_name: string
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'checkbox' | 'select'
  hint: string | null
  possible_values: string | string[] | null
  is_mandatory: boolean
  tag: string | null
}

export interface CustomFieldDefinitionCreateRequest {
  resource_name: string
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'checkbox' | 'select'
  hint?: string | null
  possible_values?: string | string[] | null
  is_mandatory?: boolean
  tag?: string | null
}

export interface CustomFieldDefinitionUpdateRequest {
  resource_name?: string
  field_key?: string
  field_label?: string
  field_type?: 'text' | 'number' | 'checkbox' | 'select'
  hint?: string | null
  possible_values?: string | string[] | null
  is_mandatory?: boolean
  tag?: string | null
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
  avatar_url?: string
  username?: string
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

// Custom field value types
export type CustomFieldValue = string | number | boolean | null

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
  vendor_name?: string
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
  custom_fields: Record<string, CustomFieldValue> | null
  
  // New Fields
  supplier_contact_name: string | null
  supplier_email: string | null
  supplier_phone: string | null
  supplier_address: string | null
  supplier_country: string | null
  origin_city_port: string | null
  payment_terms: string | null
  cargo_description: string | null
  hs_code: string | null
  product_category: string | null
  quantity: number | null
  unit_of_measure: string | null
  number_of_cartons_pallets: number | null
  dimension_length: number | null
  dimension_width: number | null
  dimension_height: number | null
  total_cbm: number | null
  gross_weight_per_carton: number | null
  total_gross_weight: number | null
  total_net_weight: number | null
  is_dangerous_goods: boolean
  dg_class_un_number: string | null
  is_temperature_controlled: boolean
  temperature_range: string | null
  estimated_ready_date: string | null
  target_ship_date: string | null
  
  // Document URLs
  po_document_url: string | null
  product_spec_sheet_url: string | null
  msds_url: string | null
  pre_production_sample_url: string | null

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
  custom_fields?: Record<string, CustomFieldValue> | null

  // New Fields
  supplier_contact_name?: string | null
  supplier_email?: string | null
  supplier_phone?: string | null
  supplier_address?: string | null
  supplier_country?: string | null
  origin_city_port?: string | null
  payment_terms?: string | null
  cargo_description?: string | null
  hs_code?: string | null
  product_category?: string | null
  quantity?: number | null
  unit_of_measure?: string | null
  number_of_cartons_pallets?: number | null
  dimension_length?: number | null
  dimension_width?: number | null
  dimension_height?: number | null
  total_cbm?: number | null
  gross_weight_per_carton?: number | null
  total_gross_weight?: number | null
  total_net_weight?: number | null
  is_dangerous_goods?: boolean
  dg_class_un_number?: string | null
  is_temperature_controlled?: boolean
  temperature_range?: string | null
  estimated_ready_date?: string | null
  target_ship_date?: string | null

  // Documents (these might be sent as File or handled separately if using FormData)
  po_document?: File | null
  product_spec_sheet?: File | null
  msds?: File | null
  pre_production_sample?: File | null
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
  custom_fields?: Record<string, CustomFieldValue> | null
  approved_by?: number | null

  // New Fields
  supplier_contact_name?: string | null
  supplier_email?: string | null
  supplier_phone?: string | null
  supplier_address?: string | null
  supplier_country?: string | null
  origin_city_port?: string | null
  payment_terms?: string | null
  cargo_description?: string | null
  hs_code?: string | null
  product_category?: string | null
  quantity?: number | null
  unit_of_measure?: string | null
  number_of_cartons_pallets?: number | null
  dimension_length?: number | null
  dimension_width?: number | null
  dimension_height?: number | null
  total_cbm?: number | null
  gross_weight_per_carton?: number | null
  total_gross_weight?: number | null
  total_net_weight?: number | null
  is_dangerous_goods?: boolean
  dg_class_un_number?: string | null
  is_temperature_controlled?: boolean
  temperature_range?: string | null
  estimated_ready_date?: string | null
  target_ship_date?: string | null

  // Documents
  po_document?: File | null
  product_spec_sheet?: File | null
  msds?: File | null
  pre_production_sample?: File | null
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
  po_type?: PurchaseOrderType
  entity_id?: number
  vendor_id?: number
  order_date_from?: string
  order_date_to?: string
  conditions?: PurchaseOrderSearchCondition[]
  sort_by?: string
  sort_dir?: 'asc' | 'desc'
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
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
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
