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
export type UserRole = 'super' | 'internal_manager' | 'internal_user'

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
  
  // State Machine Fields
  po_state_system_code?: string | null
  po_state_name?: string | null
  po_state_description?: string | null
  history?: PoTransitionAttemptResponse[]
  creator_name?: string | null
  
  // Document URLs
  po_document_url: string | null
  product_spec_sheet_url: string | null
  msds_url: string | null
  pre_production_sample_url: string | null
  commercial_invoice_url: string | null
  packing_list_url: string | null
  dangerous_goods_declaration_url: string | null
  certificate_of_origin_url: string | null
  misc_shipment_documents: Array<{ id: number, url: string, filename: string }> | null

  // State Machine Actions
  available_actions?: PurchaseOrderAvailableAction[]

  // Audit Fields
  created_by: number
  approved_by: number | null
  created_at: string
  updated_at: string
  deleted_at: string | null

  // Unified Partner/Contact Fields
  seller_entity?: string | null
  seller_entity_id?: number | null
  logistics_entity?: string | null
  logistics_entity_id?: number | null
  carrier_entity?: string | null
  carrier_entity_id?: number | null
  seller_contact?: string | null
  seller_contact_id?: number | null
  logistics_contact?: string | null
  logistics_contact_id?: number | null
  carrier_contact?: string | null
  carrier_contact_id?: number | null
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

  // Partner/Contact IDs
  seller_entity_id?: number | null
  logistics_entity_id?: number | null
  carrier_entity_id?: number | null
  seller_contact_id?: number | null
  logistics_contact_id?: number | null
  carrier_contact_id?: number | null
}

// ============================================
// Purchase Order Line Item Types
// ============================================
export interface PurchaseOrderLineItemResponse {
  id: number
  purchase_order_id: number
  sku_or_part_number: string | null
  description: string | null
  quantity_ordered: number | null
  quantity_shipped: number | null
  quantity_received: number | null
  unit_of_measure: string | null
  net_weight: number | null
  gross_weight: number | null
  weight_unit: string | null
  total_volume: number | null
  volume_unit: string | null
  dimension_length: number | null
  dimension_width: number | null
  dimension_height: number | null
  dimension_unit: string | null
  hs_code: string | null
  country_of_origin: string | null
  unit_value: number | null
  total_value: number | null
  currency: string | null
  is_dangerous_goods: boolean
  un_number: string | null
  dg_class: string | null
  is_temperature_controlled: boolean
  temperature_range: string | null
  batch_or_lot_number: string | null
  expiry_date: string | null
  status: string | null
  created_at: string
  updated_at: string
  calculated_status: string | null
  
  // Seller confirmation fields
  seller_confirmed_quantity?: number | null
  seller_confirmed_unit_price?: number | null
  seller_confirmation_notes?: string | null
}

export interface CreatePurchaseOrderLineItemRequest {
  sku_or_part_number?: string | null
  description?: string | null
  quantity_ordered?: number | null
  quantity_shipped?: number | null
  quantity_received?: number | null
  unit_of_measure?: string | null
  net_weight?: number | null
  gross_weight?: number | null
  weight_unit?: string | null
  total_volume?: number | null
  volume_unit?: string | null
  dimension_length?: number | null
  dimension_width?: number | null
  dimension_height?: number | null
  dimension_unit?: string | null
  hs_code?: string | null
  country_of_origin?: string | null
  unit_value?: number | null
  total_value?: number | null
  currency?: string | null
  is_dangerous_goods?: boolean
  un_number?: string | null
  dg_class?: string | null
  is_temperature_controlled?: boolean
  temperature_range?: string | null
  batch_or_lot_number?: string | null
  expiry_date?: string | null
  status?: string | null
}

