import React, { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, Button, Row, Col, Spinner, ProgressBar, Nav, Table, Alert } from 'react-bootstrap'
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
    { title: 'PO Details', fields: ['po_number', 'vendor_id', 'po_type', 'status', 'order_date', 'currency', 'total_amount'] },
    { title: 'Shipping', fields: ['shipping_method', 'shipping_terms', 'carrier', 'tracking_number', 'incoterm', 'destination_address', 'bill_to_address'] },
    { title: 'Additional Info', fields: ['notes', 'custom_fields'] },
    { title: 'Review', fields: [] },
  ]

  useEffect(() => {
    if (!isAuth || !user) return

    const loadData = async () => {
      try {
        let poData: any = null;
        if (isEditing && poId) {
          poData = await getPurchaseOrder(poId);
        }

        // Use 'purchase_orders' instead of 'purchase_order' as per DB sample
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

      // Validate dates
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
      // Validate custom fields
      fieldDefinitions.forEach(def => {
        if (def.is_mandatory) {
          const val = formData.custom_fields[def.field_key];
          if (val === undefined || val === null || val === '') {
            errors[`custom_fields.${def.field_key}`] = `${def.field_label} is required`;
          }
        }
      });
    }

    // Only update state if errors actually changed to prevent infinite re-renders
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

    // Explicitly check that we are on the Review step (step 3)
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
    // Immediately clear both definitions AND custom_fields so old fields vanish from the screen
    setFieldDefinitions([])
    setFormData((prev) => ({ 
      ...prev, 
      po_type: value as PurchaseOrderType, 
      custom_fields: {} 
    }))

    if (!value) {
      return
    }

    try {
      // Use 'purchase_orders' instead of 'purchase_order' as per DB sample
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

  const checkStepValidity = (step: number): boolean => {
    if (step === 0) {
      if (!formData.po_number.trim()) return false
      if (!formData.po_type) return false
      if (!formData.vendor_id.trim()) return false
      if (!formData.order_date) return false
      if (!formData.currency) return false
      if (!formData.total_amount.trim()) return false
      if (isNaN(parseFloat(formData.total_amount)) || parseFloat(formData.total_amount) < 0) return false

      if (formData.expected_delivery_date && formData.order_date) {
        if (new Date(formData.expected_delivery_date) < new Date(formData.order_date)) return false
      }
      if (formData.actual_delivery_date && formData.order_date) {
        if (new Date(formData.actual_delivery_date) < new Date(formData.order_date)) return false
      }
    }
    return true
  }

  return (
    <div>
      <h1 className="mb-4">
        {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
      </h1>

      {error && <AlertMessage variant="danger" message={error} />}

      <Nav fill variant="tabs" activeKey={currentStep.toString()} className="mb-4">
        {steps.map((step, index) => (
          <Nav.Item key={index}>
            <Nav.Link 
              eventKey={index.toString()} 
              disabled={index > currentStep && !checkStepValidity(currentStep)}
              onClick={(e) => {
                e.preventDefault();
                if (index < currentStep) {
                  setCurrentStep(index)
                } else if (index > currentStep) {
                  // Only allow jumping forward if all steps up to index are valid
                  let allValid = true;
                  for (let i = currentStep; i < index; i++) {
                    if (!validateStep(i)) {
                      allValid = false;
                      break;
                    }
                  }
                  if (allValid) setCurrentStep(index);
                }
              }}
              className="fw-bold"
            >
              {index + 1}. {step.title}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <ProgressBar 
        now={((currentStep + 1) / steps.length) * 100} 
        label={`${Math.round(((currentStep + 1) / steps.length) * 100)}%`}
        className="mb-4"
        variant="success"
      />

      <Form onSubmit={handleSubmit}>
        {/* Step 1: Core Information */}
        {currentStep === 0 && (
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">Core Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">PO Number *</Form.Label>
                    <Form.Control
                      type="text"
                      name="po_number"
                      value={formData.po_number}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.po_number}
                      placeholder="e.g. PO-2024-001"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.po_number}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Vendor ID *</Form.Label>
                    <Form.Control
                      type="number"
                      name="vendor_id"
                      value={formData.vendor_id}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.vendor_id}
                      placeholder="e.g. 1"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.vendor_id}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">PO Type *</Form.Label>
                    <Form.Select
                      name="po_type"
                      value={formData.po_type}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.po_type}
                      disabled={isEditing && !!formData.po_type}
                    >
                      <option value="">Select PO Type...</option>
                      <option value="standard">Standard</option>
                      <option value="blanket">Blanket</option>
                      <option value="service">Service</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.po_type}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Status *</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Order Date *</Form.Label>
                    <Form.Control
                      type="date"
                      name="order_date"
                      value={formData.order_date}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.order_date}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.order_date}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Expected Delivery Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="expected_delivery_date"
                      value={formData.expected_delivery_date}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.expected_delivery_date}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.expected_delivery_date}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Actual Delivery Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="actual_delivery_date"
                      value={formData.actual_delivery_date}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.actual_delivery_date}
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.actual_delivery_date}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Currency *</Form.Label>
                    <Form.Select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.currency}
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>
                          {curr}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.currency}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Total Amount *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.total_amount}
                      placeholder="0.00"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.total_amount}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Step 2: Shipping & Logistics */}
        {currentStep === 1 && (
          <Card className="mb-4 shadow-sm border-0">
            <Card.Header className="bg-white py-3 border-bottom">
              <h5 className="mb-0 fw-bold">Shipping & Logistics</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Shipping Method</Form.Label>
                    <Form.Select
                      name="shipping_method"
                      value={formData.shipping_method}
                      onChange={handleChange}
                    >
                      <option value="">Select shipping method...</option>
                      {SHIPPING_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Shipping Terms</Form.Label>
                    <Form.Select
                      name="shipping_terms"
                      value={formData.shipping_terms}
                      onChange={handleChange}
                    >
                      <option value="">Select shipping terms...</option>
                      {SHIPPING_TERMS.map((term) => (
                        <option key={term.value} value={term.value}>
                          {term.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Carrier</Form.Label>
                    <Form.Control
                      type="text"
                      name="carrier"
                      value={formData.carrier}
                      onChange={handleChange}
                      placeholder="e.g. DHL, FedEx, UPS"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Tracking Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="tracking_number"
                      value={formData.tracking_number}
                      onChange={handleChange}
                      placeholder="e.g. 1Z999AA10123456784"
                    />
                  </Form.Group>
                </Col>

                <Col md={6} lg={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Incoterm</Form.Label>
                    <Form.Control
                      type="text"
                      name="incoterm"
                      value={formData.incoterm}
                      onChange={handleChange}
                      placeholder="e.g. FOB, CIF, EXW"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Destination Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="destination_address"
                      value={formData.destination_address}
                      onChange={handleChange}
                      placeholder="Shipping destination address..."
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-muted">Bill To Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="bill_to_address"
                      value={formData.bill_to_address}
                      onChange={handleChange}
                      placeholder="Billing address..."
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}

        {/* Step 3: Notes & Custom Fields */}
        {currentStep === 2 && (
          <>
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-white py-3 border-bottom">
                <h5 className="mb-0 fw-bold">Notes & Additional Information</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-0">
                  <Form.Label className="text-muted mb-2">Notes</Form.Label>
                  <RichTextEditor
                    value={formData.notes}
                    onChange={(value) => setFormData((prev) => ({ ...prev, notes: value }))}
                    placeholder="Additional notes about this purchase order..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {fieldDefinitions.length > 0 && (
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-white py-3 border-bottom">
                  <h5 className="mb-0 fw-bold">Custom Fields</h5>
                </Card.Header>
                <Card.Body>
                  <Row key={formData.po_type || 'none'}>
                    {fieldDefinitions.map((def) => (
                      <Col md={6} lg={4} key={def.field_key}>
                        <Form.Group className="mb-3">
                          <Form.Label className="text-muted">{def.field_label}{def.is_mandatory && ' *'}</Form.Label>
                          {def.field_type === 'checkbox' ? (
                            <Form.Check
                              type="checkbox"
                              name={`custom_fields.${def.field_key}`}
                              checked={!!formData.custom_fields[def.field_key]}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  custom_fields: {
                                    ...prev.custom_fields,
                                    [def.field_key]: e.target.checked,
                                  },
                                }))
                              }
                              label={def.hint || ''}
                              isInvalid={!!validationErrors[`custom_fields.${def.field_key}`]}
                            />
                          ) : def.field_type === 'select' ? (
                            <Form.Select
                              name={`custom_fields.${def.field_key}`}
                              value={formData.custom_fields[def.field_key] || ''}
                              onChange={handleChange}
                              isInvalid={!!validationErrors[`custom_fields.${def.field_key}`]}
                            >
                              <option value="">Select...</option>
                              {def.possible_values
                                ? def.possible_values.split(',').map((val) => val.trim()).map((val) => (
                                  <option key={val} value={val}>
                                    {val}
                                  </option>
                                ))
                                : null}
                            </Form.Select>
                          ) : (
                            <Form.Control
                              type={def.field_type}
                              name={`custom_fields.${def.field_key}`}
                              value={formData.custom_fields[def.field_key] || ''}
                              onChange={handleChange}
                              placeholder={def.hint || ''}
                              isInvalid={!!validationErrors[`custom_fields.${def.field_key}`]}
                            />
                          )}
                          {validationErrors[`custom_fields.${def.field_key}`] && (
                            <Form.Control.Feedback type="invalid">
                              {validationErrors[`custom_fields.${def.field_key}`]}
                            </Form.Control.Feedback>
                          )}
                          {def.hint && def.field_type !== 'checkbox' && (
                            <Form.Text className="text-muted">{def.hint}</Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            )}
          </>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="review-step">
            <h5 className="mb-4 fw-bold">Review Purchase Order</h5>
            
            {/* Core Information Card */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-white py-3 border-bottom">
                <h6 className="mb-0 fw-bold">Core Information</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <tbody>
                    <tr className="border-bottom">
                      <td className="text-muted ps-4 py-3 w-25 border-0">PO Number</td>
                      <td className="fw-semibold py-3 border-0">{formData.po_number}</td>
                      <td className="text-muted ps-4 py-3 w-25 border-0">Vendor ID</td>
                      <td className="fw-semibold py-3 border-0">{formData.vendor_id}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted ps-4 py-3 border-0">PO Type</td>
                      <td className="text-capitalize fw-semibold py-3 border-0">{formData.po_type}</td>
                      <td className="text-muted ps-4 py-3 border-0">Status</td>
                      <td className="fw-semibold py-3 border-0">{STATUS_OPTIONS.find(o => o.value === formData.status)?.label}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted ps-4 py-3 border-0">Order Date</td>
                      <td className="fw-semibold py-3 border-0">{formData.order_date}</td>
                      <td className="text-muted ps-4 py-3 border-0">Currency</td>
                      <td className="fw-semibold py-3 border-0">{formData.currency}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted ps-4 py-3 border-0">Expected Delivery</td>
                      <td className="fw-semibold py-3 border-0">{formData.expected_delivery_date || ""}</td>
                      <td className="text-muted ps-4 py-3 border-0">Actual Delivery</td>
                      <td className="fw-semibold py-3 border-0">{formData.actual_delivery_date || ""}</td>
                    </tr>
                    <tr>
                      <td className="text-muted ps-4 py-3 border-0">Total Amount</td>
                      <td colSpan={3} className="fw-semibold py-3 border-0">
                        {formData.currency} {parseFloat(formData.total_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Shipping Card */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-white py-3 border-bottom">
                <h6 className="mb-0 fw-bold">Shipping & Logistics</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table responsive className="mb-0">
                  <tbody>
                    <tr className="border-bottom">
                      <td className="text-muted ps-4 py-3 w-25 border-0">Shipping Method</td>
                      <td className="fw-semibold py-3 border-0">{SHIPPING_METHODS.find(m => m.value === formData.shipping_method)?.label || ""}</td>
                      <td className="text-muted ps-4 py-3 w-25 border-0">Shipping Terms</td>
                      <td className="fw-semibold py-3 border-0">{SHIPPING_TERMS.find(t => t.value === formData.shipping_terms)?.label || ""}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted ps-4 py-3 border-0">Carrier</td>
                      <td className="fw-semibold py-3 border-0">{formData.carrier || ""}</td>
                      <td className="text-muted ps-4 py-3 border-0">Tracking Number</td>
                      <td className="fw-semibold py-3 border-0">{formData.tracking_number || ""}</td>
                    </tr>
                    <tr className="border-bottom">
                      <td className="text-muted ps-4 py-3 border-0">Incoterm</td>
                      <td colSpan={3} className="fw-semibold py-3 border-0">{formData.incoterm || ""}</td>
                    </tr>
                    <tr>
                      <td className="text-muted ps-4 py-3 border-0">Destination Address</td>
                      <td className="fw-semibold py-3 border-0">{formData.destination_address || ""}</td>
                      <td className="text-muted ps-4 py-3 border-0">Bill To Address</td>
                      <td className="fw-semibold py-3 border-0">{formData.bill_to_address || ""}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {/* Additional Info Card */}
            <Card className="mb-4 shadow-sm border-0">
              <Card.Header className="bg-white py-3 border-bottom">
                <h6 className="mb-0 fw-bold">Additional Information</h6>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-0">
                  <div className="text-muted mb-2">Notes</div>
                  {formData.notes ? (
                    <div className="p-3 border rounded bg-light" dangerouslySetInnerHTML={{ __html: formData.notes }} />
                  ) : (
                    ""
                  )}
                </div>
              </Card.Body>
            </Card>

            {/* Custom Fields Card */}
            {fieldDefinitions.length > 0 && (
              <Card className="mb-4 shadow-sm border-0">
                <Card.Header className="bg-white py-3 border-bottom">
                  <h6 className="mb-0 fw-bold">Custom Fields</h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive className="mb-0">
                    <tbody>
                      {Array.from({ length: Math.ceil(fieldDefinitions.length / 2) }).map((_, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex === Math.ceil(fieldDefinitions.length / 2) - 1 ? '' : 'border-bottom'}>
                          {fieldDefinitions.slice(rowIndex * 2, rowIndex * 2 + 2).map((def) => (
                            <React.Fragment key={def.field_key}>
                              <td className="text-muted ps-4 py-3 w-25 border-0">{def.field_label}</td>
                              <td className="fw-semibold py-3 w-25 border-0">
                                {formData.custom_fields[def.field_key] === true ? (
                                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Yes</span>
                                ) : formData.custom_fields[def.field_key] === false ? (
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">No</span>
                                ) : formData.custom_fields[def.field_key] ? (
                                  String(formData.custom_fields[def.field_key])
                                ) : (
                                  ""
                                )}
                              </td>
                            </React.Fragment>
                          ))}
                          {fieldDefinitions.slice(rowIndex * 2, rowIndex * 2 + 2).length === 1 && (
                            <>
                              <td className="border-0"></td>
                              <td className="border-0"></td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
            
            <Alert variant="info" className="mt-3">
              Please review all information above. Clicking <strong>{isEditing ? 'Update' : 'Create'}</strong> will finalize the purchase order.
            </Alert>
          </div>
        )}

        <div className="d-flex gap-2 mt-4 pt-3 border-top">
          {currentStep > 0 && (
            <Button variant="outline-secondary" type="button" onClick={handlePrevious} disabled={isSaving}>
              Previous
            </Button>
          )}

          {currentStep < 3 ? (
            <Button 
              key="next-button"
              variant="primary" 
              type="button" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
            >
              Next
            </Button>
          ) : (
            <Button 
              key="submit-button"
              variant="primary" 
              type="submit" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Purchase Order'
              ) : (
                'Create Purchase Order'
              )}
            </Button>
          )}

          <Button
            variant="secondary"
            className="ms-auto"
            onClick={() => navigate('/purchase-orders')}
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  )
}
