import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, RichTextEditor } from '../../components/common'
import { createPurchaseOrder, updatePurchaseOrder, getPurchaseOrder } from '../../api/purchase-orders'
import { getCustomFieldDefinitions } from '../../api/custom-fields'
import type { CreatePurchaseOrderRequest, UpdatePurchaseOrderRequest, PurchaseOrderResponse, PurchaseOrderStatus, PurchaseOrderType, ShippingMethod, ShippingTerm, CustomFieldDefinition, CustomFieldValue } from '../../types/api'

interface FormData {
  entity_id: string
  po_number: string
  vendor_id: string
  vendor_name: string
  status: PurchaseOrderStatus
  po_type: PurchaseOrderType | ''
  order_date: string
  expected_delivery_date: string
  actual_delivery_date: string
  currency: string
  total_amount: string
  notes: string
  shipping_method: ShippingMethod | ''
  shipping_terms: ShippingTerm | ''
  destination_address: string
  bill_to_address: string
  incoterm: string
  tracking_number: string
  carrier: string
  custom_fields: Record<string, CustomFieldValue>

  // New Fields
  supplier_contact_name: string
  supplier_email: string
  supplier_phone: string
  supplier_address: string
  supplier_country: string
  origin_city_port: string
  payment_terms: string
  cargo_description: string
  hs_code: string
  product_category: string
  quantity: string
  unit_of_measure: string
  number_of_cartons_pallets: string
  dimension_length: string
  dimension_width: string
  dimension_height: string
  total_cbm: string
  gross_weight_per_carton: string
  total_gross_weight: string
  total_net_weight: string
  is_dangerous_goods: boolean
  dg_class_un_number: string
  is_temperature_controlled: boolean
  temperature_range: string
  estimated_ready_date: string
  target_ship_date: string

  // Documents
  po_document: File | null
  product_spec_sheet: File | null
  msds: File | null
  pre_production_sample: File | null

  // Existing Document URLs (for display during edit)
  po_document_url?: string | null
  product_spec_sheet_url?: string | null
  msds_url?: string | null
  pre_production_sample_url?: string | null
}

const initialFormData: FormData = {
  entity_id: '',
  po_number: '',
  vendor_id: '',
  vendor_name: '',
  status: 'draft',
  po_type: '',
  order_date: new Date().toISOString().split('T')[0],
  expected_delivery_date: '',
  actual_delivery_date: '',
  currency: 'USD',
  total_amount: '',
  notes: '',
  shipping_method: '',
  shipping_terms: '',
  destination_address: '',
  bill_to_address: '',
  incoterm: '',
  tracking_number: '',
  carrier: '',
  custom_fields: {},

  // New Fields
  supplier_contact_name: '',
  supplier_email: '',
  supplier_phone: '',
  supplier_address: '',
  supplier_country: '',
  origin_city_port: '',
  payment_terms: '',
  cargo_description: '',
  hs_code: '',
  product_category: '',
  quantity: '',
  unit_of_measure: '',
  number_of_cartons_pallets: '',
  dimension_length: '',
  dimension_width: '',
  dimension_height: '',
  total_cbm: '',
  gross_weight_per_carton: '',
  total_gross_weight: '',
  total_net_weight: '',
  is_dangerous_goods: false,
  dg_class_un_number: '',
  is_temperature_controlled: false,
  temperature_range: '',
  estimated_ready_date: '',
  target_ship_date: '',

  po_document: null,
  product_spec_sheet: null,
  msds: null,
  pre_production_sample: null,
}

const STATUS_OPTIONS: { value: PurchaseOrderStatus; label: string }[] = [
  { value: 'draft', label: '📝 Draft' },
  { value: 'pending', label: '⏳ Pending' },
  { value: 'approved', label: '✅ Approved' },
  { value: 'sent', label: '📤 Sent' },
  { value: 'partially_received', label: '📦 Partially Received' },
  { value: 'received', label: '📥 Received' },
  { value: 'closed', label: '🔒 Closed' },
  { value: 'cancelled', label: '❌ Cancelled' },
]

const SHIPPING_METHODS: { value: ShippingMethod; label: string }[] = [
  { value: 'air', label: '✈️ Air' },
  { value: 'sea', label: '🚢 Sea' },
  { value: 'ground', label: '🚛 Ground' },
  { value: 'express', label: '🚀 Express' },
]

const SHIPPING_TERMS: { value: ShippingTerm; label: string }[] = [
  { value: 'FOB', label: 'FOB - Free On Board' },
  { value: 'CIF', label: 'CIF - Cost, Insurance, Freight' },
  { value: 'EXW', label: 'EXW - Ex Works' },
  { value: 'DDP', label: 'DDP - Delivered Duty Paid' },
  { value: 'DAP', label: 'DAP - Delivered At Place' },
  { value: 'FCA', label: 'FCA - Free Carrier' },
  { value: 'CPT', label: 'CPT - Carriage Paid To' },
  { value: 'CIP', label: 'CIP - Carriage and Insurance Paid To' },
]

const CURRENCIES = ['USD', 'EUR', 'CNY', 'AED', 'GBP', 'JPY', 'CAD', 'AUD', 'INR']

