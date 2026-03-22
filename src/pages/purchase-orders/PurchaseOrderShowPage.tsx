import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getPurchaseOrder } from '../../api/purchase-orders'
import { getCustomFieldDefinitions } from '../../api/custom-fields'
import type { PurchaseOrderResponse, PurchaseOrderType, CustomFieldDefinition } from '../../types/api'
import { API_BASE_URL } from '../../config'

function fixDocUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  // If it's a relative URL, prepend the API base
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`
  }
  
  // If it's an absolute URL, replace the protocol and host (including port) with the ones from API_BASE_URL
  try {
    const docUrl = new URL(url)
    const apiBaseUrl = new URL(API_BASE_URL)
    
    docUrl.protocol = apiBaseUrl.protocol
    docUrl.host = apiBaseUrl.host
    
    return docUrl.toString()
  } catch (e) {
    // Fallback to simple replacement if URL parsing fails
    return url.replace(/https?:\/\/[^/]+/, API_BASE_URL)
  }
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
        const definitions = await getCustomFieldDefinitions('PurchaseOrder', data.po_type as PurchaseOrderType)
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
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Vendor/Supplier</p>
                <p className="font-bold text-on-surface">{purchaseOrder.vendor_name || `Partner #${purchaseOrder.vendor_id}`}</p>
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

          {/* Supplier & Contact Info */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">store</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Supplier Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Contact Name</p>
                <p className="font-bold text-on-surface">{purchaseOrder.supplier_contact_name || '—'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Email</p>
                <p className="font-bold text-on-surface">{purchaseOrder.supplier_email || '—'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Phone</p>
                <p className="font-bold text-on-surface">{purchaseOrder.supplier_phone || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Address & Country</p>
                <p className="font-bold text-on-surface">{purchaseOrder.supplier_address || '—'}{purchaseOrder.supplier_country ? `, ${purchaseOrder.supplier_country}` : ''}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Origin Port</p>
                <p className="font-bold text-on-surface uppercase">{purchaseOrder.origin_city_port || '—'}</p>
              </div>
            </div>
          </section>

          {/* Cargo Details */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Cargo Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="md:col-span-2">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Description</p>
                <p className="font-bold text-on-surface">{purchaseOrder.cargo_description || '—'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">HS Code</p>
                <p className="font-bold text-on-surface">{purchaseOrder.hs_code || '—'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Category</p>
                <p className="font-bold text-on-surface">{purchaseOrder.product_category || '—'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Quantity</p>
                <p className="font-bold text-on-surface">{purchaseOrder.quantity} {purchaseOrder.unit_of_measure}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Total CBM</p>
                <p className="font-bold text-on-surface">{purchaseOrder.total_cbm} m³</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Gross Weight</p>
                <p className="font-bold text-on-surface">{purchaseOrder.total_gross_weight} kg</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Net Weight</p>
                <p className="font-bold text-on-surface">{purchaseOrder.total_net_weight} kg</p>
              </div>
            </div>
            
            {(purchaseOrder.is_dangerous_goods || purchaseOrder.is_temperature_controlled) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-error-container/10 rounded-xl border border-error-container/20">
                {purchaseOrder.is_dangerous_goods && (
                  <div>
                    <p className="text-error text-[10px] uppercase tracking-widest mb-1 font-bold">Dangerous Goods</p>
                    <p className="font-bold text-on-surface">{purchaseOrder.dg_class_un_number || 'Classified'}</p>
                  </div>
                )}
                {purchaseOrder.is_temperature_controlled && (
                  <div>
                    <p className="text-primary text-[10px] uppercase tracking-widest mb-1 font-bold">Temperature Controlled</p>
                    <p className="font-bold text-on-surface">{purchaseOrder.temperature_range || 'Active'}</p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Logistics & Freight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Logistics</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Incoterm</p>
                    <p className="font-bold text-on-surface uppercase">{purchaseOrder.incoterm || '—'}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Freight Mode</p>
                    <p className="font-bold text-on-surface capitalize">{purchaseOrder.shipping_method || '—'}</p>
                  </div>
                </div>
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
                <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Billing & Payments</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Payment Terms</p>
                  <p className="font-bold text-on-surface">{purchaseOrder.payment_terms || '—'}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Billing Address</p>
                  <p className="font-light text-on-surface leading-relaxed">{purchaseOrder.bill_to_address || 'No billing address provided.'}</p>
                </div>
              </div>
            </section>
          </div>

          {/* Documents Section */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">cloud_download</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Associated Documents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'PO Document', url: fixDocUrl(purchaseOrder.po_document_url) },
                { label: 'Spec Sheet', url: fixDocUrl(purchaseOrder.product_spec_sheet_url) },
                { label: 'MSDS', url: fixDocUrl(purchaseOrder.msds_url) },
                { label: 'Sample Approval', url: fixDocUrl(purchaseOrder.pre_production_sample_url) },
              ].map((doc, idx) => (
                <div key={idx} className={`p-4 rounded-xl flex flex-col gap-3 ${doc.url ? 'bg-primary-container/20 border border-primary-container/30' : 'bg-surface-container-low opacity-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">{doc.url ? 'check_circle' : 'cancel'}</span>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{doc.label}</p>
                  </div>
                  {doc.url ? (
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      View Document
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  ) : (
                    <p className="text-xs font-bold text-on-surface-variant/50">Not attached</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Extended Attributes & Documentation */}

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
            <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-8">Procurement Timeline</h2>
            <div className="relative space-y-10 pl-6 border-l-2 border-primary-container">
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-surface"></div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Ordered On</p>
                <p className="font-bold text-on-surface">{formatDate(purchaseOrder.order_date)}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary-container border-4 border-surface"></div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Est. Ready Date</p>
                <p className="font-bold text-on-surface">{formatDate(purchaseOrder.estimated_ready_date)}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary-container border-4 border-surface"></div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Target Ship Date</p>
                <p className="font-bold text-on-surface">{formatDate(purchaseOrder.target_ship_date)}</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary-container border-4 border-surface"></div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Required Delivery</p>
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
