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
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-headline">
            {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </h1>
          <p className="text-slate-500 font-medium">Complete the steps below to {isEditing ? 'update' : 'register'} the order</p>
        </div>
        <button
          onClick={() => navigate('/purchase-orders')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      {/* Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>

          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <div key={index} className="relative z-10 flex flex-col items-center group">
                <button
                  type="button"
                  disabled={index > currentStep && !validateStep(currentStep)}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-4 shadow-sm ${
                    isActive 
                      ? 'bg-blue-600 border-blue-100 text-white scale-110 shadow-blue-200' 
                      : isCompleted 
                        ? 'bg-emerald-500 border-emerald-100 text-white shadow-emerald-100' 
                        : 'bg-white border-slate-50 text-slate-400 hover:border-slate-100 hover:text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined">{isCompleted ? 'check' : step.icon}</span>
                </button>
                <span className={`mt-3 text-xs font-bold uppercase tracking-widest ${isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Core Information */}
        {currentStep === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">description</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Core Order Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">PO Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="po_number"
                  value={formData.po_number}
                  onChange={handleChange}
                  placeholder="e.g. PO-2024-001"
                  className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.po_number ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
                />
                {validationErrors.po_number && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.po_number}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Vendor ID <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="vendor_id"
                  value={formData.vendor_id}
                  onChange={handleChange}
                  placeholder="e.g. 1"
                  className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.vendor_id ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
                />
                {validationErrors.vendor_id && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.vendor_id}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">PO Type <span className="text-red-500">*</span></label>
                <select
                  name="po_type"
                  value={formData.po_type}
                  onChange={handleChange}
                  disabled={isEditing && !!formData.po_type}
                  className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.po_type ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
                >
                  <option value="">Select PO Type...</option>
                  <option value="standard">Standard</option>
                  <option value="blanket">Blanket</option>
                  <option value="service">Service</option>
                </select>
                {validationErrors.po_type && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.po_type}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status <span className="text-red-500">*</span></label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Order Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="order_date"
                  value={formData.order_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.order_date ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
                />
                {validationErrors.order_date && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.order_date}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Expected Delivery</label>
                <input
                  type="date"
                  name="expected_delivery_date"
                  value={formData.expected_delivery_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.expected_delivery_date ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Currency <span className="text-red-500">*</span></label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Total Amount <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.total_amount ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
                  />
                </div>
                {validationErrors.total_amount && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.total_amount}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Shipping & Logistics */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">local_shipping</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Shipping & Logistics</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6 mb-8">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Shipping Method</label>
                <select
                  name="shipping_method"
                  value={formData.shipping_method}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                >
                  <option value="">Select method...</option>
                  {SHIPPING_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Shipping Terms</label>
                <select
                  name="shipping_terms"
                  value={formData.shipping_terms}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                >
                  <option value="">Select terms...</option>
                  {SHIPPING_TERMS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Carrier</label>
                <input
                  type="text"
                  name="carrier"
                  value={formData.carrier}
                  onChange={handleChange}
                  placeholder="e.g. DHL, FedEx"
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tracking Number</label>
                <input
                  type="text"
                  name="tracking_number"
                  value={formData.tracking_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Incoterm</label>
                <input
                  type="text"
                  name="incoterm"
                  value={formData.incoterm}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Destination Address</label>
                <textarea
                  name="destination_address"
                  rows={3}
                  value={formData.destination_address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Bill To Address</label>
                <textarea
                  name="bill_to_address"
                  rows={3}
                  value={formData.bill_to_address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Notes & Custom Fields */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">notes</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Notes & Special Instructions</h2>
              </div>
              <RichTextEditor
                value={formData.notes}
                onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
                placeholder="Additional notes about this purchase order..."
              />
            </div>

            {fieldDefinitions.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined">dynamic_form</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Custom Fields ({formData.po_type})</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fieldDefinitions.map((def) => (
                    <div key={def.field_key} className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                        {def.field_label}{def.is_mandatory && <span className="text-red-500">*</span>}
                      </label>
                      {def.field_type === 'checkbox' ? (
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border-none">
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
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 bg-white"
                          />
                          <span className="text-sm font-medium text-slate-700">{def.hint || 'Enabled'}</span>
                        </div>
                      ) : def.field_type === 'select' ? (
                        <select
                          name={`custom_fields.${def.field_key}`}
                          value={formData.custom_fields[def.field_key] || ''}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors[`custom_fields.${def.field_key}`] ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
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
                          className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors[`custom_fields.${def.field_key}`] ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
                        />
                      )}
                      {validationErrors[`custom_fields.${def.field_key}`] && (
                        <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors[`custom_fields.${def.field_key}`]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
              <span className="material-symbols-outlined text-blue-600">info</span>
              <div>
                <h3 className="font-bold text-blue-900 mb-1">Almost done!</h3>
                <p className="text-blue-800 text-sm font-medium">Please review the details below before submitting. All mandatory fields have been verified.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Summary Sections */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Core Details</h3>
                  <button type="button" onClick={() => setCurrentStep(0)} className="text-blue-600 font-bold text-xs uppercase hover:underline underline-offset-4">Edit</button>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-slate-500 font-medium">PO Number</span>
                    <span className="font-bold text-slate-900">{formData.po_number}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-slate-500 font-medium">PO Type</span>
                    <span className="font-bold text-slate-900 uppercase text-sm">{formData.po_type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className="font-bold text-slate-900">{STATUS_OPTIONS.find(o => o.value === formData.status)?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Total Amount</span>
                    <span className="font-bold text-blue-600 text-lg">{formData.currency} {parseFloat(formData.total_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Logistics</h3>
                  <button type="button" onClick={() => setCurrentStep(1)} className="text-blue-600 font-bold text-xs uppercase hover:underline underline-offset-4">Edit</button>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-slate-500 font-medium">Shipping Method</span>
                    <span className="font-bold text-slate-900">{SHIPPING_METHODS.find(m => m.value === formData.shipping_method)?.label || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-slate-500 font-medium">Carrier</span>
                    <span className="font-bold text-slate-900">{formData.carrier || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-slate-500 font-medium">Tracking #</span>
                    <span className="font-bold text-slate-900 truncate max-w-[150px]">{formData.tracking_number || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Incoterm</span>
                    <span className="font-bold text-slate-900 uppercase">{formData.incoterm || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Review */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Notes & Custom Fields</h3>
                <button type="button" onClick={() => setCurrentStep(2)} className="text-blue-600 font-bold text-xs uppercase hover:underline underline-offset-4">Edit</button>
              </div>
              <div className="p-8">
                 {formData.notes ? (
                   <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 prose prose-slate prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: formData.notes }} />
                 ) : (
                   <p className="text-slate-400 italic mb-6">No additional notes provided.</p>
                 )}
                 
                 {fieldDefinitions.length > 0 && (
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                     {fieldDefinitions.map(def => (
                       <div key={def.field_key}>
                         <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{def.field_label}</div>
                         <div className="font-bold text-slate-900">
                           {formData.custom_fields[def.field_key] === true ? 'Yes' : 
                            formData.custom_fields[def.field_key] === false ? 'No' : 
                            String(formData.custom_fields[def.field_key] || '—')}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-between gap-4 pt-8 border-t border-slate-100">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSaving}
                className="px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
              >
                Continue to {steps[currentStep + 1].title}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined font-bold">task_alt</span>
                    {isEditing ? 'Update Purchase Order' : 'Finalize & Create Order'}
                  </>
                )}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/purchase-orders')}
            className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
