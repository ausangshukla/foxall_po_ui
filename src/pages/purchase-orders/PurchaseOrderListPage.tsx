import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { AlertMessage, ConfirmationModal } from '../../components/common'
import {
  searchPurchaseOrders,
  deletePurchaseOrder,
} from '../../api/purchase-orders'
import type {
  PurchaseOrderResponse,
  PurchaseOrderStatus,
  PurchaseOrderType,
  PurchaseOrderSearchCondition,
  ShippingMethod,
} from '../../types/api'

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

const ALL_SHIPPING_METHODS: ShippingMethod[] = [
  'air',
  'sea',
  'ground',
  'express',
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
        po_type: poTypeFilter !== 'all' ? poTypeFilter : undefined,
        order_date_from: orderDateFrom || undefined,
        order_date_to: orderDateTo || undefined,
        conditions: conditions.length > 0 ? conditions : undefined,
        sort_by: sortKey,
        sort_dir: sortDir,
      })

      setPurchaseOrders(response.data || [])
      setTotalPages(response.meta?.total_pages || 1)
      setTotalCount(response.meta?.total_count || 0)
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

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
      } else {
        setSortKey(key)
        setSortDir('asc')
      }
      setPage(1)
    }

    const handleFilterClick = (e: React.MouseEvent, type: 'status' | 'po_type' | 'method' | 'carrier', value: string) => {
      e.stopPropagation()
      setPage(1)
      switch (type) {
        case 'status':
          setStatusFilter(value as PurchaseOrderStatus)
          break
        case 'po_type':
          setPoTypeFilter(value as PurchaseOrderType)
          break
        case 'method':
          setShippingMethod(value.toLowerCase())
          break
        case 'carrier':
          setCarrier(value)
          break
      }
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

    const idToDelete = deletingId

    try {
      setIsLoading(true)
      await deletePurchaseOrder(idToDelete)
      setPurchaseOrders((prev) => prev.filter((po) => po.id !== idToDelete))
      setShowDeleteConfirm(false)
      setDeletingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete purchase order'
      setError(message)
    } finally {
      setIsLoading(false)
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

  const getStatusClasses = (status: PurchaseOrderStatus | 'late' | undefined): string => {
    switch (status) {
      case 'approved':
      case 'received':
        return 'bg-primary-container text-on-primary-container'
      case 'pending':
        return 'bg-tertiary-container text-on-tertiary-container'
      case 'sent':
      case 'partially_received':
        return 'bg-secondary-container text-on-secondary-container'
      case 'draft':
        return 'bg-surface-container-highest text-on-surface-variant'
      case 'cancelled':
      case 'closed':
        return 'bg-slate-100 text-slate-600'
      case 'late': // Special case for UI (Delayed)
        return 'bg-error-container/20 text-error'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  const getStatusIcon = (status: PurchaseOrderStatus | 'late' | undefined): string => {
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
      let currentStatus: PurchaseOrderStatus | 'late' | undefined = status
      if (status === 'sent' || status === 'pending') {
        if (expectedDeliveryDate && new Date(expectedDeliveryDate) < new Date()) {
          // Just for visual effect in this demo/update
          currentStatus = 'late'
        }
      }

      const classes = getStatusClasses(currentStatus)
      const icon = getStatusIcon(currentStatus)
      return (
        <span 
          onClick={(e) => status && handleFilterClick(e, 'status', status)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all ${classes}`}
        >
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          {(currentStatus || 'unknown').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      )
    }

  const hasAdvancedFilters =
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
      <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">Purchase Orders</h1>
          <p className="text-on-surface-variant font-light tracking-wide">Manage and curate your global procurement workflow.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-medium hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined">file_download</span>
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/purchase-orders/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Create Order</span>
          </button>
        </div>
      </section>

      {/* Summary Metrics: Glass Bento */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-primary-container/30 text-primary rounded-xl material-symbols-outlined">shopping_cart</span>
            <span className="text-emerald-600 font-bold text-xs bg-primary-container/20 px-2 py-1 rounded">+12%</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Active Orders</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">{totalCount.toLocaleString()}</h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-tertiary-container/30 text-tertiary rounded-xl material-symbols-outlined">pending_actions</span>
            <span className="text-on-surface-variant text-xs font-light">Last 7 days</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Pending Approval</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {(purchaseOrders || []).filter(po => po.status === 'pending').length}
            </h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-secondary-container/30 text-secondary rounded-xl material-symbols-outlined">payments</span>
            <span className="text-emerald-600 font-bold text-xs bg-primary-container/20 px-2 py-1 rounded">+5.4%</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Total Spend</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {formatCurrency((purchaseOrders || []).reduce((sum, po) => sum + Number(po.total_amount), 0), 'USD')}
            </h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-error-container/30 text-error rounded-xl material-symbols-outlined">emergency</span>
            <span className="text-error font-bold text-xs bg-error-container/20 px-2 py-1 rounded">Urgent</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Delayed Items</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {(purchaseOrders || []).filter(po => po.expected_delivery_date && new Date(po.expected_delivery_date) < new Date() && po.status !== 'received' && po.status !== 'closed').length.toString().padStart(2, '0')}
            </h3>
          </div>
        </div>
      </section>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      {/* Filters & Data Table Container */}
      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 bg-surface-container-low flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input
                className="pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full lg:w-64 font-light text-sm"
                placeholder="Search orders..."
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">filter_list</span>
              <select
                className="pl-12 pr-10 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full font-light text-sm appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as PurchaseOrderStatus | 'all'); setPage(1); }}
              >
                <option value="all">All Statuses</option>
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showFilters ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest ring-1 ring-outline-variant/20 text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{showFilters ? 'close' : 'tune'}</span>
              Advanced
              {hasAdvancedFilters && !showFilters && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-surface-container-low"></span>
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant font-light">
            <span>Showing {(purchaseOrders || []).length > 0 ? (page - 1) * perPage + 1 : 0}-{Math.min(page * perPage, totalCount)} of {totalCount.toLocaleString()} results</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 hover:bg-surface-container rounded-lg transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 hover:bg-surface-container rounded-lg transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 bg-surface-container-low/30 border-t border-outline-variant/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-outline uppercase tracking-widest ml-1">Status</label>
              <select
                className="w-full px-4 py-2 bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-lg text-on-surface focus:ring-primary-container font-medium text-sm capitalize"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as PurchaseOrderStatus | 'all'); setPage(1); }}
              >
                <option value="all">All Statuses</option>
                {ALL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-outline uppercase tracking-widest ml-1">PO Type</label>
              <select
                className="w-full px-4 py-2 bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-lg text-on-surface focus:ring-primary-container font-medium text-sm capitalize"
                value={poTypeFilter}
                onChange={(e) => { setPoTypeFilter(e.target.value as PurchaseOrderType | 'all'); setPage(1); }}
              >
                <option value="all">All Types</option>
                <option value="standard">Standard</option>
                <option value="blanket">Blanket</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-outline uppercase tracking-widest ml-1">Shipping Method</label>
              <select
                className="w-full px-4 py-2 bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-lg text-on-surface focus:ring-primary-container font-medium text-sm capitalize"
                value={shippingMethod}
                onChange={(e) => { setShippingMethod(e.target.value); setPage(1); }}
              >
                <option value="">Any Method</option>
                {ALL_SHIPPING_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-outline uppercase tracking-widest ml-1">Carrier</label>
              <input
                type="text"
                placeholder="e.g. FedEx"
                className="w-full px-4 py-2 bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-lg text-on-surface focus:ring-primary-container font-medium text-sm"
                value={carrier}
                onChange={(e) => { setCarrier(e.target.value); setPage(1); }}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-outline uppercase tracking-widest ml-1">Order Date From</label>
              <input
                type="date"
                className="w-full px-4 py-2 bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-lg text-on-surface focus:ring-primary-container font-medium text-sm"
                value={orderDateFrom}
                onChange={(e) => { setOrderDateFrom(e.target.value); setPage(1); }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-4 py-2 bg-surface-container-lowest text-error ring-1 ring-error/20 rounded-lg font-bold text-sm hover:bg-error/5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">delete_sweep</span>
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Modern Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => handleSort('po_number')}
                >
                  <div className="flex items-center gap-1">Order ID {getSortIndicator('po_number')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => handleSort('vendor_id')}
                >
                  <div className="flex items-center gap-1">Vendor {getSortIndicator('vendor_id')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => handleSort('po_type')}
                >
                  <div className="flex items-center gap-1">Type {getSortIndicator('po_type')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-center cursor-pointer group"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">Status {getSortIndicator('status')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group text-center"
                  onClick={() => handleSort('order_date')}
                >
                  <div className="flex items-center justify-center gap-1">Timeline {getSortIndicator('order_date')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group text-right"
                  onClick={() => handleSort('total_amount')}
                >
                  <div className="flex items-center justify-end gap-1">Total {getSortIndicator('total_amount')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-center cursor-pointer group"
                  onClick={() => handleSort('shipping_method')}
                >
                  <div className="flex items-center justify-center gap-1">Method {getSortIndicator('shipping_method')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-center cursor-pointer group"
                  onClick={() => handleSort('carrier')}
                >
                  <div className="flex items-center justify-center gap-1">Carrier {getSortIndicator('carrier')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {(!purchaseOrders || purchaseOrders.length === 0) && !isLoading ? (
                <tr>
                  <td colSpan={9} className="px-8 py-20 text-center">
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
                (purchaseOrders || []).map((po) => (
                  <tr 
                    key={po.id} 
                    className="hover:bg-surface-container-low transition-all duration-200 group cursor-pointer"
                    onClick={() => navigate(`/purchase-orders/${po.id}`)}
                  >
                    <td className="px-8 py-6 font-bold text-on-primary-container">
                      {po.po_number}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant">
                          {po.vendor_id ? po.vendor_id.toString().substring(0, 2).toUpperCase() : '??'}
                        </div>
                        <span className="font-medium text-sm">Vendor #{po.vendor_id || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span 
                        onClick={(e) => po.po_type && handleFilterClick(e, 'po_type', po.po_type)}
                        className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                      >
                        {po.po_type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center">
                        {renderStatusBadge(po.status, po.expected_delivery_date)}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center text-xs">
                        <span className="font-light text-on-surface-variant">{formatDate(po.order_date)}</span>
                        {po.expected_delivery_date && (
                          <span className={`font-bold ${new Date(po.expected_delivery_date) < new Date() ? 'text-error' : 'text-primary'}`}>
                            Due: {formatDate(po.expected_delivery_date)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-on-primary-container">
                      {formatCurrency(po.total_amount, po.currency)}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div 
                        onClick={(e) => handleFilterClick(e, 'method', po.shipping_method || 'ground')}
                        className="flex items-center justify-center gap-2 text-on-surface-variant hover:text-primary transition-all cursor-pointer group/method"
                      >
                        <span className="material-symbols-outlined text-lg group-hover/method:scale-110 transition-transform">{getShippingIcon(po.shipping_method || undefined)}</span>
                        <span className="text-xs font-medium capitalize">{po.shipping_method || '—'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span 
                        onClick={(e) => po.carrier && handleFilterClick(e, 'carrier', po.carrier)}
                        className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                      >
                        {po.carrier || '—'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => navigate(`/purchase-orders/${po.id}`)}
                          className="p-2 opacity-40 group-hover:opacity-100 hover:text-primary transition-all"
                        >
                          <span className="material-symbols-outlined text-xl">visibility</span>
                        </button>
                        {canManageUsers() && (
                          <>
                            <button 
                              onClick={() => navigate(`/purchase-orders/${po.id}/edit`)}
                              className="p-2 opacity-40 group-hover:opacity-100 hover:text-secondary transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(po.id)}
                              className="p-2 opacity-40 group-hover:opacity-100 hover:text-error transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer of Table */}
        <div className="p-8 border-t border-outline-variant/10 flex justify-center">
          <button className="text-sm font-bold text-primary hover:text-on-primary-container flex items-center gap-2 transition-colors">
            View Complete Transaction History
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>

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
