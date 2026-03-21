import { useState, useEffect, useMemo } from 'react'
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
} from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import {
  listPurchaseOrders,
  deletePurchaseOrder,
} from '../../api/purchase-orders'
import type { PurchaseOrderResponse, PurchaseOrderStatus } from '../../types/api'

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

export function PurchaseOrderListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuth) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await listPurchaseOrders()
        setPurchaseOrders(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load purchase orders'
        console.error('Failed to load purchase orders:', err)
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth])

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

  // Safe status variant getter with fallback
  const getStatusVariant = (status: PurchaseOrderStatus | undefined): string => {
    if (!status || !STATUS_VARIANTS[status]) {
      return 'secondary'
    }
    return STATUS_VARIANTS[status]
  }

  // Safe status icon getter with fallback
  const getStatusIcon = (status: PurchaseOrderStatus | undefined): string => {
    if (!status || !STATUS_ICONS[status]) {
      return '⚪'
    }
    return STATUS_ICONS[status]
  }

  // Filter purchase orders based on search and status
  const filteredPurchaseOrders = useMemo(() => {
    if (!purchaseOrders || !Array.isArray(purchaseOrders)) {
      return []
    }
    return purchaseOrders.filter((po) => {
      if (!po) return false
      const searchLower = (searchTerm || '').toLowerCase()
      const poNumber = (po.po_number || '').toLowerCase()
      const vendorId = String(po.vendor_id || '')
      const status = (po.status || '').toLowerCase()
      const matchesSearch =
        poNumber.includes(searchLower) ||
        vendorId.includes(searchLower) ||
        status.includes(searchLower)
      const matchesStatus = statusFilter === 'all' || po.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [purchaseOrders, searchTerm, statusFilter])

  const allStatuses: PurchaseOrderStatus[] = [
    'draft',
    'pending',
    'approved',
    'sent',
    'partially_received',
    'received',
    'closed',
    'cancelled',
  ]

  if (!isAuth || isLoading) {
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

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={8}>
              <InputGroup>
                <Form.Control
                  placeholder="Search by PO number, vendor ID, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as PurchaseOrderStatus | 'all')
                }
              >
                <option value="all">All Statuses</option>
                {allStatuses.map((status) => (
                  <option key={status} value={status}>
                    {getStatusIcon(status)} {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {filteredPurchaseOrders.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h6 className="text-muted">No purchase orders found</h6>
              <p className="text-muted small">
                {purchaseOrders.length === 0
                  ? 'Get started by creating your first purchase order.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Expected Delivery</th>
                  <th>Total Amount</th>
                  <th>Shipping</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td>
                      <strong>{po.po_number}</strong>
                      <div className="text-muted small">Vendor: {po.vendor_id}</div>
                    </td>
                    <td>
                      <Badge bg={getStatusVariant(po.status)} className="text-capitalize">
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
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
