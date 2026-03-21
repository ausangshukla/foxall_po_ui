import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Button,
  Badge,
  Card,
  Row,
  Col,
  Form,
  InputGroup,
  Dropdown,
  Collapse,
} from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import {
  searchPurchaseOrders,
  deletePurchaseOrder,
} from '../../api/purchase-orders'
import type {
  PurchaseOrderResponse,
  PurchaseOrderStatus,
  PurchaseOrderSearchCondition,
} from '../../types/api'

const STATUS_VARIANTS: Record<PurchaseOrderStatus, string> = {
  draft: 'secondary',
  pending: 'info',
  approved: 'success',
  sent: 'primary',
  partially_received: 'warning',
  received: 'success',
  closed: 'dark',
  cancelled: 'danger',
}

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

const ALL_STATUSES: PurchaseOrderStatus[] = [
  'draft',
  'pending',
  'approved',
  'sent',
  'partially_received',
  'received',
  'closed',
  'cancelled',
]

export function PurchaseOrderListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')
  const [vendorId, setVendorId] = useState('')
  const [orderDateFrom, setOrderDateFrom] = useState('')
  const [orderDateTo, setOrderDateTo] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [totalAmountMin, setTotalAmountMin] = useState('')
  const [totalAmountMax, setTotalAmountMax] = useState('')
  const [shippingMethod, setShippingMethod] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  const fetchPurchaseOrders = useCallback(async () => {
    if (!isAuth) return

    try {
      setIsLoading(true)
      setError(null)

      const conditions: PurchaseOrderSearchCondition[] = []

      // Add PO Number filter if provided
      if (poNumber.trim()) {
        conditions.push({
          field: 'po_number',
          pred: 'i_cont',
          value: poNumber.trim(),
        })
      }

      // Add Vendor ID filter if provided
      if (vendorId.trim()) {
        conditions.push({
          field: 'vendor_id',
          pred: 'eq',
          value: vendorId.trim(),
        })
      }

      // Add Shipping filters
      if (shippingMethod.trim()) {
        conditions.push({
          field: 'shipping_method',
          pred: 'eq',
          value: shippingMethod.trim(),
        })
      }
      if (carrier.trim()) {
        conditions.push({
          field: 'carrier',
          pred: 'i_cont',
          value: carrier.trim(),
        })
      }
      if (trackingNumber.trim()) {
        conditions.push({
          field: 'tracking_number',
          pred: 'i_cont',
          value: trackingNumber.trim(),
        })
      }
      console.log("DEBUG: Conditions:", conditions)

      const response = await searchPurchaseOrders({
        page,
        per_page: perPage,
        q: searchTerm.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        order_date_from: orderDateFrom || undefined,
        order_date_to: orderDateTo || undefined,
        conditions: conditions.length > 0 ? conditions : undefined,
      })

      setPurchaseOrders(response.data)
      setTotalPages(response.meta.total_pages)
      setTotalCount(response.meta.total_count)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load purchase orders'
      console.error('Failed to load purchase orders:', err)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [
    isAuth,
    page,
    perPage,
    searchTerm,
    statusFilter,
    vendorId,
    orderDateFrom,
    orderDateTo,
    poNumber,
    totalAmountMin,
    totalAmountMax,
    shippingMethod,
    carrier,
    trackingNumber,
  ])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) {
      return
    }

    setDeletingId(id)
    try {
      await deletePurchaseOrder(id)
      setPurchaseOrders(purchaseOrders.filter((po) => po.id !== id))
    } catch {
      setError('Failed to delete purchase order')
    } finally {
      setDeletingId(null)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setVendorId('')
    setOrderDateFrom('')
    setOrderDateTo('')
    setPoNumber('')
    setTotalAmountMin('')
    setTotalAmountMax('')
    setShippingMethod('')
    setCarrier('')
    setTrackingNumber('')
    setPage(1)
  }

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusVariant = (status: PurchaseOrderStatus | undefined): string => {
    if (!status || !STATUS_VARIANTS[status]) {
      return 'secondary'
    }
    return STATUS_VARIANTS[status]
  }

  const getStatusIcon = (status: PurchaseOrderStatus | undefined): string => {
    if (!status || !STATUS_ICONS[status]) {
      return '⚪'
    }
    return STATUS_ICONS[status]
  }

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== 'all' ||
    vendorId ||
    orderDateFrom ||
    orderDateTo ||
    poNumber ||
    totalAmountMin ||
    totalAmountMax ||
    shippingMethod ||
    carrier ||
    trackingNumber

  if (!isAuth) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Purchase Orders</h1>
        </Col>
        <Col xs="auto">
          <Button
            variant="primary"
            onClick={() => navigate('/purchase-orders/new')}
          >
            Add Purchase Order
          </Button>
        </Col>
      </Row>

      {error && <AlertMessage variant="danger" message={error} />}

      {/* Search Bar */}
      <Card className="mb-3">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={6}>
              <Form.Label className="text-muted small">Search</Form.Label>
              <InputGroup>
                <Form.Control
                  placeholder="Search PO number, vendor name, tracking number, notes..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setSearchTerm('')
                      setPage(1)
                    }}
                  >
                    ✕
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label className="text-muted small">Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PurchaseOrderStatus | 'all')
                  setPage(1)
                }}
              >
                <option value="all">All Statuses</option>
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getStatusIcon(status)} {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-100"
                >
                  {showFilters ? '▼' : '▶'} Filters
                  {hasActiveFilters && !showFilters && (
                    <Badge bg="primary" className="ms-2">!</Badge>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button variant="outline-danger" onClick={handleClearFilters}>
                    Clear
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <div>
          <Card className="mb-3 bg-light">
            <Card.Body>
              <Row className="g-3">
                <Col md={3}>
                  <Form.Label className="text-muted small">PO Number</Form.Label>
                  <Form.Control
                    placeholder="e.g., PO-2025-001"
                    value={poNumber}
                    onChange={(e) => {
                      setPoNumber(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="text-muted small">Vendor ID</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Vendor ID"
                    value={vendorId}
                    onChange={(e) => {
                      setVendorId(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="text-muted small">Order Date From</Form.Label>
                  <Form.Control
                    type="date"
                    value={orderDateFrom}
                    onChange={(e) => {
                      setOrderDateFrom(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="text-muted small">Order Date To</Form.Label>
                  <Form.Control
                    type="date"
                    value={orderDateTo}
                    onChange={(e) => {
                      setOrderDateTo(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="text-muted small">Total Min ($)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={totalAmountMin}
                    onChange={(e) => {
                      setTotalAmountMin(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="text-muted small">Total Max ($)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={totalAmountMax}
                    onChange={(e) => {
                      setTotalAmountMax(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="text-muted small">Shipping Method</Form.Label>
                  <Form.Select
                    value={shippingMethod}
                    onChange={(e) => {
                      setShippingMethod(e.target.value)
                      setPage(1)
                    }}
                  >
                    <option value="">Any</option>
                    <option value="air">Air</option>
                    <option value="sea">Sea</option>
                    <option value="ground">Ground</option>
                    <option value="express">Express</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="text-muted small">Carrier</Form.Label>
                  <Form.Control
                    placeholder="e.g., FedEx"
                    value={carrier}
                    onChange={(e) => {
                      setCarrier(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="text-muted small">Tracking #</Form.Label>
                  <Form.Control
                    placeholder="e.g., 12345678"
                    value={trackingNumber}
                    onChange={(e) => {
                      setTrackingNumber(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      </Collapse>

      {/* Results Table */}
      <Card>
        <Card.Body>
          {/* Results Info */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="text-muted small">
              Showing {purchaseOrders.length} of {totalCount} results
              {hasActiveFilters && ' (filtered)'}
            </div>
            {isLoading && <span className="text-muted small">Loading...</span>}
          </div>

          {purchaseOrders.length === 0 && !isLoading ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h6 className="text-muted">No purchase orders found</h6>
              <p className="text-muted small">
                {hasActiveFilters
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first purchase order.'}
              </p>
            </div>
          ) : (
            <>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Status</th>
                    <th>Order Date</th>
                    <th>Expected Delivery</th>
                    <th>Total Amount</th>
                    <th>Shipping</th>
                    <th>Tracking</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td>
                        <strong
                          role="button"
                          onClick={() => navigate(`/purchase-orders/${po.id}`)}
                          style={{ cursor: 'pointer', color: '#0d6efd' }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          {po.po_number}
                        </strong>
                        <div className="text-muted small">Vendor: {po.vendor_id}</div>
                      </td>
                      <td>
                        <Badge
                          bg={getStatusVariant(po.status)}
                          className="text-capitalize"
                          role="button"
                          onClick={() => {
                            if (po.status) {
                              setStatusFilter(po.status)
                              setPage(1)
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {getStatusIcon(po.status)} {(po.status || 'unknown').replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>{formatDate(po.order_date)}</td>
                      <td>
                        {po.expected_delivery_date ? (
                          formatDate(po.expected_delivery_date)
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <strong>{formatCurrency(po.total_amount, po.currency)}</strong>
                      </td>
                      <td>
                        {po.shipping_method ? (
                          <Badge bg="light" text="dark" className="fw-medium">
                            {po.carrier || po.shipping_method}
                          </Badge>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>{po.tracking_number || <span className="text-muted">—</span>}</td>
                      <td>
                        <Dropdown>
                          <Dropdown.Toggle
                            variant="outline-secondary"
                            size="sm"
                            id={`po-actions-${po.id}`}
                          >
                            Actions
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item
                              onClick={() => navigate(`/purchase-orders/${po.id}`)}
                            >
                              👁️ View Details
                            </Dropdown.Item>
                            {canManageUsers() && (
                              <>
                                <Dropdown.Item
                                  onClick={() =>
                                    navigate(`/purchase-orders/${po.id}/edit`)
                                  }
                                >
                                  ✏️ Edit
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  className="text-danger"
                                  onClick={() => handleDelete(po.id)}
                                  disabled={deletingId === po.id}
                                >
                                  {deletingId === po.id ? 'Deleting...' : '🗑️ Delete'}
                                </Dropdown.Item>
                              </>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <div className="btn-group">
                    <Button
                      variant="outline-secondary"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button variant="outline-secondary" disabled>
                      Page {page} of {totalPages}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}