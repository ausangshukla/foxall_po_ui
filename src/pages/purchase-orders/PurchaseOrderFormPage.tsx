import React, { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, RichTextEditor } from '../../components/common'
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrder,
} from '../../api/purchase-orders'
import { getCustomFieldDefinitions } from '../../api/custom-fields'
import type {
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderStatus,
  PurchaseOrderType,
  ShippingMethod,
  ShippingTerm,
  CustomFieldDefinition,
} from '../../types/api'

interface FormData {
  entity_id: string
  po_number: string
  vendor_id: string
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
  custom_fields: Record<string, any>
}

const initialFormData: FormData = {
  entity_id: '',
  po_number: '',
  vendor_id: '',
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

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR']

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
    { title: 'PO Details', icon: 'description' },
    { title: 'Shipping', icon: 'local_shipping' },
    { title: 'Additional Info', icon: 'more_horiz' },
    { title: 'Review', icon: 'rate_review' },
  ]

  useEffect(() => {
    if (!isAuth || !user) return

    const loadData = async () => {
      try {
        let poData: any = null;
        if (isEditing && poId) {
          poData = await getPurchaseOrder(poId);
        }

        const definitions = await getCustomFieldDefinitions('purchase_orders', poData?.po_type || undefined);
        setFieldDefinitions(definitions)
        const customFields: Record<string, any> = {}
        definitions.forEach((def) => {
          customFields[def.field_key] = ''
        })

        if (poData) {
          setFormData({
            entity_id: poData.entity_id?.toString() || '',
            po_number: poData.po_number || '',
            vendor_id: poData.vendor_id?.toString() || '',
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
          })
        } else {
          setFormData((prev) => ({
            ...prev,
            entity_id: user.entity_id?.toString() || '',
            custom_fields: customFields,
          }))
        }
      } catch (err) {
        console.error('Error loading PO data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load purchase order or field definitions')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, poId, user])

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    if (step === 0) {
      if (!formData.po_number.trim()) errors.po_number = 'PO Number is required'
      if (!formData.po_type) errors.po_type = 'PO Type is required'
      if (!formData.vendor_id.trim()) errors.vendor_id = 'Vendor ID is required'
      if (!formData.order_date) errors.order_date = 'Order date is required'
      if (!formData.currency) errors.currency = 'Currency is required'
      if (!formData.total_amount.trim()) {
        errors.total_amount = 'Total amount is required'
      } else if (isNaN(parseFloat(formData.total_amount)) || parseFloat(formData.total_amount) < 0) {
        errors.total_amount = 'Total amount must be a valid positive number'
      }

      if (formData.expected_delivery_date && formData.order_date) {
        const orderDate = new Date(formData.order_date)
        const expectedDate = new Date(formData.expected_delivery_date)
        if (expectedDate < orderDate) {
          errors.expected_delivery_date = 'Expected delivery must be after order date'
        }
      }

      if (formData.actual_delivery_date && formData.order_date) {
        const orderDate = new Date(formData.order_date)
        const actualDate = new Date(formData.actual_delivery_date)
        if (actualDate < orderDate) {
          errors.actual_delivery_date = 'Actual delivery must be after order date'
        }
      }
    }

    if (step === 2) {
      fieldDefinitions.forEach(def => {
        if (def.is_mandatory) {
          const val = formData.custom_fields[def.field_key];
          if (val === undefined || val === null || val === '') {
            errors[`custom_fields.${def.field_key}`] = `${def.field_label} is required`;
          }
        }
      });
    }

    if (JSON.stringify(validationErrors) !== JSON.stringify(errors)) {
      setValidationErrors(errors)
    }
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async (e: FormEvent) => {
    if (e) e.preventDefault()
    setError(null)
    if (!user) return

    if (currentStep !== 3) {
      handleNext()
      return
    }

    if (!validateStep(3)) return

    setIsSaving(true)

    try {
      if (isEditing && poId) {
        const updateData: UpdatePurchaseOrderRequest = {
          entity_id: user.entity_id,
          po_number: formData.po_number,
          po_type: formData.po_type as PurchaseOrderType,
          vendor_id: parseInt(formData.vendor_id, 10),
          status: formData.status,
          order_date: formData.order_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          actual_delivery_date: formData.actual_delivery_date || null,
          currency: formData.currency,
          total_amount: parseFloat(formData.total_amount),
          notes: formData.notes || null,
          shipping_method: formData.shipping_method || null,
          shipping_terms: formData.shipping_terms || null,
          destination_address: formData.destination_address || null,
          bill_to_address: formData.bill_to_address || null,
          incoterm: formData.incoterm || null,
          tracking_number: formData.tracking_number || null,
          carrier: formData.carrier || null,
          custom_fields: formData.custom_fields,
        }
        await updatePurchaseOrder(poId, updateData)
      } else {
        const createData: CreatePurchaseOrderRequest = {
          entity_id: user.entity_id,
          po_number: formData.po_number,
          po_type: formData.po_type as PurchaseOrderType,
          vendor_id: parseInt(formData.vendor_id, 10),
          status: formData.status,
          order_date: formData.order_date,
          expected_delivery_date: formData.expected_delivery_date || null,
          actual_delivery_date: formData.actual_delivery_date || null,
          currency: formData.currency,
          total_amount: parseFloat(formData.total_amount),
          notes: formData.notes || null,
          shipping_method: formData.shipping_method || null,
          shipping_terms: formData.shipping_terms || null,
          destination_address: formData.destination_address || null,
          bill_to_address: formData.bill_to_address || null,
          incoterm: formData.incoterm || null,
          tracking_number: formData.tracking_number || null,
          carrier: formData.carrier || null,
          custom_fields: formData.custom_fields,
        }
        await createPurchaseOrder(createData)
      }

      if (isEditing) {
        navigate(`/purchase-orders/${id}`)
      } else {
        navigate('/purchase-orders')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save purchase order')
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
      const definitions = await getCustomFieldDefinitions('purchase_orders', value)
      setFieldDefinitions(definitions)
      const newCustomFields: Record<string, any> = {}
      definitions.forEach((def) => {
        newCustomFields[def.field_key] = ''
      })
      setFormData((prev) => ({ ...prev, custom_fields: newCustomFields }))
    } catch (err) {
      console.error('Error loading custom fields for type:', value, err)
      setError('Failed to load custom fields for this PO type')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    if (name === 'po_type') {
      handlePoTypeChange(value)
    } else if (name.startsWith('custom_fields.')) {
      const fieldKey = name.split('.')[1]
      const fieldValue = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      setFormData((prev) => ({
        ...prev,
        custom_fields: { ...prev.custom_fields, [fieldKey]: fieldValue },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
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
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  disabled={index > currentStep && !validateStep(currentStep)}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary text-on-primary ring-4 ring-primary-container/30' 
                      : isCompleted 
                        ? 'bg-primary-container text-on-primary-container editorial-shadow' 
                        : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/30'
                  }`}
                >
                  {isCompleted ? <span className="material-symbols-outlined text-[20px]">check</span> : (index + 1)}
                </button>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : isCompleted ? 'text-on-primary-container' : 'text-on-surface-variant font-medium'}`}>
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
                </div>
              </section>
            )}

            {/* Step 2: Shipping & Logistics */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
                  <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">local_shipping</span>
                    Shipping & Logistics
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Shipping Method</label>
                      <select
                        name="shipping_method"
                        value={formData.shipping_method}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                      >
                        <option value="">Select method...</option>
                        {SHIPPING_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
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
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Carrier Provider</label>
                      <input
                        type="text"
                        name="carrier"
                        value={formData.carrier}
                        onChange={handleChange}
                        placeholder="e.g. Ether Logistics Express"
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Tracking Number</label>
                      <input
                        type="text"
                        name="tracking_number"
                        value={formData.tracking_number}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Expected Arrival</label>
                      <input
                        type="date"
                        name="expected_delivery_date"
                        value={formData.expected_delivery_date}
                        onChange={handleChange}
                        className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.expected_delivery_date ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Actual Arrival</label>
                      <input
                        type="date"
                        name="actual_delivery_date"
                        value={formData.actual_delivery_date}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        name="incoterm"
                        value={formData.incoterm}
                        onChange={handleChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                      />
                    </div>
                  </div>
                </section>

                <section className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10">
                  <h2 className="text-lg font-bold text-on-secondary-fixed mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined">map</span>
                    Delivery Locations
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Destination Address</label>
                      <textarea
                        name="destination_address"
                        rows={3}
                        value={formData.destination_address}
                        onChange={handleChange}
                        placeholder="Warehouse or facility address..."
                        className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface resize-none focus:ring-primary-container/40"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Bill To Address</label>
                      <textarea
                        name="bill_to_address"
                        rows={3}
                        value={formData.bill_to_address}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface resize-none focus:ring-primary-container/40"
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Step 3: Notes & Custom Fields */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
                  <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">description</span>
                    Notes & Special Instructions
                  </h2>
                  <div className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-white">
                    <RichTextEditor
                      value={formData.notes}
                      onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
                      placeholder="Enter detailed procurement notes here..."
                    />
                  </div>
                </section>

                {fieldDefinitions.length > 0 && (
                  <section className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10">
                    <h2 className="text-lg font-bold text-on-secondary-fixed mb-6 flex items-center gap-2">
                      <span className="material-symbols-outlined">dynamic_form</span>
                      Custom Order Information ({formData.po_type})
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fieldDefinitions.map((def) => (
                        <div key={def.field_key} className="space-y-1.5">
                          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">
                            {def.field_label}{def.is_mandatory && <span className="text-error">*</span>}
                          </label>
                          {def.field_type === 'checkbox' ? (
                            <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-lowest rounded-xl border-none">
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
                              value={formData.custom_fields[def.field_key] || ''}
                              onChange={handleChange}
                              className={`w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors[`custom_fields.${def.field_key}`] ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                            >
                              <option value="">Select...</option>
                              {def.possible_values?.split(',').map((val) => val.trim()).map((val) => (
                                <option key={val} value={val}>{val}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={def.field_type}
                              name={`custom_fields.${def.field_key}`}
                              value={formData.custom_fields[def.field_key] || ''}
                              onChange={handleChange}
                              placeholder={def.hint || ''}
                              className={`w-full bg-surface-container-lowest border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors[`custom_fields.${def.field_key}`] ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
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

            {/* Step 4: Review */}
            {currentStep === 3 && (
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
                  <section className="bg-surface-container-lowest rounded-3xl editorial-shadow border border-white/20 overflow-hidden">
                    <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container/30 flex items-center justify-between">
                      <h3 className="font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Core Information</h3>
                      <button type="button" onClick={() => setCurrentStep(0)} className="text-primary font-bold text-xs uppercase hover:underline">Edit</button>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                        <span className="text-on-surface-variant text-sm font-light">PO Number</span>
                        <span className="font-bold text-on-surface">{formData.po_number}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                        <span className="text-on-surface-variant text-sm font-light">Order Type</span>
                        <span className="font-bold text-on-surface uppercase text-sm">{formData.po_type}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                        <span className="text-on-surface-variant text-sm font-light">Status</span>
                        <span className="font-bold text-on-surface">{STATUS_OPTIONS.find(o => o.value === formData.status)?.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant text-sm font-light">Order Date</span>
                        <span className="font-bold text-on-surface">{formData.order_date}</span>
                      </div>
                    </div>
                  </section>

                  <section className="bg-surface-container-lowest rounded-3xl editorial-shadow border border-white/20 overflow-hidden">
                    <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container/30 flex items-center justify-between">
                      <h3 className="font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Logistics Overview</h3>
                      <button type="button" onClick={() => setCurrentStep(1)} className="text-primary font-bold text-xs uppercase hover:underline">Edit</button>
                    </div>
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                        <span className="text-on-surface-variant text-sm font-light">Shipping Method</span>
                        <span className="font-bold text-on-surface">{SHIPPING_METHODS.find(m => m.value === formData.shipping_method)?.label || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                        <span className="text-on-surface-variant text-sm font-light">Carrier</span>
                        <span className="font-bold text-on-surface">{formData.carrier || 'Not assigned'}</span>
                      </div>
                      <div className="flex justify-between border-b border-outline-variant/10 pb-3">
                        <span className="text-on-surface-variant text-sm font-light">Tracking #</span>
                        <span className="font-bold text-on-surface truncate max-w-[150px]">{formData.tracking_number || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant text-sm font-light">Incoterm</span>
                        <span className="font-bold text-on-surface uppercase">{formData.incoterm || '—'}</span>
                      </div>
                    </div>
                  </section>
                </div>

                <section className="bg-surface-container-lowest rounded-3xl editorial-shadow border border-white/20 overflow-hidden">
                  <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container/30 flex items-center justify-between">
                    <h3 className="font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Notes & Additional Fields</h3>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-primary font-bold text-xs uppercase hover:underline">Edit</button>
                  </div>
                  <div className="p-8">
                     {formData.notes ? (
                       <div className="mb-8 p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10 prose prose-slate prose-sm max-w-none text-on-surface" dangerouslySetInnerHTML={{ __html: formData.notes }} />
                     ) : (
                       <p className="text-on-surface-variant italic mb-8">No additional notes provided for this order.</p>
                     )}
                     
                     {fieldDefinitions.length > 0 && (
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-outline-variant/10">
                         {fieldDefinitions.map(def => (
                           <div key={def.field_key}>
                             <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">{def.field_label}</div>
                             <div className="font-bold text-on-surface">
                               {formData.custom_fields[def.field_key] === true ? 'Yes' : 
                                formData.custom_fields[def.field_key] === false ? 'No' : 
                                String(formData.custom_fields[def.field_key] || '—')}
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
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
              {currentStep < 3 ? (
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
                  onClick={handleSubmit}
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
