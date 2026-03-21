import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Row, Col, Card, Badge, Button } from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getPurchaseOrder } from '../../api/purchase-orders'
import { getCustomFieldDefinitions } from '../../api/custom-fields'
import type { PurchaseOrderResponse, PurchaseOrderStatus, CustomFieldDefinition } from '../../types/api'

const STATUS_ICONS: Record<PurchaseOrderStatus, string> = {
  draft: '📝',
  pending: '⏳',
  approved: '✅',
  sent: '📤',
  partially_received: '📦',
  received: '📥',
  closed: '🔒',
  cancelled: '❌',
}

const SHIPPING_METHOD_ICONS: Record<string, string> = {
  air: '✈️',
  sea: '🚢',
  ground: '🚛',
  express: '🚀',
}

export function PurchaseOrderShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()

  const poId = id ? parseInt(id, 10) : null

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrderResponse | null>(null)
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth || !poId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [data, definitions] = await Promise.all([
          getPurchaseOrder(poId),
          getPurchaseOrder(poId).then(po => getCustomFieldDefinitions('purchase_order', (po as any).po_type)),
        ])
        setPurchaseOrder(data)
        setFieldDefinitions(definitions)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load purchase order'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth, poId])

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isAuth || isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div>
        <AlertMessage variant="danger" message={error} />
        <Button variant="outline-secondary" onClick={() => navigate('/purchase-orders')}>
          &larr; Back to Purchase Orders
        </Button>
      </div>
    )
  }

  if (!purchaseOrder) {
    return (
      <div>
        <AlertMessage variant="warning" message="Purchase order not found" />
        <Button variant="outline-secondary" onClick={() => navigate('/purchase-orders')}>
          &larr; Back to Purchase Orders
        </Button>
      </div>
    )
  }

  const detailItemStyle: React.CSSProperties = {
    background: 'var(--bs-tertiary-bg)',
  }

  const iconCircleStyle = (bg: string): React.CSSProperties => ({
    width: '40px',
    height: '40px',
    background: bg,
    fontSize: '1.1rem',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const isDelivered = purchaseOrder.status === 'received' || purchaseOrder.status === 'closed'
  const isCancelled = purchaseOrder.status === 'cancelled'

  return (
    <div>
      {/* Back navigation */}
      <div className="mb-3">
        <Button
          variant="link"
          className="text-decoration-none p-0 d-inline-flex align-items-center gap-1"
          onClick={() => navigate('/purchase-orders')}
        >
          <span style={{ fontSize: '1.25rem' }}>&larr;</span>
          <span className="text-muted">Back to Purchase Orders</span>
        </Button>
      </div>

      {/* ===== Header Card ===== */}
      <Card className="border-0 shadow-sm mb-4" style={{ overflow: 'hidden' }}>
        <div
          className="d-flex align-items-center justify-content-between flex-wrap gap-3"
          style={{
            background: isCancelled
              ? 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
              : isDelivered
              ? 'linear-gradient(135deg, var(--bs-success) 0%, #198754 100%)'
              : 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-secondary) 100%)',
            padding: '1.75rem 1.75rem',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', fontSize: '1.75rem' }}
            >
              📋
            </div>
            <div className="text-white">
              <h2 className="mb-1 fw-semibold" style={{ fontSize: '1.5rem' }}>
                {purchaseOrder.po_number}
              </h2>
              <Badge
                bg="rgba(255,255,255,0.2)"
                className="border border-white border-opacity-40 text-white"
                style={{ fontSize: '0.75rem' }}
              >
                {STATUS_ICONS[purchaseOrder.status]}{' '}
                {purchaseOrder.status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Badge>
            </div>
          </div>

          <div className="d-flex gap-2">
            {canManageUsers() && (
              <Button
                variant="light"
                size="sm"
                className="d-flex align-items-center gap-1 fw-semibold"
                onClick={() => navigate(`/purchase-orders/${purchaseOrder.id}/edit`)}
              >
                <span>✏️</span> Edit
              </Button>
            )}
          </div>
        </div>

        {/* PO Details Grid */}
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-primary-bg-subtle)')}>
                  🏢
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Entity ID</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {purchaseOrder.entity_id}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-info-bg-subtle)')}>
                  🏷️
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>PO Type</div>
                  <div className="fw-semibold mt-1 text-capitalize" style={{ color: 'var(--bs-heading-color)' }}>
                    {purchaseOrder.po_type}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-info-bg-subtle)')}>
                  🏪
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Vendor ID</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {purchaseOrder.vendor_id}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-success-bg-subtle)')}>
                  💰
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Total Amount</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {formatCurrency(purchaseOrder.total_amount, purchaseOrder.currency)}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-warning-bg-subtle)')}>
                  📅
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Order Date</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {formatDate(purchaseOrder.order_date)}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-danger-bg-subtle)')}>
                  🚚
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Expected Delivery</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {formatDate(purchaseOrder.expected_delivery_date)}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-secondary-bg-subtle)')}>
                  #
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>PO ID</div>
                  <div className="mt-1">
                    <code style={{ background: 'var(--bs-tertiary-bg)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {purchaseOrder.id}
                    </code>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== Shipping & Logistics Card ===== */}
      {(purchaseOrder.shipping_method || purchaseOrder.carrier || purchaseOrder.tracking_number || purchaseOrder.destination_address) && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="d-flex align-items-center gap-2 border-bottom" style={{ background: 'transparent', padding: '1rem 1.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚛</span>
            <h5 className="mb-0 fw-semibold">Shipping & Logistics</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Row className="g-3">
              {purchaseOrder.shipping_method && (
                <Col md={6} lg={3}>
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-info-bg-subtle)')}>
                      {SHIPPING_METHOD_ICONS[purchaseOrder.shipping_method] || '📦'}
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>Shipping Method</div>
                      <div className="fw-semibold mt-1 text-capitalize" style={{ color: 'var(--bs-heading-color)' }}>
                        {purchaseOrder.shipping_method}
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {purchaseOrder.carrier && (
                <Col md={6} lg={3}>
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-primary-bg-subtle)')}>
                      🏢
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>Carrier</div>
                      <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                        {purchaseOrder.carrier}
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {purchaseOrder.tracking_number && (
                <Col md={6} lg={3}>
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-success-bg-subtle)')}>
                      🔍
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>Tracking Number</div>
                      <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                        <code>{purchaseOrder.tracking_number}</code>
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {purchaseOrder.shipping_terms && (
                <Col md={6} lg={3}>
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-warning-bg-subtle)')}>
                      📋
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>Shipping Terms</div>
                      <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                        {purchaseOrder.shipping_terms}
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {purchaseOrder.incoterm && (
                <Col md={6} lg={3}>
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-secondary-bg-subtle)')}>
                      📄
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>Incoterm</div>
                      <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                        {purchaseOrder.incoterm}
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {purchaseOrder.destination_address && (
                <Col md={12} lg={6}>
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-danger-bg-subtle)')}>
                      📍
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>Destination Address</div>
                      <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                        {purchaseOrder.destination_address}
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {purchaseOrder.bill_to_address && (
                <Col md={12} lg={6}>
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-primary-bg-subtle)')}>
                      🧾
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>Bill To Address</div>
                      <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                        {purchaseOrder.bill_to_address}
                      </div>
                    </div>
                  </div>
                </Col>
              )}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* ===== Custom Fields Card ===== */}
      {purchaseOrder.custom_fields && Object.keys(purchaseOrder.custom_fields).length > 0 && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="d-flex align-items-center gap-2 border-bottom" style={{ background: 'transparent', padding: '1rem 1.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>✨</span>
            <h5 className="mb-0 fw-semibold">Custom Information</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Row className="g-3">
              {fieldDefinitions.map((def) => (
                <Col md={6} lg={4} key={def.field_key}>
                  <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-tertiary-bg)')}>
                      {def.field_type === 'checkbox' ? '☑️' : '📝'}
                    </div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>{def.field_label}</div>
                      <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                        {def.field_type === 'checkbox'
                          ? purchaseOrder.custom_fields![def.field_key]
                            ? 'Yes'
                            : 'No'
                          : String(purchaseOrder.custom_fields![def.field_key] || '-')}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* ===== Notes Card ===== */}
      {purchaseOrder.notes && (
        <Card className="border-0 shadow-sm mb-4">
          <Card.Header className="d-flex align-items-center gap-2 border-bottom" style={{ background: 'transparent', padding: '1rem 1.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>📝</span>
            <h5 className="mb-0 fw-semibold">Notes</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <div dangerouslySetInnerHTML={{ __html: purchaseOrder.notes }} />
          </Card.Body>
        </Card>
      )}

      {/* ===== Audit Information Card ===== */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="d-flex align-items-center gap-2 border-bottom" style={{ background: 'transparent', padding: '1rem 1.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>📊</span>
          <h5 className="mb-0 fw-semibold">Audit Information</h5>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={6} lg={3}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-success-bg-subtle)')}>
                  👤
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Created By</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    User ID: {purchaseOrder.created_by}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={3}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-primary-bg-subtle)')}>
                  ✅
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Approved By</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {purchaseOrder.approved_by ? `User ID: ${purchaseOrder.approved_by}` : 'Not approved yet'}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={3}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-info-bg-subtle)')}>
                  📅
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Created At</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {formatDateTime(purchaseOrder.created_at)}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={3}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-warning-bg-subtle)')}>
                  🔄
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Updated At</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {formatDateTime(purchaseOrder.updated_at)}
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  )
}