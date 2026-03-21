import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import {
  createPurchaseOrder,
  updatePurchaseOrder,
  getPurchaseOrder,
} from '../../api/purchase-orders'
import type {
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderStatus,
  ShippingMethod,
  ShippingTerm,
} from '../../types/api'

interface FormData {
  entity_id: string
  po_number: string
  vendor_id: string
  status: PurchaseOrderStatus
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
}

const initialFormData: FormData = {
  entity_id: '',
  po_number: '',
  vendor_id: '',
  status: 'draft',
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
  const { canManageUsers } = useAuth()

  const isEditing = !!id
  const poId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      if (isEditing && poId) {
        try {
          const poData = await getPurchaseOrder(poId)
          setFormData({
            entity_id: poData.entity_id.toString(),
            po_number: poData.po_number,
            vendor_id: poData.vendor_id.toString(),
            status: poData.status,
            order_date: poData.order_date ? poData.order_date.split('T')[0] : '',
            expected_delivery_date: poData.expected_delivery_date
              ? poData.expected_delivery_date.split('T')[0]
              : '',
            actual_delivery_date: poData.actual_delivery_date
              ? poData.actual_delivery_date.split('T')[0]
              : '',
            currency: poData.currency,
            total_amount: poData.total_amount.toString(),
            notes: poData.notes || '',
            shipping_method: poData.shipping_method || '',
            shipping_terms: poData.shipping_terms || '',
            destination_address: poData.destination_address || '',
            bill_to_address: poData.bill_to_address || '',
            incoterm: poData.incoterm || '',
            tracking_number: poData.tracking_number || '',
            carrier: poData.carrier || '',
          })
        } catch {
          setError('Failed to load purchase order')
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, poId])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.entity_id.trim()) errors.entity_id = 'Entity ID is required'
    if (!formData.po_number.trim()) errors.po_number = 'PO Number is required'
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

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsSaving(true)

    try {
      if (isEditing && poId) {
        const updateData: UpdatePurchaseOrderRequest = {
          entity_id: parseInt(formData.entity_id, 10),
          po_number: formData.po_number,
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
        }
        await updatePurchaseOrder(poId, updateData)
      } else {
        const createData: CreatePurchaseOrderRequest = {
          entity_id: parseInt(formData.entity_id, 10),
          po_number: formData.po_number,
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
        }
        await createPurchaseOrder(createData)
      }

      navigate('/purchase-orders')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save purchase order')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div>
      <h1 className="mb-4">
        {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
      </h1>

      {error && <AlertMessage variant="danger" message={error} />}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            {/* Core Information */}
            <h5 className="mb-3 text-primary">Core Information</h5>
            <Row>
              <Col md={6} lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Entity ID *</Form.Label>
                  <Form.Control
                    type="number"
                    name="entity_id"
                    value={formData.entity_id}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.entity_id}
                    placeholder="e.g. 1"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.entity_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6} lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>PO Number *</Form.Label>
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
                  <Form.Label>Vendor ID *</Form.Label>
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
                  <Form.Label>Status *</Form.Label>
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
                  <Form.Label>Order Date *</Form.Label>
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
                  <Form.Label>Expected Delivery Date</Form.Label>
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
                  <Form.Label>Actual Delivery Date</Form.Label>
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
                  <Form.Label>Currency *</Form.Label>
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
                  <Form.Label>Total Amount *</Form.Label>
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

            <Form.Group className="mb-4">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes about this purchase order..."
              />
            </Form.Group>

            <hr className="my-4" />

            {/* Shipping & Logistics */}
            <h5 className="mb-3 text-primary">Shipping & Logistics</h5>
            <Row>
              <Col md={6} lg={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Shipping Method</Form.Label>
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
                  <Form.Label>Shipping Terms</Form.Label>
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
                  <Form.Label>Carrier</Form.Label>
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
                  <Form.Label>Tracking Number</Form.Label>
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
                  <Form.Label>Incoterm</Form.Label>
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
                  <Form.Label>Destination Address</Form.Label>
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
                  <Form.Label>Bill To Address</Form.Label>
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

            <div className="d-flex gap-2 mt-4">
              <Button variant="primary" type="submit" disabled={isSaving}>
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
              <Button
                variant="secondary"
                onClick={() => navigate('/purchase-orders')}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}