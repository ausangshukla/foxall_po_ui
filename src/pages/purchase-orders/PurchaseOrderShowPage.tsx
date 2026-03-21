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
        const definitions = await getCustomFieldDefinitions('purchase_orders', (data as any).po_type)
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Breadcrumb / Back */}
      <button 
        onClick={() => navigate('/purchase-orders')}
        className="group inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold"
      >
        <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
        Back to Fleet List
      </button>

      {/* Hero Header Card */}
      <div className={`relative overflow-hidden rounded-[2.5rem] shadow-2xl transition-all duration-500 ${
        isCancelled ? 'bg-slate-900' : isDelivered ? 'bg-emerald-900' : 'bg-blue-900'
      }`}>
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-10 -mb-10 blur-3xl"></div>
        </div>

        <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <span className="material-symbols-outlined text-4xl">inventory</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold text-white tracking-tighter font-headline">
                  {purchaseOrder.po_number}
                </h1>
                <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border backdrop-blur-sm ${
                  isCancelled ? 'bg-red-500/20 text-red-100 border-red-400/30' : 
                  isDelivered ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' : 
                  'bg-blue-500/20 text-blue-100 border-blue-400/30'
                }`}>
                  {purchaseOrder.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-blue-100/70 font-medium">Order ID: {purchaseOrder.id} • Registered on {formatDate(purchaseOrder.order_date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {canManageUsers() && (
               <button 
                onClick={() => navigate(`/purchase-orders/${purchaseOrder.id}/edit`)}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
               >
                 <span className="material-symbols-outlined">edit</span>
                 Modify Order
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Main Grid Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Core Info */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Detailed Info Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
               <span className="material-symbols-outlined text-blue-600">info</span>
               <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Essential Details</h3>
             </div>
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <span className="material-symbols-outlined">apartment</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Entity / Subsidiary</p>
                    <p className="font-bold text-slate-900">Entity #{purchaseOrder.entity_id}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined">store</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Vendor Reference</p>
                    <p className="font-bold text-slate-900">Partner #{purchaseOrder.vendor_id}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <span className="material-symbols-outlined">payments</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Financial Total</p>
                    <p className="font-bold text-slate-900 text-xl">{formatCurrency(purchaseOrder.total_amount, purchaseOrder.currency)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100/50">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <span className="material-symbols-outlined">category</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Contract Type</p>
                    <p className="font-bold text-slate-900 uppercase tracking-tight">{purchaseOrder.po_type}</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Logistics Card */}
          {(purchaseOrder.shipping_method || purchaseOrder.carrier || purchaseOrder.tracking_number) && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
                <span className="material-symbols-outlined text-blue-600">local_shipping</span>
                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Logistics & Freight</h3>
              </div>
              <div className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {purchaseOrder.shipping_method && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Method</p>
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <span className="material-symbols-outlined text-blue-500">{SHIPPING_ICONS[purchaseOrder.shipping_method] || 'package'}</span>
                          <span className="capitalize">{purchaseOrder.shipping_method}</span>
                        </div>
                      </div>
                    )}
                    {purchaseOrder.carrier && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carrier</p>
                        <p className="font-bold text-slate-900">{purchaseOrder.carrier}</p>
                      </div>
                    )}
                    {purchaseOrder.tracking_number && (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking #</p>
                        <p className="font-bold text-blue-600 select-all font-mono">{purchaseOrder.tracking_number}</p>
                      </div>
                    )}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                    <div className="space-y-3">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm">location_on</span>
                         Destination
                       </p>
                       <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         {purchaseOrder.destination_address || 'No destination address provided.'}
                       </p>
                    </div>
                    <div className="space-y-3">
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <span className="material-symbols-outlined text-sm">receipt_long</span>
                         Billing Address
                       </p>
                       <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                         {purchaseOrder.bill_to_address || 'No billing address provided.'}
                       </p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Notes Card */}
          {purchaseOrder.notes && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
                 <span className="material-symbols-outlined text-blue-600">notes</span>
                 <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Documentation & Notes</h3>
               </div>
               <div className="p-8 prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: purchaseOrder.notes }} />
            </div>
          )}
        </div>

        {/* Right Column - Status & Metadata */}
        <div className="space-y-8">
           
           {/* Timeline / Dates Card */}
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
              <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-4">Delivery Timeline</h3>
              
              <div className="relative pl-8 space-y-8">
                 {/* Timeline Line */}
                 <div className="absolute top-0 left-[11px] bottom-0 w-0.5 bg-slate-100"></div>

                 <div className="relative">
                    <div className="absolute -left-8 w-6 h-6 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center z-10">
                       <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ordered On</p>
                    <p className="font-bold text-slate-900">{formatDate(purchaseOrder.order_date)}</p>
                 </div>

                 <div className="relative">
                    <div className="absolute -left-8 w-6 h-6 rounded-full bg-amber-100 border-4 border-white flex items-center justify-center z-10">
                       <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Expected By</p>
                    <p className="font-bold text-slate-900">{formatDate(purchaseOrder.expected_delivery_date)}</p>
                 </div>

                 <div className="relative">
                    <div className={`absolute -left-8 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center z-10 ${isDelivered ? 'bg-green-100' : 'bg-slate-50'}`}>
                       <div className={`w-2 h-2 rounded-full ${isDelivered ? 'bg-green-600' : 'bg-slate-300'}`}></div>
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Actual Delivery</p>
                    <p className={`font-bold ${isDelivered ? 'text-green-600' : 'text-slate-400 italic'}`}>
                      {purchaseOrder.actual_delivery_date ? formatDate(purchaseOrder.actual_delivery_date) : 'Pending Arrival'}
                    </p>
                 </div>
              </div>
           </div>

           {/* Custom Attributes */}
           {fieldDefinitions.length > 0 && (
             <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6">Extended Attributes</h3>
                <div className="space-y-4">
                  {fieldDefinitions.map((def) => (
                    <div key={def.field_key} className="flex flex-col border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{def.field_label}</span>
                      <span className="font-bold text-slate-800">
                        {def.field_type === 'checkbox'
                          ? (purchaseOrder.custom_fields?.[def.field_key] ? '✅ Enabled' : '❌ Disabled')
                          : String(purchaseOrder.custom_fields?.[def.field_key] || '—')}
                      </span>
                    </div>
                  ))}
                </div>
             </div>
           )}

           {/* Audit Log Card */}
           <div className="bg-slate-900 rounded-3xl shadow-xl p-8 text-white">
              <h3 className="font-bold text-white/40 uppercase tracking-widest text-xs mb-6">System Audit Log</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                     <span className="material-symbols-outlined text-[20px]">person_add</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Creator Account</p>
                      <p className="text-sm font-bold">Operator ID: {purchaseOrder.created_by}</p>
                   </div>
                </div>
                {purchaseOrder.approved_by && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <span className="material-symbols-outlined text-[20px]">verified_user</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Approver</p>
                        <p className="text-sm font-bold">Manager ID: {purchaseOrder.approved_by}</p>
                    </div>
                  </div>
                )}
                <div className="pt-6 border-t border-white/10 space-y-4">
                   <div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">System Timestamp</p>
                      <p className="text-xs font-medium text-white/60">Modified: {formatDateTime(purchaseOrder.updated_at)}</p>
                      <p className="text-xs font-medium text-white/60">Registry: {formatDateTime(purchaseOrder.created_at)}</p>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
