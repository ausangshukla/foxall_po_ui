import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getPurchaseOrder } from '../../api/purchase-orders'
import { getCustomFieldDefinitions } from '../../api/custom-fields'
import type { PurchaseOrderResponse, PurchaseOrderStatus, CustomFieldDefinition } from '../../types/api'

const STATUS_CONFIG: Record<PurchaseOrderStatus, { icon: string, color: string, bg: string, border: string, text: string }> = {
  draft: { icon: 'edit_note', color: 'slate', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
  pending: { icon: 'hourglass_empty', color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  approved: { icon: 'check_circle', color: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  sent: { icon: 'send', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  partially_received: { icon: 'package_2', color: 'indigo', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  received: { icon: 'inventory_2', color: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  closed: { icon: 'lock', color: 'gray', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
  cancelled: { icon: 'cancel', color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
}

const SHIPPING_ICONS: Record<string, string> = {
  air: 'flight',
  sea: 'directions_boat',
  ground: 'local_shipping',
  express: 'bolt',
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
        const data = await getPurchaseOrder(poId)
        setPurchaseOrder(data)
        const definitions = await getCustomFieldDefinitions('PurchaseOrder', (data as any).po_type)
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

  if (error || !purchaseOrder) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertMessage variant={error ? "danger" : "warning"} message={error || "Purchase order not found"} />
        <button 
          onClick={() => navigate('/purchase-orders')}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Purchase Orders
        </button>
      </div>
    )
  }

  const status = STATUS_CONFIG[purchaseOrder.status]
  const isCancelled = purchaseOrder.status === 'cancelled'
  const isDelivered = purchaseOrder.status === 'received' || purchaseOrder.status === 'closed'

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section: Editorial Mint Gradient */}
      <header className="relative overflow-hidden rounded-xl mb-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end md:items-center bg-gradient-to-br from-primary-container via-surface to-surface-container-low">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 bg-surface-container-lowest text-primary text-[10px] font-extrabold tracking-widest rounded-full uppercase`}>
              {purchaseOrder.status.replace(/_/g, ' ')}
            </span>
            <span className="text-on-surface-variant font-light tracking-widest text-sm">{purchaseOrder.po_number}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-primary-fixed mb-2">Purchase Order Details</h1>
          <p className="text-on-surface-variant font-light tracking-wide max-w-md">Reviewing logistics and vendor procurement requirements for fiscal Q3 infrastructure.</p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0">
          {canManageUsers() && (
            <button 
              onClick={() => navigate(`/purchase-orders/${purchaseOrder.id}/edit`)}
              className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Modify Order
            </button>
          )}
        </div>
        {/* Decorative Abstract Pattern */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </header>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Column 1: Essential Details & Logistics */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Essential Details Glass Card */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-8">Essential Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Subsidiary</p>
                <p className="font-bold text-on-surface">Entity #{purchaseOrder.entity_id}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Vendor Reference</p>
                <p className="font-bold text-on-surface">Partner #{purchaseOrder.vendor_id}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Financial Total</p>
                <p className="font-bold text-primary text-xl tracking-tight">{formatCurrency(purchaseOrder.total_amount, purchaseOrder.currency)}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Contract Type</p>
                <p className="font-bold text-on-surface uppercase">{purchaseOrder.po_type}</p>
              </div>
            </div>
          </section>

          {/* Logistics & Freight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Logistics</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Tracking #</p>
                  <p className="font-bold text-on-surface">{purchaseOrder.tracking_number || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Destination</p>
                  <p className="font-light text-on-surface leading-relaxed">{purchaseOrder.destination_address || 'No destination address provided.'}</p>
                </div>
              </div>
            </section>
            
            <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Billing</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Billing Address</p>
                  <p className="font-light text-on-surface leading-relaxed">{purchaseOrder.bill_to_address || 'No billing address provided.'}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Extended Attributes & Documentation */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Extended Attributes & Notes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                {fieldDefinitions.length > 0 && (
                  <div className="space-y-4">
                    {fieldDefinitions.map((def) => (
                      <div key={def.field_key}>
                        <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">{def.field_label}</p>
                        <p className="font-bold text-on-surface">
                          {def.field_type === 'checkbox'
                            ? (purchaseOrder.custom_fields?.[def.field_key] ? 'YES' : 'NO')
                            : String(purchaseOrder.custom_fields?.[def.field_key] || '—')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Documentation & Notes</p>
                <div 
                  className="mt-2 p-4 bg-surface-container-low rounded-lg min-h-[100px] font-light text-sm text-on-surface-variant italic"
                  dangerouslySetInnerHTML={{ __html: purchaseOrder.notes || 'No documentation or notes provided.' }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Column 2: Timeline & Audit */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Delivery Timeline */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-8">Delivery Timeline</h2>
            <div className="relative space-y-10 pl-6 border-l-2 border-primary-container">
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface"></div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Ordered On</p>
                <p className="font-bold text-on-surface">{formatDate(purchaseOrder.order_date)}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary-container border-4 border-surface"></div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Expected By</p>
                <p className="font-bold text-on-surface">{formatDate(purchaseOrder.expected_delivery_date)}</p>
              </div>
              <div className={`relative ${!purchaseOrder.actual_delivery_date ? 'opacity-40' : ''}`}>
                <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full ${purchaseOrder.actual_delivery_date ? 'bg-primary' : 'bg-surface-variant'} border-4 border-surface`}></div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Actual Delivery</p>
                <p className="font-bold text-on-surface">{purchaseOrder.actual_delivery_date ? formatDate(purchaseOrder.actual_delivery_date) : 'TBD'}</p>
              </div>
            </div>
          </section>

          {/* System Audit Log */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">history</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Audit Log</h2>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-surface-container-low/50 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Created By</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">{purchaseOrder.created_by}</div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Operator ID: {purchaseOrder.created_by}</p>
                    <p className="text-[10px] text-on-surface-variant">{formatDateTime(purchaseOrder.created_at)}</p>
                  </div>
                </div>
              </div>
              {purchaseOrder.approved_by && (
                <div className="p-4 bg-surface-container-low/50 rounded-lg">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Approved By</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">{purchaseOrder.approved_by}</div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">Approver ID: {purchaseOrder.approved_by}</p>
                      <p className="text-[10px] text-on-surface-variant">System Verified</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4 bg-surface-container-low/50 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Last Modified</p>
                <p className="text-sm font-bold text-on-surface">System Auto-Save</p>
                <p className="text-[10px] text-on-surface-variant">{formatDateTime(purchaseOrder.updated_at)}</p>
              </div>
            </div>
          </section>

          {/* Help Link */}
          <a className="group flex items-center justify-between p-6 glass-panel ambient-shadow rounded-xl border border-outline-variant/20 hover:bg-primary/5 transition-colors" href="#">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">help_center</span>
              <span className="font-bold text-sm">Need Help with this PO?</span>
            </div>
            <span className="material-symbols-outlined text-primary-container group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  )
}