export interface UpdatePurchaseOrderLineItemRequest {
  sku_or_part_number?: string | null
  description?: string | null
  quantity_ordered?: number | null
  quantity_shipped?: number | null
  quantity_received?: number | null
  unit_of_measure?: string | null
  net_weight?: number | null
  gross_weight?: number | null
  weight_unit?: string | null
  total_volume?: number | null
  volume_unit?: string | null
  dimension_length?: number | null
  dimension_width?: number | null
  dimension_height?: number | null
  dimension_unit?: string | null
  hs_code?: string | null
  country_of_origin?: string | null
  unit_value?: number | null
  total_value?: number | null
  currency?: string | null
  is_dangerous_goods?: boolean
  un_number?: string | null
  dg_class?: string | null
  is_temperature_controlled?: boolean
  temperature_range?: string | null
  batch_or_lot_number?: string | null
  expiry_date?: string | null
  status?: string | null
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
// State Machine Types
// ============================================

export interface PurchaseOrderAvailableAction {
  action_name: string
  action_key: string
  requires_comment: boolean
  to_state_id: number
}

export interface PurchaseOrderAvailableActionsResponse {
  purchase_order: {
    id: number
    po_number: string
    current_state: string
  }
  available_actions: PurchaseOrderAvailableAction[]
}

export interface PurchaseOrderTransitionRequest {
  transition: {
    po_state_id: number
    comment?: string
  }
}

export interface PurchaseOrderTransitionResponse {
  purchase_order: PurchaseOrderResponse & {
    po_state: {
      id: number
      name: string
      system_code: string
    }
    transitioned_at: string
  }
  attempt: {
    id: number
    status: string
    action: string
  }
}

export interface PurchaseOrderTransitionAttempt {
  id: number
  action: string
  from_state: string
  to_state: string
  status: string
  error_message: string | null
  actor_type: string
  actor_id: number | null
  created_at: string
}

export interface PurchaseOrderTransitionAttemptsResponse {
  purchase_order: {
    id: number
    po_number: string
  }
  attempts: PurchaseOrderTransitionAttempt[]
}

export interface PoTransitionAttemptResponse {
  id: number
  entity_id: number
  purchase_order_id: number
  po_transition_rule_id: number | null
  actor_type: string | null
  actor_id: number | null
  attempted_action: string
  from_state_system_code: string | null
  to_state_system_code: string | null
  status: string
  error_message: string | null
  comment?: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
  actor_display_name?: string
}

export interface PoTransitionAttemptSearchMeta {
  current_page: number
  per_page: number
  total_pages: number
  total_count: number
}

// ============================================
// External Party Types
// ============================================
export type ExternalPartyType = 'seller' | 'logistics' | 'carrier'

export interface ExternalPartyResponse {
  id: number
  entity_id: number
  purchase_order_id: number
  party_type: ExternalPartyType
  name: string
  email: string | null
  phone: string | null
  whatsapp_country_code: string | null
  whatsapp_number: string | null
  company_name: string | null
  address: string | null
  prefers_whatsapp: boolean
  preferences: Record<string, unknown> | null
  last_contacted_at: string | null
  opt_out: boolean
  created_at: string
  updated_at: string
  // Computed/joined fields (if returned by API)
  entity_name?: string
  purchase_order_number?: string
}

export interface ExternalPartyCreateRequest {
  entity_id: number
  purchase_order_id: number
  party_type: ExternalPartyType
  name: string
  email?: string | null
  phone?: string | null
  whatsapp_country_code?: string | null
  whatsapp_number?: string | null
  company_name?: string | null
  address?: string | null
  prefers_whatsapp?: boolean
  preferences?: Record<string, unknown> | null
  opt_out?: boolean
}

export interface ExternalPartyUpdateRequest {
  entity_id?: number
  purchase_order_id?: number
  party_type?: ExternalPartyType
  name?: string
  email?: string | null
  phone?: string | null
  whatsapp_country_code?: string | null
  whatsapp_number?: string | null
  company_name?: string | null
  address?: string | null
  prefers_whatsapp?: boolean
  preferences?: Record<string, unknown> | null
  opt_out?: boolean
}

export interface ExternalPartySearchMeta {
  current_page: number
  per_page: number
  total_pages: number
  total_count: number
}

// ============================================
// State Machine Config Types
// ============================================

export interface PoStateResponse {
  id: number
  entity_id: number
  name: string
  system_code: string
  category: 'open' | 'in_transit' | 'closed' | 'exception'
  magic_link_expiry_minutes: number | null
  description: string | null
  position: number
  is_terminal: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface PoStateCreateRequest {
  entity_id: number
  name: string
  system_code: string
  category: 'open' | 'in_transit' | 'closed' | 'exception'
  magic_link_expiry_minutes?: number | null
  description?: string | null
  position?: number
  is_terminal?: boolean
  is_default?: boolean
}

export interface PoStateUpdateRequest {
  name?: string
  system_code?: string
  category?: 'open' | 'in_transit' | 'closed' | 'exception'
  magic_link_expiry_minutes?: number | null
  description?: string | null
  position?: number
  is_terminal?: boolean
  is_default?: boolean
}

// ============================================
// PO Transition Rule Types
// ============================================

export interface PoTransitionRuleResponse {
  id: number
  entity_id: number
  from_state_id: number | null
  to_state_id: number
  allowed_role: string
  requires_comment: boolean
  requires_attachment: boolean
  auto_transition: boolean
  is_magic_link_enabled: boolean
  created_at: string
  updated_at: string
  // Joined fields
  from_state_name?: string
  to_state_name?: string
  to_state_magic_link_expiry_minutes?: number | null
}

export interface PoTransitionRuleCreateRequest {
  entity_id: number
  from_state_id: number | null
  to_state_id: number
  allowed_role: string
  requires_comment?: boolean
  requires_attachment?: boolean
  auto_transition?: boolean
  is_magic_link_enabled?: boolean
}

export interface PoTransitionRuleUpdateRequest {
  entity_id?: number
  from_state_id?: number | null
  to_state_id?: number
  allowed_role?: string
  requires_comment?: boolean
  requires_attachment?: boolean
  auto_transition?: boolean
  is_magic_link_enabled?: boolean
}

// ============================================
// Notification Rule Types
// ============================================

export type NotificationPartyRole = 'seller' | 'logistics' | 'buyer' | 'internal_manager'
export type NotificationChannel = 'email' | 'whatsapp' | 'sms'

export interface NotificationRuleResponse {
  id: number
  entity_id: number
  po_state_id: number
  party_role: NotificationPartyRole
  channel: NotificationChannel
  template_id: string | null
  subject_template: string | null
  is_active: boolean
  delay_minutes: number
  additional_params: Record<string, unknown>
  created_at: string
  updated_at: string
  // Joined fields
  po_state_name?: string
  entity_name?: string
}

export interface NotificationRuleCreateRequest {
  entity_id: number
  po_state_id: number
  party_role: NotificationPartyRole
  channel: NotificationChannel
  template_id?: string | null
  subject_template?: string | null
  is_active?: boolean
  delay_minutes?: number
  additional_params?: Record<string, unknown>
}

export interface NotificationRuleUpdateRequest {
  entity_id?: number
  po_state_id?: number
  party_role?: NotificationPartyRole
  channel?: NotificationChannel
  template_id?: string | null
  subject_template?: string | null
  is_active?: boolean
  delay_minutes?: number
  additional_params?: Record<string, unknown>
}

// ============================================
// Freight Booking Types
// ============================================
export interface FreightBooking {
  id: number
  purchase_order_id: number
  entity_id: number
  status: string
  transport_mode: string
  container_type: string | null
  origin_port: string
  destination_port: string
  etd: string | null
  eta: string | null
  booking_reference: string | null
  awb_number: string | null
  bl_number: string | null
  carrier_name: string | null
  total_cost_usd: number | null
  notes: string | null
  confirmed_at: string | null
  carrier_confirmed_at: string | null
  booking_source?: string | null
  proposed_etd?: string | null
  etd_change_reason?: string | null
  agreed_rate_usd?: number | null
}

export interface FreightBookingRate {
  id: number
  carrier_name: string
  transport_mode: string
  container_type: string | null
  rate_usd: number
  total_cost_usd: number
  transit_days: number
  departure_date: string
  is_ai_recommended: boolean
  is_selected: boolean
}

export interface FreightContractRate {
  id: number
  carrier_name: string
  origin_port: string
  destination_port: string
  transport_mode: string
  container_type: string | null
  rate_usd: number
  currency: string
  valid_from: string
  valid_to: string
  carrier_entity_id?: number | null
  notes?: string | null
}

// ============================================
// Seller Confirmation Types
// ============================================
export interface SellerConfirmationLineItem {
  id: number
  sku_or_part_number: string | null
  description: string | null
  quantity_ordered: number
  unit_value: number | null
  currency: string | null
  unit_of_measure: string | null
  seller_confirmed_quantity: number | null
  seller_confirmed_unit_price: number | null
  seller_confirmation_notes: string | null
}

export interface SellerConfirmationDataResponse {
  purchase_order: {
    id: number
    po_number: string
    buyer_entity_name: string
    seller_entity_name: string
    total_amount: number
    currency: string
    order_date: string
    estimated_ready_date: string | null
    incoterm: string | null
    payment_terms: string | null
    cargo_description: string | null
    current_state: string | null
  }
  line_items: SellerConfirmationLineItem[]
  action_key: string
  expires_at: string
}

export interface SellerConfirmationSubmitRequest {
  token: string
  action_key: string
  comment?: string
  line_items: Array<{
    id: number
    seller_confirmed_quantity: number
    seller_confirmed_unit_price: number
    seller_confirmation_notes?: string
  }>
}

export interface SellerConfirmationSubmitResponse {
  success: boolean
  new_state: string
  po_number: string
  message: string
}

// ============================================
// Transition Action Types
// ============================================
export interface TransitionAction {
  id: number
  label: string
  description: string | null
  action_type: string
  trigger_mode: 'manual' | 'automatic'
  allow_repeat: boolean
  position: number
  can_execute?: boolean
  executions?: TransitionActionExecution[]
}

export interface TransitionActionExecution {
  id: number
  trigger_type: 'manual' | 'automatic'
  status: 'pending' | 'success' | 'failed'
  triggered_by: string | null
  executed_at: string
  result_data: Record<string, unknown>
}

export interface TransitionActionsResponse {
  transition_attempt_id: number
  transition_rule: {
    action_name: string
    from_state: string
    to_state: string
  }
  actions: TransitionAction[]
}

// ============================================
// Shipment Tracking Types
// ============================================
export interface ShipmentTracking {
  id: number
  freight_booking_id: number
  purchase_order_id: number
  carrier_api_source: string
  carrier_tracking_reference: string
  webhook_subscription_id: string | null
  current_status_code: string
  current_location_unlocode: string | null
  carrier_eta: string | null
  predicted_eta: string | null
  vessel_name: string | null
  vessel_imo: string | null
  vessel_latitude: number | null
  vessel_longitude: number | null
  vessel_position_updated_at: string | null
  free_time_expiry: string | null
  customs_status: string
  last_polled_at: string | null
  poll_failures: number
  created_at: string
  updated_at: string
  events?: ShipmentEvent[]
  alerts?: DelayAlert[]
}

export interface ShipmentEvent {
  id: number
  shipment_tracking_id: number
  freight_booking_id: number
  purchase_order_id: number
  event_code: string
  event_category: 'transport' | 'equipment' | 'customs' | 'document' | 'exception'
  event_description: string
  event_time: string
  event_time_type: 'actual' | 'estimated' | 'predicted'
  location_unlocode: string | null
  location_name: string | null
  vessel_name: string | null
  vessel_imo: string | null
  voyage_number: string | null
  flight_number: string | null
  container_number: string | null
  new_eta: string | null
  raw_source: string
  created_at: string
}

export interface DelayAlert {
  id: number
  shipment_tracking_id: number
  freight_booking_id: number
  purchase_order_id: number
  alert_type: 'eta_change' | 'demurrage_risk' | 'customs_hold' | 'security_hold'
  severity: 'low' | 'medium' | 'high' | 'critical'
  original_eta: string | null
  revised_eta: string | null
  delay_days: number | null
  delay_reason_code: string | null
  delay_reason_text: string | null
  impact_on_delivery_date: boolean
  demurrage_risk: boolean
  notified_at: string | null
  acknowledged_by_id: number | null
  acknowledged_at: string | null
  created_at: string
  updated_at: string
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
  errors?: Record<string, string[]>

  constructor(message: string = 'Validation failed', errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ValidationError'
    this.errors = errors
  }
}
