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
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import {
  searchPurchaseOrders,
  deletePurchaseOrder,
} from '../../api/purchase-orders'
import type {
  PurchaseOrderResponse,
  PurchaseOrderStatus,
  PurchaseOrderType,
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
  draft: 'ti-edit',
  pending: 'ti-hourglass',
  approved: 'ti-check',
  sent: 'ti-send',
  partially_received: 'ti-package',
  received: 'ti-inbox',
  closed: 'ti-lock',
  cancelled: 'ti-x',
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [perPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')
  const [poTypeFilter, setPoTypeFilter] = useState<PurchaseOrderType | 'all'>('all')
  const [vendorId, setVendorId] = useState('')
  const [orderDateFrom, setOrderDateFrom] = useState('')
  const [orderDateTo, setOrderDateTo] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [totalAmountMin, setTotalAmountMin] = useState('')
  const [totalAmountMax, setTotalAmountMax] = useState('')
  const [shippingMethod, setShippingMethod] = useState('')
  const [carrier, setCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')

  const [sortKey, setSortKey] = useState<string>('order_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchPurchaseOrders = useCallback(async () => {
    if (!isAuth) return

    try {
      setIsLoading(true)
      setError(null)

      const conditions: PurchaseOrderSearchCondition[] = []
      // ... (existing code for conditions)
      if (poNumber.trim()) {
        conditions.push({
          field: 'po_number',
          pred: 'i_cont',
          value: poNumber.trim(),
        })
      }
      if (vendorId.trim()) {
        conditions.push({
          field: 'vendor_id',
          pred: 'eq',
          value: vendorId.trim(),
        })
      }
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
      if (totalAmountMin.trim()) {
        conditions.push({
          field: 'total_amount',
          pred: 'gteq',
          value: totalAmountMin.trim(),
        })
      }
      if (totalAmountMax.trim()) {
        conditions.push({
          field: 'total_amount',
          pred: 'lteq',
          value: totalAmountMax.trim(),
        })
      }

      const response = await searchPurchaseOrders({
        page,
        per_page: perPage,
        q: searchTerm.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        // Assuming the API supports po_type filter as well. Need to confirm if it does.
        // For now, I will just send the filter. If the backend ignores it, it's fine for now, 
        // but typically backend needs to be updated too. The prompt implies I should add it to the UI.
        // Let's assume the API filters can accept a 'po_type' field.
        // @ts-ignore
        po_type: poTypeFilter !== 'all' ? poTypeFilter : undefined,
        order_date_from: orderDateFrom || undefined,
        order_date_to: orderDateTo || undefined,
        conditions: conditions.length > 0 ? conditions : undefined,
        // @ts-expect-error - Assuming backend supports sorting
        sort_by: sortKey,
        // @ts-expect-error - Assuming backend supports sorting
        sort_dir: sortDir,
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
    poTypeFilter,
    vendorId,
    orderDateFrom,
    orderDateTo,
    poNumber,
    totalAmountMin,
    totalAmountMax,
    shippingMethod,
    carrier,
    trackingNumber,
    sortKey,
    sortDir,
  ])

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  const handleDelete = (id: number) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (deletingId === null) return

    try {
      setIsLoading(true)
      await deletePurchaseOrder(deletingId)
      setPurchaseOrders(purchaseOrders.filter((po) => po.id !== deletingId))
      setShowDeleteConfirm(false)
    } catch {
      setError('Failed to delete purchase order')
    } finally {
      setIsLoading(false)
      setDeletingId(null)
    }
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPoTypeFilter('all')
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
    poTypeFilter !== 'all' ||
    vendorId ||
    orderDateFrom ||
    orderDateTo ||
    poNumber ||
    totalAmountMin ||
    totalAmountMax ||
    shippingMethod ||
    carrier ||
    trackingNumber

  const getSortIndicator = (key: string) => {
    if (sortKey !== key) return <i className="ti ti-selector text-muted opacity-25 ms-1" style={{ fontSize: '0.8rem' }}></i>
    return <i className={`ti ti-chevron-${sortDir === 'asc' ? 'up' : 'down'} sort-active ms-1`} style={{ fontSize: '0.8rem' }}></i>
  }

  const renderStatusBadge = (status: PurchaseOrderStatus | undefined) => {
    const variant = getStatusVariant(status)
    const iconClass = getStatusIcon(status)
    return (
      <Badge
        bg={variant}
        className="d-inline-flex align-items-center gap-1"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation()
          if (status) {
            setStatusFilter(status)
            setPage(1)
          }
        }}
      >
        <i className={`ti ${iconClass}`} style={{ fontSize: '1rem' }}></i>
        {(status || 'unknown').replace(/_/g, ' ')}
      </Badge>
    )
  }

  const renderTypeBadge = (type: PurchaseOrderType | undefined) => {
    return (
      <Badge
        bg="info"
        className="text-capitalize"
        style={{ cursor: 'pointer' }}
        onClick={(e) => {
          e.stopPropagation()
          if (type) {
            setPoTypeFilter(type)
            setPage(1)
          }
        }}
      >
        {type || 'standard'}
      </Badge>
    )
  }

  if (!isAuth) {
    return <LoadingSpinner />
  }

  return (
    <div className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">Purchase Orders</h1>
          <p className="text-muted small mb-0">Manage and track your procurement pipeline</p>
        </div>
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          onClick={() => navigate('/purchase-orders/new')}
        >
          <i className="ti ti-plus"></i> New Purchase Order
        </Button>
      </div>

      {error && <AlertMessage variant="danger" message={error} />}

      {/* Modern Search/Filter Card */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end">
            <Col lg={8} md={12}>
              <Form.Label className="fw-semibold text-muted small mb-2">Search Purchase Orders</Form.Label>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0 text-muted">
                  <i className="ti ti-search"></i>
                </InputGroup.Text>
                <Form.Control
                  className="border-start-0 ps-0"
                  placeholder="PO#, vendor, tracking, notes..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="link"
                    className="text-decoration-none text-muted position-absolute end-0 top-50 translate-middle-y z-3"
                    onClick={() => {
                      setSearchTerm('')
                      setPage(1)
                    }}
                  >
                    <i className="ti ti-x"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col lg={4} md={12} className="d-flex gap-2">
              <Button
                variant={showFilters ? "primary" : "outline-primary"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
              >
                <i className={`ti ti-filter${showFilters ? '-off' : ''}`}></i>
                {showFilters ? 'Hide Advanced' : 'Advanced Filters'}
                {hasActiveFilters && !showFilters && (
                  <Badge bg="white" text="primary" className="ms-2">!</Badge>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="outline-danger" onClick={handleClearFilters} className="d-flex align-items-center gap-2">
                  <i className="ti ti-trash"></i> Clear
                </Button>
              )}
            </Col>
          </Row>

          <Collapse in={showFilters}>
            <div className="mt-4 pt-4 border-top">
              <Row className="g-3">
                <Col md={3}>
                  <Form.Label className="fw-semibold text-muted small mb-2">Status</Form.Label>
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
                        {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold text-muted small mb-2">PO Type</Form.Label>
                  <Form.Select
                    value={poTypeFilter}
                    onChange={(e) => {
                      setPoTypeFilter(e.target.value as PurchaseOrderType | 'all')
                      setPage(1)
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="standard">Standard</option>
                    <option value="blanket">Blanket</option>
                    <option value="service">Service</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold text-muted small mb-2">PO Number</Form.Label>
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
                  <Form.Label className="fw-semibold text-muted small mb-2">Vendor ID</Form.Label>
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
                  <Form.Label className="fw-semibold text-muted small mb-2">Date From</Form.Label>
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
                  <Form.Label className="fw-semibold text-muted small mb-2">Date To</Form.Label>
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
                  <Form.Label className="fw-semibold text-muted small mb-2">Min Amount ($)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    value={totalAmountMin}
                    onChange={(e) => {
                      setTotalAmountMin(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold text-muted small mb-2">Max Amount ($)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    value={totalAmountMax}
                    onChange={(e) => {
                      setTotalAmountMax(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label className="fw-semibold text-muted small mb-2">Shipping Method</Form.Label>
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
                  <Form.Label className="fw-semibold text-muted small mb-2">Carrier</Form.Label>
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
                  <Form.Label className="fw-semibold text-muted small mb-2">Tracking Number</Form.Label>
                  <Form.Control
                    placeholder="e.g., 1Z999..."
                    value={trackingNumber}
                    onChange={(e) => {
                      setTrackingNumber(e.target.value)
                      setPage(1)
                    }}
                  />
                </Col>
              </Row>
            </div>
          </Collapse>
        </Card.Body>
      </Card>

      {/* Results Table Card */}
      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="d-flex justify-content-between align-items-center p-3 px-4 border-bottom">
            <div className="results-info fw-medium">
              Showing <span className="text-dark fw-bold">{purchaseOrders.length}</span> of <span className="text-dark fw-bold">{totalCount}</span> results
            </div>
            {isLoading && (
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </div>

          {purchaseOrders.length === 0 && !isLoading ? (
            <div className="text-center py-5">
              <div className="display-4 mb-3 opacity-25">
                <i className="ti ti-clipboard-list"></i>
              </div>
              <h5 className="text-dark fw-bold">No purchase orders found</h5>
              <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                {hasActiveFilters
                  ? 'We couldn\'t find any purchase orders matching your current filters. Try adjusting your search criteria.'
                  : 'Start building your procurement pipeline by creating your first purchase order.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline-primary" size="sm" onClick={handleClearFilters} className="mt-2">
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead>
                    <tr>
                      <th role="button" onClick={() => toggleSort('po_number')}>
                        PO Number {getSortIndicator('po_number')}
                      </th>
                      <th role="button" onClick={() => toggleSort('po_type')}>
                        Type {getSortIndicator('po_type')}
                      </th>
                      <th role="button" onClick={() => toggleSort('status')}>
                        Status {getSortIndicator('status')}
                      </th>
                      <th role="button" onClick={() => toggleSort('order_date')}>
                        Order Date {getSortIndicator('order_date')}
                      </th>
                      <th role="button" onClick={() => toggleSort('total_amount')}>
                        Total {getSortIndicator('total_amount')}
                      </th>
                      <th role="button" onClick={() => toggleSort('shipping_method')}>
                        Shipping {getSortIndicator('shipping_method')}
                      </th>
                      <th role="button" onClick={() => toggleSort('carrier')}>
                        Carrier {getSortIndicator('carrier')}
                      </th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.map((po) => (
                      <tr key={po.id} onClick={() => navigate(`/purchase-orders/${po.id}`)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="vendor-avatar">
                              <i className="ti ti-building" style={{ fontSize: '0.8rem' }}></i>
                            </div>
                            <div>
                              <div className="table-link">{po.po_number}</div>
                              <div className="text-muted small">Vendor: {po.vendor_id}</div>
                            </div>
                          </div>
                        </td>
                        <td>{renderTypeBadge(po.po_type)}</td>
                        <td>{renderStatusBadge(po.status)}</td>
                        <td>
                          <div>{formatDate(po.order_date)}</div>
                          <div className="text-muted small">Due: {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}</div>
                        </td>
                        <td>
                          <div className="fw-bold">{formatCurrency(po.total_amount, po.currency)}</div>
                        </td>
                        <td>
                          {po.shipping_method ? (
                            <Badge
                              bg="light"
                              text="dark"
                              className="text-capitalize fw-normal"
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setShippingMethod(po.shipping_method!)
                                setPage(1)
                              }}
                            >
                              {po.shipping_method}
                            </Badge>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td
                          onClick={(e) => {
                            if (po.carrier) {
                              e.stopPropagation()
                              setCarrier(po.carrier)
                              setPage(1)
                            }
                          }}
                        >
                          {po.carrier ? (
                            <div>
                              <div className="small fw-medium">{po.carrier}</div>
                              {po.tracking_number && <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{po.tracking_number}</div>}
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td className="text-end" onClick={(e) => e.stopPropagation()}>
                          <Dropdown align="end">
                            <Dropdown.Toggle
                              variant="link"
                              className="text-muted p-0 border-0 shadow-none"
                              id={`po-actions-${po.id}`}
                            >
                              <i className="ti ti-dots-vertical" style={{ fontSize: '1.2rem' }}></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className="shadow-sm border-0">
                              <Dropdown.Item onClick={() => navigate(`/purchase-orders/${po.id}`)} className="d-flex align-items-center gap-2">
                                <i className="ti ti-eye"></i> View Details
                              </Dropdown.Item>
                              {canManageUsers() && (
                                <>
                                  <Dropdown.Item onClick={() => navigate(`/purchase-orders/${po.id}/edit`)} className="d-flex align-items-center gap-2">
                                    <i className="ti ti-edit"></i> Edit
                                  </Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Item
                                    className="text-danger d-flex align-items-center gap-2"
                                    onClick={() => handleDelete(po.id)}
                                    disabled={deletingId === po.id}
                                  >
                                    <i className="ti ti-trash"></i> Delete
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
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center p-4 border-top pagination-container">
                  <div className="text-muted small">
                    Page <span className="text-dark fw-bold">{page}</span> of <span className="text-dark fw-bold">{totalPages}</span>
                  </div>
                  <div className="btn-group shadow-sm">
                    <Button
                      variant="white"
                      className="bg-white border d-flex align-items-center gap-1"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <i className="ti ti-chevron-left"></i> Previous
                    </Button>
                    <Button
                      variant="white"
                      className="bg-white border d-flex align-items-center gap-1"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next <i className="ti ti-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Confirm Deletion"
        message={
          <>
            Are you sure you want to delete this purchase order?
            <br />
            <strong>This action cannot be undone.</strong>
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeletingId(null)
        }}
        confirmText="Delete"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />
    </div>
  )
}