const INCOTERMS = ['EXW', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP', 'FCA']
const PAYMENT_TERMS = ['30% deposit / 70% BL', 'LC', 'TT', 'Net 30', 'Net 60']
const UNITS_OF_MEASURE = ['pcs', 'kg', 'cbm', 'sets']
const PRODUCT_CATEGORIES = ['Electronics', 'Textiles', 'Furniture', 'Machinery', 'Chemicals', 'Other']
const COUNTRIES = ['China', 'USA', 'Germany', 'Japan', 'India', 'UK', 'France', 'UAE', 'Other']

export function PurchaseOrderFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { user, canManageUsers } = useAuth()

  const isEditing = !!id
  const poId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(0)
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([])
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const steps = [
    { title: 'Order Details', icon: 'description' },
    { title: 'Supplier & Cargo', icon: 'inventory_2' },
    { title: 'Logistics Specs', icon: 'local_shipping' },
    { title: 'Documents', icon: 'upload_file' },
    { title: 'Review', icon: 'rate_review' },
  ]

  useEffect(() => {
    console.log('>>> [useEffect] Running, isAuth:', isAuth, 'user:', !!user, 'isEditing:', isEditing, 'poId:', poId)
    
    if (!isAuth || !user) {
      console.log('>>> [useEffect] Skipping - auth not ready')
      return
    }

    const loadData = async () => {
      console.log('>>> [useEffect] Loading data...')
      try {
        let poData: PurchaseOrderResponse | null = null;
        if (isEditing && poId) {
          console.log('>>> [useEffect] Fetching PO id:', poId)
          poData = await getPurchaseOrder(poId);
          console.log('>>> [useEffect] PO data received:', poData)
        }

        const definitions = await getCustomFieldDefinitions('PurchaseOrder', poData?.po_type || undefined);
        setFieldDefinitions(definitions)
        const customFields: Record<string, CustomFieldValue> = {}
        definitions.forEach((def) => {
          customFields[def.field_key] = ''
        })

        if (poData) {
          console.log('>>> [useEffect] Setting formData with PO data...')
          setFormData({
            entity_id: poData.entity_id?.toString() || '',
            po_number: poData.po_number || '',
            vendor_id: poData.vendor_id?.toString() || '',
            vendor_name: poData.vendor_name || '',
            status: poData.status || 'draft',
            po_type: poData.po_type || '',
            order_date: poData.order_date ? poData.order_date.split('T')[0] : '',
            expected_delivery_date: poData.expected_delivery_date
              ? poData.expected_delivery_date.split('T')[0]
              : '',
            actual_delivery_date: poData.actual_delivery_date
              ? poData.actual_delivery_date.split('T')[0]
              : '',
            currency: poData.currency || 'USD',
            total_amount: poData.total_amount?.toString() || '0',
            notes: poData.notes || '',
            shipping_method: poData.shipping_method || '',
            shipping_terms: poData.shipping_terms || '',
            destination_address: poData.destination_address || '',
            bill_to_address: poData.bill_to_address || '',
            incoterm: poData.incoterm || '',
            tracking_number: poData.tracking_number || '',
            carrier: poData.carrier || '',
            custom_fields: { ...customFields, ...poData.custom_fields },

            // New Fields
            supplier_contact_name: poData.supplier_contact_name || '',
            supplier_email: poData.supplier_email || '',
            supplier_phone: poData.supplier_phone || '',
            supplier_address: poData.supplier_address || '',
            supplier_country: poData.supplier_country || '',
            origin_city_port: poData.origin_city_port || '',
            payment_terms: poData.payment_terms || '',
            cargo_description: poData.cargo_description || '',
            hs_code: poData.hs_code || '',
            product_category: poData.product_category || '',
            quantity: poData.quantity?.toString() || '',
            unit_of_measure: poData.unit_of_measure || '',
            number_of_cartons_pallets: poData.number_of_cartons_pallets?.toString() || '',
            dimension_length: poData.dimension_length?.toString() || '',
            dimension_width: poData.dimension_width?.toString() || '',
            dimension_height: poData.dimension_height?.toString() || '',
            total_cbm: poData.total_cbm?.toString() || '',
            gross_weight_per_carton: poData.gross_weight_per_carton?.toString() || '',
            total_gross_weight: poData.total_gross_weight?.toString() || '',
            total_net_weight: poData.total_net_weight?.toString() || '',
            is_dangerous_goods: !!poData.is_dangerous_goods,
            dg_class_un_number: poData.dg_class_un_number || '',
            is_temperature_controlled: !!poData.is_temperature_controlled,
            temperature_range: poData.temperature_range || '',
            estimated_ready_date: poData.estimated_ready_date ? poData.estimated_ready_date.split('T')[0] : '',
            target_ship_date: poData.target_ship_date ? poData.target_ship_date.split('T')[0] : '',

            // Documents
            po_document: null,
            product_spec_sheet: null,
            msds: null,
            pre_production_sample: null,
            po_document_url: poData.po_document_url,
            product_spec_sheet_url: poData.product_spec_sheet_url,
            msds_url: poData.msds_url,
            pre_production_sample_url: poData.pre_production_sample_url,
          })
          console.log('>>> [useEffect] formData set successfully')
        } else {
          console.log('>>> [useEffect] No PO data, using defaults')
          setFormData((prev) => ({
            ...prev,
            entity_id: user.entity_id?.toString() || '',
            custom_fields: customFields,
          }))
        }
      } catch (err) {
        console.error('>>> [useEffect] Error loading PO:', err)
        setError(err instanceof Error ? err.message : 'Failed to load purchase order or field definitions')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, poId, user])

  const validateStep = (step: number, validateAll = false): { isValid: boolean, errors: Record<string, string> } => {
    const errors: Record<string, string> = {}

    // Step 0: Core Order Details
    if (step === 0 || validateAll) {
      if (!(formData.po_number || '').trim()) errors.po_number = 'PO Number is required'
      if (!formData.po_type) errors.po_type = 'PO Type is required'
      if (!(formData.vendor_id || '').trim()) errors.vendor_id = 'Vendor ID is required'
      if (!formData.order_date) errors.order_date = 'Order date is required'
      if (!formData.currency) errors.currency = 'Currency is required'
      if (!(formData.total_amount || '').trim()) {
        errors.total_amount = 'Total amount is required'
      } else if (isNaN(parseFloat(formData.total_amount)) || parseFloat(formData.total_amount) < 0) {
        errors.total_amount = 'Total amount must be a valid positive number'
      }
    }

    // Step 1: Supplier & Cargo
    if (step === 1 || validateAll) {
      if (!(formData.supplier_email || '').trim()) {
        errors.supplier_email = 'Supplier email is required'
      } else if (!/\S+@\S+\.\S+/.test(formData.supplier_email)) {
        errors.supplier_email = 'Invalid email format'
      }
      if (!formData.supplier_country) errors.supplier_country = 'Country is required'
      if (!formData.origin_city_port) errors.origin_city_port = 'Origin city/port is required'
      if (!formData.cargo_description) errors.cargo_description = 'Cargo description is required'
      if (!formData.hs_code) errors.hs_code = 'HS Code is required'
      if (!formData.quantity) errors.quantity = 'Quantity is required'
      if (!formData.unit_of_measure) errors.unit_of_measure = 'UoM is required'
    }

    // Step 2: Logistics Specs
    if (step === 2 || validateAll) {
      if (!formData.incoterm) errors.incoterm = 'Incoterm is required'
      if (!formData.total_cbm) errors.total_cbm = 'Total CBM is required'
      if (!formData.total_gross_weight) errors.total_gross_weight = 'Total gross weight is required'
      if (!formData.estimated_ready_date) errors.estimated_ready_date = 'Estimated ready date is required'

      if (formData.expected_delivery_date && formData.order_date) {
        const orderDate = new Date(formData.order_date)
        const expectedDate = new Date(formData.expected_delivery_date)
        if (expectedDate < orderDate) {
          errors.expected_delivery_date = 'Expected delivery must be after order date'
        }
      }
    }

    // Step 3: Documents
    if (step === 3 || validateAll) {
      // PO Document is always required for new POs
      // For editing, it's only required if no existing URL and no new file
      const poDocMissing = !formData.po_document && !formData.po_document_url;
      if (poDocMissing) {
        errors.po_document = 'PO Document is required';
      }
    }

    // Custom Fields validation
    if (validateAll) {
      fieldDefinitions.forEach(def => {
        if (def.is_mandatory) {
          // Skip validation for 'po_type' custom field as it conflicts with main po_type
          if (def.field_key === 'po_type') return;

          const val = formData.custom_fields[def.field_key];
          if (val === undefined || val === null || String(val).trim() === '') {
            errors[`custom_fields.${def.field_key}`] = `${def.field_label} is required`;
          }
        }
      });
    }

    if (JSON.stringify(validationErrors) !== JSON.stringify(errors)) {
      setValidationErrors(errors)
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const handleNext = () => {
    const { isValid } = validateStep(currentStep)
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    if (!user) return

    if (currentStep !== 4) {
      handleNext()
      return
    }

    const { isValid, errors } = validateStep(4, true)
    if (!isValid) {
      const errorMsg = "Validation failed for: " + Object.keys(errors).map(k => k.replace('custom_fields.', '')).join(", ")
      console.error('>>> ' + errorMsg, errors)
      setError("Please check the following fields: " + Object.values(errors).join("; "))
      return
    }

    setIsSaving(true)

    try {
      const data = new FormData();

      // Basic PO fields
      data.append('purchase_order[entity_id]', user.entity_id?.toString() || '');
      data.append('purchase_order[po_number]', formData.po_number);
      data.append('purchase_order[vendor_id]', formData.vendor_id);
      data.append('purchase_order[vendor_name]', formData.vendor_name);
      data.append('purchase_order[status]', formData.status);
      data.append('purchase_order[po_type]', formData.po_type);
      data.append('purchase_order[order_date]', formData.order_date);
      data.append('purchase_order[expected_delivery_date]', formData.expected_delivery_date || '');
      data.append('purchase_order[actual_delivery_date]', formData.actual_delivery_date || '');
      data.append('purchase_order[currency]', formData.currency);
      data.append('purchase_order[total_amount]', formData.total_amount);
      data.append('purchase_order[notes]', formData.notes || '');
      data.append('purchase_order[shipping_method]', formData.shipping_method || '');
      data.append('purchase_order[shipping_terms]', formData.shipping_terms || '');
      data.append('purchase_order[destination_address]', formData.destination_address || '');
      data.append('purchase_order[bill_to_address]', formData.bill_to_address || '');
      data.append('purchase_order[incoterm]', formData.incoterm || '');
      data.append('purchase_order[tracking_number]', formData.tracking_number || '');
      data.append('purchase_order[carrier]', formData.carrier || '');

      // Custom fields
      data.append('purchase_order[custom_fields]', JSON.stringify(formData.custom_fields));

      // New fields
      data.append('purchase_order[supplier_contact_name]', formData.supplier_contact_name);
      data.append('purchase_order[supplier_email]', formData.supplier_email);
      data.append('purchase_order[supplier_phone]', formData.supplier_phone);
      data.append('purchase_order[supplier_address]', formData.supplier_address);
      data.append('purchase_order[supplier_country]', formData.supplier_country);
      data.append('purchase_order[origin_city_port]', formData.origin_city_port);
      data.append('purchase_order[payment_terms]', formData.payment_terms);
      data.append('purchase_order[cargo_description]', formData.cargo_description);
      data.append('purchase_order[hs_code]', formData.hs_code);
      data.append('purchase_order[product_category]', formData.product_category);
      data.append('purchase_order[quantity]', formData.quantity);
      data.append('purchase_order[unit_of_measure]', formData.unit_of_measure);
      data.append('purchase_order[number_of_cartons_pallets]', formData.number_of_cartons_pallets);
      data.append('purchase_order[dimension_length]', formData.dimension_length);
      data.append('purchase_order[dimension_width]', formData.dimension_width);
      data.append('purchase_order[dimension_height]', formData.dimension_height);
      data.append('purchase_order[total_cbm]', formData.total_cbm);
      data.append('purchase_order[gross_weight_per_carton]', formData.gross_weight_per_carton);
      data.append('purchase_order[total_gross_weight]', formData.total_gross_weight);
      data.append('purchase_order[total_net_weight]', formData.total_net_weight);
      data.append('purchase_order[is_dangerous_goods]', String(formData.is_dangerous_goods));
      data.append('purchase_order[dg_class_un_number]', formData.dg_class_un_number);
      data.append('purchase_order[is_temperature_controlled]', String(formData.is_temperature_controlled));
      data.append('purchase_order[temperature_range]', formData.temperature_range);
      data.append('purchase_order[estimated_ready_date]', formData.estimated_ready_date);
      data.append('purchase_order[target_ship_date]', formData.target_ship_date);

      // Files - Only append if a new file was actually selected
      if (formData.po_document instanceof File) data.append('purchase_order[po_document]', formData.po_document);
      if (formData.product_spec_sheet instanceof File) data.append('purchase_order[product_spec_sheet]', formData.product_spec_sheet);
      if (formData.msds instanceof File) data.append('purchase_order[msds]', formData.msds);
      if (formData.pre_production_sample instanceof File) data.append('purchase_order[pre_production_sample]', formData.pre_production_sample);

      if (isEditing && poId) {
        await updatePurchaseOrder(poId, data as unknown as UpdatePurchaseOrderRequest)
      } else {
        await createPurchaseOrder(data as unknown as CreatePurchaseOrderRequest)
      }

      if (isEditing) {
        navigate(`/purchase-orders/${id}`)
      } else {
        navigate('/purchase-orders')
      }
    } catch (err) {
      console.error('Error saving PO:', err)
      const message = err instanceof Error ? err.message : 'Failed to save purchase order';
      setError(message)
      // If it's a validation error about the document, alert the user specifically
      if (message.toLowerCase().includes('po_document')) {
        alert("Server Error: The PO Document is required. Please re-upload it if the error persists.")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handlePoTypeChange = async (value: string) => {
    setFieldDefinitions([])
    setFormData((prev) => ({
      ...prev,
      po_type: value as PurchaseOrderType,
      custom_fields: {}
    }))

    if (!value) return

    try {
      const definitions = await getCustomFieldDefinitions('PurchaseOrder', value)
      setFieldDefinitions(definitions)
      const newCustomFields: Record<string, CustomFieldValue> = {}
      definitions.forEach((def) => {
        newCustomFields[def.field_key] = ''
      })
      setFormData((prev) => ({ ...prev, custom_fields: newCustomFields }))
    } catch (err) {
      console.error('Error loading custom fields for type:', value, err)
      setError('Failed to load custom fields for this PO type')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }))
      // Clear validation error for this field
      if (validationErrors[name]) {
        setValidationErrors((prev) => ({ ...prev, [name]: '' }))
      }
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target

    if (name === 'po_type') {
      handlePoTypeChange(value)
    } else if (name.startsWith('custom_fields.')) {
      const fieldKey = name.split('.')[1]
      const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      setFormData((prev) => ({
        ...prev,
        custom_fields: { ...prev.custom_fields, [fieldKey]: fieldValue },
      }))
    } else {
      const isCheckbox = type === 'checkbox'
      const fieldValue = isCheckbox ? (e.target as HTMLInputElement).checked : value

      setFormData((prev) => {
        const next = { ...prev, [name]: fieldValue }

        // Auto-calc Total CBM
        if (['dimension_length', 'dimension_width', 'dimension_height', 'number_of_cartons_pallets'].includes(name)) {
          const l = parseFloat(next.dimension_length) || 0
          const w = parseFloat(next.dimension_width) || 0
          const h = parseFloat(next.dimension_height) || 0
          const n = parseInt(next.number_of_cartons_pallets) || 0
          if (l && w && h && n) {
            next.total_cbm = ((l * w * h * n) / 1000000).toFixed(4)
          }
        }

        // Auto-calc Total Gross Weight
        if (['gross_weight_per_carton', 'number_of_cartons_pallets'].includes(name)) {
          const gw = parseFloat(next.gross_weight_per_carton) || 0
          const n = parseInt(next.number_of_cartons_pallets) || 0
          if (gw && n) {
            next.total_gross_weight = (gw * n).toFixed(2)
          }
        }

        return next
      })
    }

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />


  return (
    <div className="max-w-screen-xl mx-auto min-h-screen pt-12 pb-20 px-6">
      {/* Breadcrumbs and Header Section */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/purchase-orders')}>Orders</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{isEditing ? `PO #${formData.po_number || '...'}` : 'New Order'}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">Edit Details</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h1>
          <p className="text-on-surface-variant font-light max-w-xl">
            {isEditing
              ? `Update the details for logistics movement #${formData.po_number}. Changes will be synchronized across the supply chain once reviewed.`
              : 'Register a new purchase order for the logistics network. Complete all required fields to proceed to review.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/purchase-orders')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {/* Mock Save Draft */}}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-fixed-dim editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Save Draft
          </button>
        </div>
      </header>

      {error && <div className="mb-8 max-w-4xl mx-auto"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      {/* Stepper Progress Indicator */}
      <div className="mb-16">
        <div className="flex items-center justify-between relative max-w-4xl mx-auto px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-container-high -translate-y-1/2 -z-10"></div>

          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const hasError = index === 3 && validationErrors.po_document;
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={index > currentStep && !validateStep(currentStep)}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 relative ${
                    isActive
                      ? 'bg-primary text-on-primary ring-4 ring-primary-container/30'
                      : isCompleted
                        ? 'bg-primary-container text-on-primary-container editorial-shadow'
                        : hasError
                          ? 'bg-error-container text-error border-2 border-error'
                          : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[20px]">check</span>
                  ) : hasError ? (
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                  ) : (
                    (index + 1)
                  )}
                </button>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : isCompleted ? 'text-on-primary-container' : hasError ? 'text-error' : 'text-on-surface-variant font-medium'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column (Steps) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Core Information */}
            {currentStep === 0 && (
              <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20 animate-in fade-in slide-in-from-right-4 duration-500">
                <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  Core Order Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">PO Number <span className="text-error">*</span></label>
                    <input
                      type="text"
                      name="po_number"
                      value={formData.po_number}
                      onChange={handleChange}
                      placeholder="e.g. PO-2024-001"
                      className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.po_number ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                    />
                    {validationErrors.po_number && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.po_number}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Vendor ID <span className="text-error">*</span></label>
                    <input
                      type="number"
                      name="vendor_id"
                      value={formData.vendor_id}
                      onChange={handleChange}
                      placeholder="e.g. 1"
                      className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.vendor_id ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                    />
                    {validationErrors.vendor_id && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.vendor_id}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Supplier/Vendor Name</label>
                    <input
                      type="text"
                      name="vendor_name"
                      value={formData.vendor_name}
                      onChange={handleChange}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">PO Type <span className="text-error">*</span></label>
                    <select
                      name="po_type"
                      value={formData.po_type}
                      onChange={handleChange}
                      disabled={isEditing && !!formData.po_type}
                      className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.po_type ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                    >
                      <option value="">Select PO Type...</option>
                      <option value="standard">Standard</option>
                      <option value="blanket">Blanket</option>
                      <option value="service">Service</option>
                    </select>
                    {validationErrors.po_type && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.po_type}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Order Status <span className="text-error">*</span></label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Order Date <span className="text-error">*</span></label>
                    <input
                      type="date"
                      name="order_date"
                      value={formData.order_date}
                      onChange={handleChange}
                      className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.order_date ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                    />
                    {validationErrors.order_date && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.order_date}</p>}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Notes & Special Instructions</label>
                    <div className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-white">
                      <RichTextEditor
                        value={formData.notes}
                        onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
                        placeholder="Enter detailed procurement notes here..."
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Step 2: Supplier & Cargo */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
                  <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">store</span>
                    Supplier Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Contact Name</label>
                      <input
                        type="text"
                        name="supplier_contact_name"
                        value={formData.supplier_contact_name}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Email <span className="text-error">*</span></label>
                      <input
                        type="email"
                        name="supplier_email"
                        value={formData.supplier_email}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.supplier_email ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                      {validationErrors.supplier_email && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.supplier_email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Phone</label>
                      <input
                        type="text"
                        name="supplier_phone"
                        value={formData.supplier_phone}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Country <span className="text-error">*</span></label>
                      <select
                        name="supplier_country"
                        value={formData.supplier_country}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.supplier_country ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      >
                        <option value="">Select country...</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Address</label>
                      <textarea
                        name="supplier_address"
                        rows={2}
                        value={formData.supplier_address}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface resize-none focus:ring-primary-container/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Origin City / Port <span className="text-error">*</span></label>
                      <input
                        type="text"
                        name="origin_city_port"
                        value={formData.origin_city_port}
                        onChange={handleChange}
                        placeholder="e.g. Shanghai Port"
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.origin_city_port ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
                  <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">inventory_2</span>
                    Cargo Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Cargo Description <span className="text-error">*</span></label>
                      <input
                        type="text"
                        name="cargo_description"
                        value={formData.cargo_description}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.cargo_description ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">HS Code <span className="text-error">*</span></label>
                      <input
                        type="text"
                        name="hs_code"
                        value={formData.hs_code}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.hs_code ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Product Category</label>
                      <select
                        name="product_category"
                        value={formData.product_category}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                      >
                        <option value="">Select category...</option>
                        {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Quantity <span className="text-error">*</span></label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.quantity ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Unit of Measure <span className="text-error">*</span></label>
                      <select
                        name="unit_of_measure"
                        value={formData.unit_of_measure}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.unit_of_measure ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      >
                        <option value="">Select UoM...</option>
                        {UNITS_OF_MEASURE.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Step 3: Logistics Specs */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
                  <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">local_shipping</span>
                    Logistics & Shipping Specs
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Incoterm <span className="text-error">*</span></label>
                      <select
                        name="incoterm"
                        value={formData.incoterm}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.incoterm ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      >
                        <option value="">Select incoterm...</option>
                        {INCOTERMS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Shipping Terms</label>
                      <select
                        name="shipping_terms"
                        value={formData.shipping_terms}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                      >
                        <option value="">Select terms...</option>
                        {SHIPPING_TERMS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Payment Terms</label>
                      <select
                        name="payment_terms"
                        value={formData.payment_terms}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                      >
                        <option value="">Select payment terms...</option>
                        {PAYMENT_TERMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Preferred Freight Mode</label>
                      <select
                        name="shipping_method"
                        value={formData.shipping_method}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                      >
                        <option value="">Select mode...</option>
                        {SHIPPING_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Number of Cartons / Pallets</label>
                      <input
                        type="number"
                        name="number_of_cartons_pallets"
                        value={formData.number_of_cartons_pallets}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Length (cm)</label>
                        <input type="number" name="dimension_length" value={formData.dimension_length} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Width (cm)</label>
                        <input type="number" name="dimension_width" value={formData.dimension_width} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Height (cm)</label>
                        <input type="number" name="dimension_height" value={formData.dimension_height} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Total CBM <span className="text-error">*</span></label>
                      <input
                        type="number"
                        name="total_cbm"
                        value={formData.total_cbm}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.total_cbm ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Gross Weight / Carton (kg)</label>
                      <input
                        type="number"
                        name="gross_weight_per_carton"
                        value={formData.gross_weight_per_carton}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Total Gross Weight (kg) <span className="text-error">*</span></label>
                      <input
                        type="number"
                        name="total_gross_weight"
                        value={formData.total_gross_weight}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.total_gross_weight ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Total Net Weight (kg)</label>
                      <input
                        type="number"
                        name="total_net_weight"
                        value={formData.total_net_weight}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl border-none">
                      <input
                        type="checkbox"
                        name="is_dangerous_goods"
                        checked={formData.is_dangerous_goods}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary-container/40 bg-white"
                      />
                      <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Dangerous Goods?</span>
                    </div>
                    {formData.is_dangerous_goods && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">DG Class / UN Number</label>
                        <input type="text" name="dg_class_un_number" value={formData.dg_class_un_number} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl border-none">
                      <input
                        type="checkbox"
                        name="is_temperature_controlled"
                        checked={formData.is_temperature_controlled}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary-container/40 bg-white"
                      />
                      <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Temperature Control?</span>
                    </div>
                    {formData.is_temperature_controlled && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Temp Range (°C)</label>
                        <input type="text" name="temperature_range" value={formData.temperature_range} onChange={handleChange} placeholder="e.g. 2°C - 8°C" className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
                  <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">calendar_month</span>
                    Key Timelines
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Estimated Ready Date <span className="text-error">*</span></label>
                      <input
                        type="date"
                        name="estimated_ready_date"
                        value={formData.estimated_ready_date}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.estimated_ready_date ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Target Ship Date</label>
                      <input type="date" name="target_ship_date" value={formData.target_ship_date} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Required Delivery Date</label>
                      <input type="date" name="expected_delivery_date" value={formData.expected_delivery_date} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                    </div>
                  </div>
                </section>

                {fieldDefinitions.length > 0 && (
                  <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
                    <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">dynamic_form</span>
                      Custom Order Information ({formData.po_type})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fieldDefinitions.map((def) => (
                        <div key={def.field_key} className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">
                            {def.field_label}{def.is_mandatory && <span className="text-error">*</span>}
                          </label>
                          {def.field_type === 'checkbox' ? (
                            <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl border-none">
                              <input
                                type="checkbox"
                                name={`custom_fields.${def.field_key}`}
                                checked={!!formData.custom_fields[def.field_key]}
                                onChange={(e) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    custom_fields: { ...prev.custom_fields, [def.field_key]: e.target.checked },
                                  }))
                                }
                                className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary-container/40 bg-white"
                              />
                              <span className="text-sm font-medium text-on-surface-variant">{def.hint || 'Enabled'}</span>
                            </div>
                          ) : def.field_type === 'select' ? (
                            <select
                              name={`custom_fields.${def.field_key}`}
                              value={String(formData.custom_fields[def.field_key] ?? '')}
                              onChange={handleChange}
                              className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors[`custom_fields.${def.field_key}`] ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                            >
                              <option value="">Select...</option>
                              {(Array.isArray(def.possible_values)
                                ? def.possible_values
                                : (def.possible_values as string)?.split?.(',') || []
                               ).map((val: string) => val.trim()).map((val) => (
                                <option key={val} value={val}>{val}</option>
                              ))}
                            </select>
                          ) : def.field_type === 'number' ? (
                            <input
                              type="number"
                              name={`custom_fields.${def.field_key}`}
                              value={typeof formData.custom_fields[def.field_key] === 'number' ? formData.custom_fields[def.field_key] as number : ''}
                              onChange={handleChange}
                              placeholder={def.hint || ''}
                              className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors[`custom_fields.${def.field_key}`] ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                            />
                          ) : (
                            <input
                              type="text"
                              name={`custom_fields.${def.field_key}`}
                              value={String(formData.custom_fields[def.field_key] ?? '')}
                              onChange={handleChange}
                              placeholder={def.hint || ''}
                              className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors[`custom_fields.${def.field_key}`] ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                            />
                          )}
                          {validationErrors[`custom_fields.${def.field_key}`] && (
                            <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors[`custom_fields.${def.field_key}`]}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
                  validationErrors.po_document 
                    ? 'bg-error-container/20 border-error/30' 
                    : 'bg-primary-container/20 border-primary-container/30'
                }`}>
                  <span className={`material-symbols-outlined ${validationErrors.po_document ? 'text-error' : 'text-primary'}`} data-weight="fill">info</span>
                  <div>
                    <h3 className={`font-bold mb-1 ${validationErrors.po_document ? 'text-error' : 'text-on-primary-container'}`}>
                      {validationErrors.po_document ? 'PO Document Required' : 'Document Upload'}
                    </h3>
                    <p className={`text-sm font-medium leading-relaxed ${validationErrors.po_document ? 'text-error' : 'text-on-primary-container'}`}>
                      {validationErrors.po_document 
                        ? 'Please upload the signed PO document to proceed. This is a mandatory document.'
                        : 'Upload all required documents for this purchase order. The signed PO document is mandatory.'}
                    </p>
                  </div>
                </div>

                <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
                  <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">upload_file</span>
                    Order Documents
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Signed PO */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">PO Document (PDF) <span className="text-error">*</span></label>
                      <div className="relative group">
                        <input type="file" name="po_document" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${
                          validationErrors.po_document 
                            ? 'border-error bg-error-container/10' 
                            : formData.po_document 
                              ? 'border-primary bg-primary-container/10' 
                              : 'border-outline-variant/30 group-hover:border-primary/50'
                        }`}>
                          <span className={`material-symbols-outlined text-3xl ${validationErrors.po_document ? 'text-error' : 'text-primary'}`}>{formData.po_document ? 'description' : 'upload_file'}</span>
                          <div className="text-center">
                            <p className={`text-sm font-bold ${validationErrors.po_document ? 'text-error' : 'text-on-surface'}`}>{formData.po_document ? formData.po_document.name : 'Upload Signed PO'}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">PDF up to 10MB</p>
                          </div>
                        </div>
                      </div>
                      {formData.po_document_url && !formData.po_document && <p className="text-[10px] text-primary font-bold">✓ Existing document uploaded</p>}
                      {validationErrors.po_document && <p className="text-[10px] font-bold text-error mt-1">{validationErrors.po_document}</p>}
                    </div>

                    {/* Spec Sheet */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Product Spec Sheet</label>
                      <div className="relative group">
                        <input type="file" name="product_spec_sheet" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${formData.product_spec_sheet ? 'border-primary bg-primary-container/10' : 'border-outline-variant/30 group-hover:border-primary/50'}`}>
                          <span className="material-symbols-outlined text-3xl text-primary">{formData.product_spec_sheet ? 'description' : 'upload_file'}</span>
                          <div className="text-center">
                            <p className="text-sm font-bold text-on-surface">{formData.product_spec_sheet ? formData.product_spec_sheet.name : 'Upload Spec Sheet'}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">PDF, DOC, Images</p>
                          </div>
                        </div>
                      </div>
                      {formData.product_spec_sheet_url && !formData.product_spec_sheet && <p className="text-[10px] text-primary font-bold">✓ Existing document uploaded</p>}
                    </div>

                    {/* MSDS */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Material Safety Data Sheet (MSDS)</label>
                      <div className="relative group">
                        <input type="file" name="msds" accept=".pdf" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${formData.msds ? 'border-primary bg-primary-container/10' : 'border-outline-variant/30 group-hover:border-primary/50'}`}>
                          <span className="material-symbols-outlined text-3xl text-primary">{formData.msds ? 'description' : 'upload_file'}</span>
                          <div className="text-center">
                            <p className="text-sm font-bold text-on-surface">{formData.msds ? formData.msds.name : 'Upload MSDS (If DG)'}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">Required for Dangerous Goods</p>
                          </div>
                        </div>
                      </div>
                      {formData.msds_url && !formData.msds && <p className="text-[10px] text-primary font-bold">✓ Existing document uploaded</p>}
                      {validationErrors.msds && <p className="text-[10px] font-bold text-error mt-1">{validationErrors.msds}</p>}
                    </div>

                    {/* Sample Approval */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Pre-Production Sample Approval</label>
                      <div className="relative group">
                        <input type="file" name="pre_production_sample" accept=".pdf,.jpg,.png" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all ${formData.pre_production_sample ? 'border-primary bg-primary-container/10' : 'border-outline-variant/30 group-hover:border-primary/50'}`}>
                          <span className="material-symbols-outlined text-3xl text-primary">{formData.pre_production_sample ? 'description' : 'upload_file'}</span>
                          <div className="text-center">
                            <p className="text-sm font-bold text-on-surface">{formData.pre_production_sample ? formData.pre_production_sample.name : 'Upload Sample Approval'}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">PDF or Images</p>
                          </div>
                        </div>
                      </div>
                      {formData.pre_production_sample_url && !formData.pre_production_sample && <p className="text-[10px] text-primary font-bold">✓ Existing document uploaded</p>}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="p-6 bg-primary-container/20 rounded-2xl border border-primary-container/30 flex items-start gap-4 shadow-sm">
                  <span className="material-symbols-outlined text-primary" data-weight="fill">info</span>
                  <div>
                    <h3 className="font-bold text-on-primary-container mb-1">Final Verification Required</h3>
                    <p className="text-on-primary-container text-sm font-medium leading-relaxed">
                      Please review all purchase order details carefully. Once submitted, this order will be processed
                      within the system and notifications will be dispatched to the relevant logistics partners.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Summary: Core & Supplier */}
                  <section className="bg-surface-container-lowest rounded-3xl editorial-shadow border border-white/20 overflow-hidden">
                    <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container/30 flex items-center justify-between">
                      <h3 className="font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Core & Supplier</h3>
                      <button type="button" onClick={() => setCurrentStep(0)} className="text-primary font-bold text-xs uppercase hover:underline">Edit</button>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                        <span className="text-on-surface-variant text-sm">PO Number</span>
                        <span className="font-bold text-on-surface">{formData.po_number}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                        <span className="text-on-surface-variant text-sm">Vendor</span>
                        <span className="font-bold text-on-surface">{formData.vendor_name || formData.vendor_id}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                        <span className="text-on-surface-variant text-sm">Supplier Email</span>
                        <span className="font-bold text-on-surface">{formData.supplier_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant text-sm">Origin Port</span>
                        <span className="font-bold text-on-surface">{formData.origin_city_port}</span>
                      </div>
                    </div>
                  </section>

                  {/* Summary: Logistics */}
                  <section className="bg-surface-container-lowest rounded-3xl editorial-shadow border border-white/20 overflow-hidden">
                    <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container/30 flex items-center justify-between">
                      <h3 className="font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Logistics Specs</h3>
                      <button type="button" onClick={() => setCurrentStep(2)} className="text-primary font-bold text-xs uppercase hover:underline">Edit</button>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                        <span className="text-on-surface-variant text-sm">Incoterm</span>
                        <span className="font-bold text-on-surface uppercase">{formData.incoterm}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                        <span className="text-on-surface-variant text-sm">Total CBM</span>
                        <span className="font-bold text-on-surface">{formData.total_cbm} m3</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/10 pb-2">
                        <span className="text-on-surface-variant text-sm">Gross Weight</span>
                        <span className="font-bold text-on-surface">{formData.total_gross_weight} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant text-sm">Est. Ready Date</span>
                        <span className="font-bold text-on-surface">{formData.estimated_ready_date}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="bg-surface-container-lowest rounded-3xl editorial-shadow border border-white/20 overflow-hidden">
                  <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container/30 flex items-center justify-between">
                    <h3 className="font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Cargo & Notes</h3>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-primary font-bold text-xs uppercase hover:underline">Edit</button>
                  </div>
                  <div className="p-8">
                     <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">HS Code</div>
                          <div className="font-bold text-on-surface">{formData.hs_code}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Quantity</div>
                          <div className="font-bold text-on-surface">{formData.quantity} {formData.unit_of_measure}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Dangerous Goods</div>
                          <div className="font-bold text-on-surface">{formData.is_dangerous_goods ? 'Yes' : 'No'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Temp Control</div>
                          <div className="font-bold text-on-surface">{formData.is_temperature_controlled ? 'Yes' : 'No'}</div>
                        </div>
                     </div>

                     <div className="mb-6 p-4 bg-surface-container-low rounded-xl">
                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Cargo Description</div>
                        <div className="text-sm font-medium text-on-surface">{formData.cargo_description}</div>
                     </div>

                     {formData.notes ? (
                       <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10 prose prose-slate prose-sm max-w-none text-on-surface" dangerouslySetInnerHTML={{ __html: formData.notes }} />
                     ) : (
                       <p className="text-on-surface-variant italic">No additional notes provided for this order.</p>
                     )}

                     {fieldDefinitions.length > 0 && (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-6 border-t border-outline-variant/10">
                         {fieldDefinitions.map(def => (
                           <div key={def.field_key}>
                             <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{def.field_label}</div>
                             <div className="font-bold text-on-surface">
                               {formData.custom_fields[def.field_key] === true ? 'Yes' :
                                formData.custom_fields[def.field_key] === false ? 'No' :
                                String(formData.custom_fields[def.field_key] || '-')}
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
                </section>

                <section className="bg-surface-container-lowest rounded-3xl editorial-shadow border border-white/20 overflow-hidden">
                  <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container/30 flex items-center justify-between">
                    <h3 className="font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Attached Documents</h3>
                    <button type="button" onClick={() => setCurrentStep(3)} className="text-primary font-bold text-xs uppercase hover:underline">Edit</button>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'PO Document', file: formData.po_document, url: formData.po_document_url },
                      { label: 'Spec Sheet', file: formData.product_spec_sheet, url: formData.product_spec_sheet_url },
                      { label: 'MSDS', file: formData.msds, url: formData.msds_url },
                      { label: 'Sample Approval', file: formData.pre_production_sample, url: formData.pre_production_sample_url },
                    ].map((doc, idx) => (
                      <div key={idx} className={`p-4 rounded-xl flex items-center gap-3 ${doc.file || doc.url ? 'bg-primary-container/20 border border-primary-container/30' : 'bg-surface-container-low opacity-50'}`}>
                        <span className="material-symbols-outlined text-primary">{doc.file || doc.url ? 'check_circle' : 'cancel'}</span>
                        <div>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{doc.label}</p>
                          <p className="text-xs font-bold text-on-surface truncate max-w-[120px]">{doc.file?.name || (doc.url ? 'Existing File' : 'Not attached')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Sticky Summary & Navigation */}
        <aside className="lg:col-span-4">
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/40 editorial-shadow sticky top-8">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Order Snapshot</h3>

            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-2.5 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Total Amount <span className="text-error">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-on-surface-variant">{formData.currency === 'USD' ? '$' : formData.currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`w-full pl-12 pr-4 py-2.5 bg-surface-container-low border-none rounded-xl text-on-surface focus:ring-4 transition-all font-bold ${validationErrors.total_amount ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                </div>
                {validationErrors.total_amount && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.total_amount}</p>}
              </div>

              <div className="pt-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant text-sm font-light">Subtotal Amount</span>
                  <span className="text-on-surface font-bold">{(parseFloat(formData.total_amount || '0') * 0.92).toLocaleString(undefined, { style: 'currency', currency: formData.currency || 'USD' })}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                  <span className="text-on-surface-variant text-sm font-light">Tax (8%)</span>
                  <span className="text-on-surface font-bold">{(parseFloat(formData.total_amount || '0') * 0.08).toLocaleString(undefined, { style: 'currency', currency: formData.currency || 'USD' })}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-on-surface-variant text-sm font-light">Grand Total</span>
                  <span className="text-2xl font-extrabold text-on-primary-fixed">{parseFloat(formData.total_amount || '0').toLocaleString(undefined, { style: 'currency', currency: formData.currency || 'USD' })}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-fixed-dim text-on-primary font-bold text-center editorial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                  Continue to {steps[currentStep + 1].title}
                  <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSaving}
                  className="w-full py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-fixed-dim text-on-primary font-bold text-center editorial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">verified</span>
                      {isEditing ? 'Update Order' : 'Create Order'}
                    </>
                  )}
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 0 || isSaving}
                  className="py-3 rounded-2xl bg-secondary-container text-on-secondary-container font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:grayscale"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/purchase-orders')}
                  className="py-3 rounded-2xl bg-surface-container-high text-on-surface-variant font-bold text-sm hover:bg-error-container hover:text-on-error-container active:scale-[0.98] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-primary-container/20 rounded-2xl border border-primary-container/30">
              <p className="text-[11px] text-on-primary-container leading-relaxed font-medium">
                <span className="material-symbols-outlined text-[14px] align-middle mr-1" data-weight="fill">info</span>
                Order changes will be logged in the <span className="font-bold">audit trail</span> and synchronized across all distribution centers.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-on-secondary-fixed text-white/70 p-6 rounded-3xl editorial-shadow">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4">Metadata</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between">
                <span className="opacity-70">Creator</span>
                <span className="text-white font-medium">{user?.username || 'System'}</span>
              </li>
              <li className="flex justify-between">
                <span className="opacity-70">PO Type</span>
                <span className="text-white font-medium uppercase">{formData.po_type || 'Drafting'}</span>
              </li>
              <li className="flex justify-between">
                <span className="opacity-70">Last Sync</span>
                <span className="text-white font-medium">Just now</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
