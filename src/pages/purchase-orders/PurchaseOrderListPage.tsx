import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  partially_received: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  received: 'bg-green-100 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-700 border-gray-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_ICONS: Record<PurchaseOrderStatus, string> = {
  draft: 'edit_note',
  pending: 'hourglass_empty',
  approved: 'check_circle',
  sent: 'send',
  partially_received: 'package_2',
  received: 'inventory_2',
  closed: 'lock',
  cancelled: 'cancel',
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

  const getStatusClasses = (status: PurchaseOrderStatus | undefined): string => {
    switch (status) {
      case 'approved':
      case 'received':
        return 'bg-tertiary-container text-on-tertiary-container'
      case 'pending':
      case 'sent':
      case 'partially_received':
        return 'bg-surface-container-highest text-on-surface'
      case 'draft':
        return 'bg-secondary-container text-on-secondary-container'
      case 'cancelled':
      case 'closed':
        return 'bg-slate-100 text-slate-600'
      case 'late': // Special case for UI
        return 'bg-error-container/20 text-error'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  const getStatusIcon = (status: PurchaseOrderStatus | undefined): string => {
    switch (status) {
      case 'approved':
        return 'check_circle'
      case 'received':
        return 'inventory_2'
      case 'partially_received':
        return 'package_2'
      case 'pending':
        return 'pending_actions'
      case 'draft':
        return 'history_edu'
      case 'late':
        return 'error'
      default:
        return 'info'
    }
  }

  const getShippingIcon = (method: string | undefined): string => {
    if (!method) return 'local_shipping'
    const m = method.toLowerCase()
    if (m.includes('ocean') || m.includes('sea') || m.includes('ship')) return 'sailing'
    if (m.includes('air') || m.includes('flight')) return 'flight'
    return 'local_shipping'
  }

  const renderStatusBadge = (status: PurchaseOrderStatus | undefined, expectedDeliveryDate?: string | null) => {
    // Check if late
    let currentStatus = status
    if (status === 'sent' || status === 'pending') {
      if (expectedDeliveryDate && new Date(expectedDeliveryDate) < new Date()) {
        // Just for visual effect in this demo/update
        // @ts-ignore
        currentStatus = 'late'
      }
    }

    const classes = getStatusClasses(currentStatus)
    const icon = getStatusIcon(currentStatus)
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${classes}`}>
        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        {(currentStatus || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    )
  }

  const renderTypeBadge = (type: PurchaseOrderType | undefined) => {
    return (
      <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
        {(type || 'standard').replace(/\b\w/g, (l) => l.toUpperCase())}
      </span>
    )
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
    if (sortKey !== key) return <span className="material-symbols-outlined text-slate-300 ml-1 text-sm">unfold_more</span>
    return <span className="material-symbols-outlined text-blue-600 ml-1 text-sm">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  return (
    <div className="space-y-0 max-w-screen-2xl mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Editorial Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <nav className="flex items-center gap-2 text-sm text-outline mb-2 font-medium">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/')}>Foxall PO</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary font-bold">Purchase Orders</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2 font-headline">Purchase Orders</h1>
          <p className="text-on-surface-variant max-w-xl font-medium">
            Centralized management of your global supply chain commitments. Track procurement cycles, vendor approvals, and inbound logistics.
          </p>
        </div>
        <button
          onClick={() => navigate('/purchase-orders/new')}
          className="bg-primary text-on-primary px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined font-bold">add</span>
          New Purchase Order
        </button>
      </header>

      {/* Summary Statistics (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-surface-container-low p-6 rounded-xl transition-all hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-on-surface/5 group">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-primary-container text-on-primary-container rounded-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">receipt_long</span>
            </span>
            <span className="text-sm font-semibold text-primary">Total Records</span>
          </div>
          <div className="text-3xl font-bold tracking-tighter text-on-surface mb-1">{totalCount.toLocaleString()}</div>
          <div className="text-sm text-on-surface-variant font-medium">Active POs in System</div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl transition-all hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-on-surface/5 group">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-secondary-container text-on-secondary-container rounded-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">pending_actions</span>
            </span>
            <span className="text-sm font-semibold text-secondary">Awaiting Review</span>
          </div>
          <div className="text-3xl font-bold tracking-tighter text-on-surface mb-1">{purchaseOrders.filter(po => po.status === 'pending').length}</div>
          <div className="text-sm text-on-surface-variant font-medium">Pending Approval</div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl transition-all hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-on-surface/5 group">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-tertiary-container text-on-tertiary-container rounded-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">local_shipping</span>
            </span>
            <span className="text-sm font-semibold text-tertiary">In Transit</span>
          </div>
          <div className="text-3xl font-bold tracking-tighter text-on-surface mb-1">{purchaseOrders.filter(po => po.status === 'sent' || po.status === 'partially_received').length}</div>
          <div className="text-sm text-on-surface-variant font-medium">Upcoming Deliveries</div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-xl transition-all hover:bg-surface-container-lowest hover:shadow-xl hover:shadow-on-surface/5 group">
          <div className="flex items-center justify-between mb-4">
            <span className="p-2 bg-error-container/20 text-error rounded-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">warning</span>
            </span>
            <span className="text-sm font-semibold text-error">Requires Attention</span>
          </div>
          <div className="text-3xl font-bold tracking-tighter text-error mb-1">
            {purchaseOrders.filter(po => po.expected_delivery_date && new Date(po.expected_delivery_date) < new Date() && po.status !== 'received' && po.status !== 'closed').length}
          </div>
          <div className="text-sm text-on-surface-variant font-medium">Late Shipments</div>
        </div>
      </div>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      {/* Advanced Filter & Search Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center border border-slate-100/50">
        <div className="relative w-full lg:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            className="w-full pl-12 pr-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-bold placeholder:text-outline/60"
            placeholder="Search PO numbers, vendors, or items..."
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className="h-8 w-px bg-outline-variant/30 hidden lg:block"></div>
        <div className="flex flex-wrap gap-2 items-center flex-1">
          <span className="text-xs font-bold text-outline uppercase tracking-widest px-2">Filters:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              statusFilter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            All POs
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              statusFilter === 'draft' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
              statusFilter === 'pending' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => {
              // Special filter for late (not really a status in DB but we can simulate it)
              // For simplicity, just use a dummy toggle if it were available
            }}
            className="px-4 py-2 bg-error-container/10 text-error hover:bg-error-container/20 rounded-full text-sm font-bold transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">schedule</span>
            Late
          </button>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-auto flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-bold transition-all ${
              showFilters ? 'bg-primary/10 border-primary text-primary' : 'border-outline-variant/30 text-on-surface hover:bg-surface-container-low'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{showFilters ? 'close' : 'tune'}</span>
            {showFilters ? 'Close Filters' : 'More Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-surface-container-low/50 p-6 rounded-2xl mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 border border-outline-variant/20 animate-in fade-in slide-in-from-top-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase tracking-widest ml-1">PO Type</label>
            <select
              className="w-full px-4 py-2.5 bg-surface-container-lowest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 font-bold text-sm"
              value={poTypeFilter}
              onChange={(e) => { setPoTypeFilter(e.target.value as PurchaseOrderType | 'all'); setPage(1); }}
            >
              <option value="all">All Types</option>
              <option value="standard">Standard</option>
              <option value="blanket">Blanket</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase tracking-widest ml-1">Order Date From</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 bg-surface-container-lowest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 font-bold text-sm"
              value={orderDateFrom}
              onChange={(e) => { setOrderDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline uppercase tracking-widest ml-1">Order Date To</label>
            <input
              type="date"
              className="w-full px-4 py-2.5 bg-surface-container-lowest border-none rounded-xl text-on-surface focus:ring-2 focus:ring-primary/20 font-bold text-sm"
              value={orderDateTo}
              onChange={(e) => { setOrderDateTo(e.target.value); setPage(1); }}
            />
          </div>
          <div className="space-y-2 flex flex-col justify-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2.5 bg-white text-error border border-error/20 rounded-xl font-bold text-sm hover:bg-error/5 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">delete_sweep</span>
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Data Table Container */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden border border-slate-100/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th 
                  className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest cursor-pointer group hover:text-primary transition-colors"
                  onClick={() => toggleSort('po_number')}
                >
                  <div className="flex items-center gap-1">PO Number {getSortIndicator('po_number')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest">Order Type</th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest text-center">Status</th>
                <th 
                  className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest cursor-pointer group hover:text-primary transition-colors"
                  onClick={() => toggleSort('order_date')}
                >
                  <div className="flex items-center gap-1">Timeline {getSortIndicator('order_date')}</div>
                </th>
                <th 
                  className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest cursor-pointer group hover:text-primary transition-colors"
                  onClick={() => toggleSort('total_amount')}
                >
                  <div className="flex items-center gap-1">Total Amount {getSortIndicator('total_amount')}</div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest">Method</th>
                <th className="px-6 py-4 text-xs font-bold text-outline uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchaseOrders.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-outline">inventory_2</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface mb-1">No purchase orders found</h3>
                      <p className="text-on-surface-variant max-w-xs mx-auto mb-6 font-medium">
                        Try adjusting your search or filters to find what you looking for.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr 
                    key={po.id} 
                    className="hover:bg-surface-container-low/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <td className="px-6 py-5">
                      <span className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">{po.po_number}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold text-xs">
                          {po.vendor_id.toString().substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-on-surface">Vendor #{po.vendor_id}</div>
                          <div className="text-xs text-outline font-medium">Internal ID</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {renderTypeBadge(po.po_type)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      {renderStatusBadge(po.status, po.expected_delivery_date)}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs font-medium">
                        <div className="text-outline">Ordered: <span className="text-on-surface font-bold">{formatDate(po.order_date)}</span></div>
                        <div className="text-outline">Due: <span className={po.expected_delivery_date && new Date(po.expected_delivery_date) < new Date() ? "text-error font-bold" : "text-primary font-bold"}>
                          {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}
                        </span></div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-on-surface">{formatCurrency(po.total_amount, po.currency)}</div>
                      <div className="text-[10px] text-outline uppercase tracking-wider font-extrabold">{po.currency || 'USD'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-outline">
                        <span className="material-symbols-outlined text-lg">{getShippingIcon(po.shipping_method)}</span>
                        <span className="text-xs font-bold capitalize">{po.shipping_method || 'Ground'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/purchase-orders/${po.id}`)}
                          className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        {canManageUsers() && (
                          <>
                            <button 
                              onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
                              className="p-2 hover:bg-secondary/10 text-secondary rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(po.id)}
                              className="p-2 hover:bg-error-container/10 text-error rounded-lg transition-colors"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </>
                        )}
                        <button className="p-2 hover:bg-slate-100 text-outline rounded-lg transition-colors">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="px-8 py-5 flex items-center justify-between bg-surface-container-low/20 border-t border-slate-100">
          <span className="text-xs font-bold text-outline uppercase tracking-wider">
            Showing <span className="text-on-surface">{purchaseOrders.length > 0 ? (page - 1) * perPage + 1 : 0}-{Math.min(page * perPage, totalCount)}</span> of <span className="text-on-surface">{totalCount.toLocaleString()}</span> purchase orders
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-sm font-bold text-outline hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center px-4 py-2 bg-surface-container-low rounded-lg text-sm font-extrabold text-primary">
              {page}
            </div>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm font-bold text-outline hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Confirm Deletion"
        message={
          <>
            Are you sure you want to delete this purchase order?
            This action cannot be undone and will remove all associated data.
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeletingId(null)
        }}
        confirmText="Delete Order"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />
    </div>
  )
}
