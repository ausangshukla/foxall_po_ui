import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { 
  getPurchaseOrder, 
  getPurchaseOrderAvailableActions, 
  transitionPurchaseOrder
} from '../../api/purchase-orders'
import poTransitionAttemptApi from '../../api/po-transition-attempts'
import { getCustomFieldDefinitions } from '../../api/custom-fields'
import type { 
  PurchaseOrderResponse, 
  PurchaseOrderType, 
  CustomFieldDefinition,
  PurchaseOrderAvailableAction,
  PoTransitionAttemptResponse
} from '../../types/api'
import { API_BASE_URL } from '../../config'

import { PurchaseOrderLineItems } from '../../components/purchase-orders/PurchaseOrderLineItems'
import { PoTransitionAttempts } from '../../components/purchase-orders/PoTransitionAttempts'
import { TransitionActionsPanel } from '../../components/purchase-orders/TransitionActionsPanel'
import { FreightBookingBanner } from '../../components/freight/FreightBookingBanner'
import { FreightBookingCard } from '../../components/freight/FreightBookingCard'
import { ShipmentTrackingSection } from '../../components/freight/ShipmentTrackingSection'

function fixDocUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  // If it's a relative URL, prepend the API base
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`
  }
  
  // If it's an absolute URL, check if it points to localhost/3000 but we are on a different base
  // and fix it. ActiveStorage often generates URLs based on the request host.
  try {
    const docUrl = new URL(url)
    const apiBaseUrl = new URL(API_BASE_URL)
    
    // Always force the protocol and host to match our configured API_BASE_URL
    docUrl.protocol = apiBaseUrl.protocol
    docUrl.host = apiBaseUrl.host
    
    return docUrl.toString()
  } catch {
    return url
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
  const [availableActions, setAvailableActions] = useState<PurchaseOrderAvailableAction[]>([])
  const [transitionAttempts, setTransitionAttempts] = useState<PoTransitionAttemptResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State machine transition state
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isTransitioningRef = useRef(false)
  const [transitionError, setTransitionError] = useState<string | null>(null)
  const [transitionSuccess, setTransitionSuccess] = useState<string | null>(null)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PurchaseOrderAvailableAction | null>(null)
  const [transitionComment, setTransitionComment] = useState('')
  const [activeTab, setActiveTab] = useState<'line-items' | 'documents' | 'transitions'>('line-items')
  // Incrementing this causes TransitionActionsPanel to reload after a transition fires
  const [actionsRefreshKey, setActionsRefreshKey] = useState(0)

  const fetchStateData = async (id: number) => {
    try {
      console.log(`[PO State Debug] Fetching state data for PO #${id}`)
      const [actionsRes, attemptsRes] = await Promise.allSettled([
        getPurchaseOrderAvailableActions(id),
        poTransitionAttemptApi.getByPurchaseOrder(id)
      ])
      
      if (actionsRes.status === 'fulfilled') {
        console.log(`[PO State Debug] Actions:`, actionsRes.value?.available_actions)
        setAvailableActions(actionsRes.value?.available_actions || [])
      } else {
        // Fallback to what we already have if any
        console.error('[PO State Debug] Failed to load available actions', actionsRes.reason)
        // If we already have actions from the PO data, don't clear them
      }

      if (attemptsRes.status === 'fulfilled') {
        console.log(`[PO State Debug] Attempts:`, attemptsRes.value?.data)
        setTransitionAttempts(attemptsRes.value?.data || [])
      } else {
        console.error('[PO State Debug] Failed to load transition attempts', attemptsRes.reason)
        setTransitionAttempts([])
      }
    } catch (err) {
      console.error('[PO State Debug] Unexpected error loading state data', err)
    }
  }

  useEffect(() => {
    if (!isAuth || !poId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await getPurchaseOrder(poId)
        setPurchaseOrder(data)
        
        // If data includes transition history, use it as initial state
        if (data.history) {
          console.log(`[PO State Debug] Found history in PO data:`, data.history)
          setTransitionAttempts(data.history)
        }

        // If data includes available actions, use them immediately
        if (data.available_actions) {
          console.log(`[PO State Debug] Found actions in PO data:`, data.available_actions)
          setAvailableActions(data.available_actions)
        }

        const definitions = await getCustomFieldDefinitions('PurchaseOrder', data.po_type as PurchaseOrderType)
        setFieldDefinitions(definitions)
        await fetchStateData(poId)
      } catch (err) {
        // Re-throw AuthError so the auth system handles redirect to login
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        const message = err instanceof Error ? err.message : 'Failed to load purchase order'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth, poId])

  const handleActionClick = (action: PurchaseOrderAvailableAction) => {
    if (action.requires_comment) {
      setPendingAction(action)
      setTransitionComment('')
      setCommentModalOpen(true)
    } else {
      executeTransition(action)
    }
  }

  const executeTransition = async (action: PurchaseOrderAvailableAction, comment?: string) => {
    if (!poId || !purchaseOrder) return
    if (isTransitioningRef.current) return

    isTransitioningRef.current = true
    setIsTransitioning(true)
    setTransitionError(null)
    setTransitionSuccess(null)

    try {
      const res = await transitionPurchaseOrder(poId, {
        transition: {
          po_state_id: action.to_state_id,
          comment: comment || undefined
        }
      })
      
      const updatedPo = await getPurchaseOrder(poId)
      setPurchaseOrder(updatedPo)
      setTransitionSuccess(`Successfully transitioned to ${updatedPo.po_state_name || res.purchase_order.po_state?.name || action.action_name}`)
      await fetchStateData(poId)
      // Reload the post-transition actions panel so it reflects the new transition
      setActionsRefreshKey(k => k + 1)
      
      if (commentModalOpen) {
        setCommentModalOpen(false)
        setPendingAction(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute action'
      setTransitionError(message)
    } finally {
      isTransitioningRef.current = false
      setIsTransitioning(false)
    }
  }

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
              {purchaseOrder.po_state_name || purchaseOrder.status.replace(/_/g, ' ')}
            </span>
            <span className="text-on-surface-variant font-light tracking-widest text-sm">{purchaseOrder.po_number}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-primary-fixed mb-2">PO #{purchaseOrder.po_number}</h1>
          <p className="text-on-surface-variant font-light tracking-wide max-w-md">
            {purchaseOrder.po_state_description || 'Reviewing logistics and vendor procurement requirements for fiscal Q3 infrastructure.'}
          </p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex gap-4 flex-wrap justify-end">
          {availableActions.map((action) => (
            <button
              key={action.action_key}
              onClick={() => handleActionClick(action)}
              disabled={isTransitioning}
              className={`px-6 py-2.5 font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 ${
                action.action_key.includes('reject') || action.action_key.includes('cancel')
                  ? 'bg-error text-on-error'
                  : 'bg-primary text-on-primary'
              } disabled:opacity-50`}
            >
              {action.action_name}
            </button>
          ))}
          {canManageUsers() && (
            <button 
              onClick={() => navigate(`/purchase-orders/${purchaseOrder.id}/edit`)}
              className="px-6 py-2.5 bg-surface-variant text-on-surface-variant font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit
            </button>
          )}
        </div>
        {/* Decorative Abstract Pattern */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </header>

      {(transitionSuccess || transitionError) && (
        <div className="mb-6">
          <AlertMessage 
            variant={transitionSuccess ? 'success' : 'danger'} 
            message={(transitionSuccess || transitionError) as string} 
            onClose={() => transitionSuccess ? setTransitionSuccess(null) : setTransitionError(null)}
          />
        </div>
      )}

      {purchaseOrder.po_state_system_code === 'ready_to_ship' && (
        <div className="mb-6 p-4 rounded-xl bg-primary-container text-on-primary-container border border-primary/20 flex items-center gap-3">
          <span className="material-symbols-outlined">info</span>
          <div>
            <p className="text-sm font-bold">Ready to Ship — Review Required</p>
            <p className="text-xs opacity-90">The supplier has uploaded shipment documents. Please review them in the <strong>Documents</strong> tab before approving.</p>
          </div>
        </div>
      )}

      {purchaseOrder.po_state_system_code === 'ready_correction_requested' && (
        <div className="mb-6 p-4 rounded-xl bg-tertiary-container text-on-tertiary-container border border-tertiary/20 flex items-center gap-3">
          <span className="material-symbols-outlined">feedback</span>
          <div>
            <p className="text-sm font-bold">Correction Requested</p>
            <p className="text-xs opacity-90">Waiting for the supplier to upload corrected documents.</p>
          </div>
        </div>
      )}

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Column 1: Essential Details & Logistics */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {purchaseOrder.po_state_system_code === 'goods_ready_approved' && (
            <FreightBookingBanner 
              poId={purchaseOrder.id} 
              onConfirm={() => fetchStateData(purchaseOrder.id)} 
            />
          )}

          {['freight_booked', 'in_transit', 'picked_up', 'shipped', 'out_for_delivery', 'received', 'completed'].includes(purchaseOrder.po_state_system_code || '') && (
            <>
              <FreightBookingCard poId={purchaseOrder.id} />
              <ShipmentTrackingSection poId={purchaseOrder.id} />
            </>
          )}

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

          {/* Stakeholders & Partners */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">groups</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Stakeholders & Partners</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Seller */}
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                <p className="text-primary text-[10px] uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">store</span>
                  Seller / Supplier
                </p>
                <p className="font-extrabold text-on-surface text-lg mb-1">{purchaseOrder.seller_entity || '—'}</p>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <p className="text-xs font-bold">{purchaseOrder.seller_contact || 'No contact assigned'}</p>
                </div>
              </div>

              {/* Logistics */}
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                <p className="text-primary text-[10px] uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                  Logistics Partner
                </p>
                <p className="font-extrabold text-on-surface text-lg mb-1">{purchaseOrder.logistics_entity || '—'}</p>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <p className="text-xs font-bold">{purchaseOrder.logistics_contact || 'No contact assigned'}</p>
                </div>
              </div>

              {/* Carrier */}
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                <p className="text-primary text-[10px] uppercase tracking-widest mb-2 font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">flight_takeoff</span>
                  Carrier / Forwarder
                </p>
                <p className="font-extrabold text-on-surface text-lg mb-1">{purchaseOrder.carrier_entity || '—'}</p>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <p className="text-xs font-bold">{purchaseOrder.carrier_contact || 'No contact assigned'}</p>
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Origin Port & Country</p>
                <p className="font-bold text-on-surface uppercase">
                  {purchaseOrder.origin_city_port || '—'}
                  {purchaseOrder.supplier_country ? `, ${purchaseOrder.supplier_country}` : ''}
                </p>
              </div>
              
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Legacy Supplier Info</p>
                <p className="text-xs text-on-surface-variant italic">
                  {purchaseOrder.supplier_email ? `${purchaseOrder.supplier_email}` : ''}
                  {purchaseOrder.supplier_phone ? ` | ${purchaseOrder.supplier_phone}` : ''}
                </p>
              </div>
            </div>
          </section>

          {/*
            Seller Confirmation Summary
            ────────────────────────────
            Shown when the seller has responded (state is seller_confirmed,
            seller_confirmed_partial, or seller_rejected). Gives the buyer
            a quick visual summary without having to scroll to line items.
            Hidden in all other states.
          */}
          {purchaseOrder.po_state_system_code &&
            ['seller_confirmed', 'seller_confirmed_partial', 'seller_rejected'].includes(
              purchaseOrder.po_state_system_code
            ) && (
              <section className={`glass-panel ambient-shadow rounded-xl p-8 border ${
                purchaseOrder.po_state_system_code === 'seller_confirmed'
                  ? 'border-green-300 bg-green-50/40'
                  : purchaseOrder.po_state_system_code === 'seller_confirmed_partial'
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-red-300 bg-red-50/40'
              }`}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary">
                    {purchaseOrder.po_state_system_code === 'seller_confirmed' ? 'check_circle' :
                     purchaseOrder.po_state_system_code === 'seller_confirmed_partial' ? 'warning' : 'cancel'}
                  </span>
                  <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">
                    Seller Response — {purchaseOrder.po_state_name}
                  </h2>
                </div>

                {/*
                  Derive seller response details from the transition attempt whose
                  to_state_system_code is one of the seller confirmation states.
                  The comment lives in metadata.comment — same generic mechanism
                  used across all transitions that require a comment.
                */}
                {(() => {
                  const SELLER_RESPONSE_STATES = ['seller_confirmed', 'seller_confirmed_partial', 'seller_rejected']
                  const sentAttempt = transitionAttempts.find(
                    (a) => a.to_state_system_code === 'sent_to_seller' && a.status === 'success'
                  )
                  const responseAttempt = transitionAttempts.find(
                    (a) => a.to_state_system_code && SELLER_RESPONSE_STATES.includes(a.to_state_system_code) && a.status === 'success'
                  )
                  const sellerComment = responseAttempt?.metadata?.comment as string | undefined

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        {/* Who responded */}
                        <div>
                          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Responded By</p>
                          <p className="font-bold text-on-surface">
                            {responseAttempt?.actor_display_name || purchaseOrder.seller_contact || '—'}
                          </p>
                        </div>

                        {/* When sent to seller */}
                        {sentAttempt && (
                          <div>
                            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Sent to Seller</p>
                            <p className="font-bold text-on-surface">{formatDateTime(sentAttempt.created_at)}</p>
                          </div>
                        )}

                        {/* Confirmed total */}
                        <div>
                          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Confirmed Total</p>
                          <p className="font-bold text-primary text-xl">
                            {formatCurrency(purchaseOrder.total_amount, purchaseOrder.currency)}
                          </p>
                        </div>
                      </div>

                      {/* Seller's comment (from transition metadata) */}
                      {sellerComment && (
                        <div className="mt-4 p-4 bg-surface-container-low rounded-xl">
                          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-2">Seller Comment</p>
                          <p className="text-sm text-on-surface italic">
                            &ldquo;{sellerComment}&rdquo;
                          </p>
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Hint for partial: direct buyer to line items tab */}
                {purchaseOrder.po_state_system_code === 'seller_confirmed_partial' && (
                  <p className="mt-4 text-xs text-amber-700 font-medium">
                    The seller has submitted changes to one or more line items.
                    Review the <strong>Line Items</strong> tab below to see original vs confirmed values.
                  </p>
                )}
              </section>
            )}

          {/* Post-Transition Actions Panel
               ─────────────────────────────
               Shows actions available after the last transition. Automatic
               actions (e.g. "Notify seller by email") appear with their
               execution status. Manual actions can be triggered here.
               Reloads automatically whenever a new transition fires.
          */}
          {poId && (
            <TransitionActionsPanel
              purchaseOrderId={poId}
              refreshKey={actionsRefreshKey}
            />
          )}

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
            <div className="space-y-4">
              {transitionAttempts.map((attempt) => (
                <div 
                  key={attempt.id} 
                  className={`p-4 rounded-lg border-l-4 ${
                    attempt.status === 'success' 
                      ? 'bg-surface-container-low border-primary' 
                      : 'bg-error-container/20 border-error'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-on-surface">{(attempt.attempted_action || 'Unknown').replace(/_/g, ' ')}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      attempt.status === 'success' ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                    }`}>
                      {attempt.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <span className="text-xs text-on-surface-variant bg-surface px-2 py-1 rounded">
                      {(attempt.from_state_system_code || 'START').replace(/_/g, ' ')}
                    </span>
                    <span className="material-symbols-outlined text-xs text-on-surface-variant">arrow_forward</span>
                    <span className="text-xs text-on-surface bg-surface px-2 py-1 rounded font-medium">
                      {(attempt.to_state_system_code || 'END').replace(/_/g, ' ')}
                    </span>
                  </div>
                  {attempt.comment && (
                    <p className="text-xs text-on-surface-variant italic mt-2 bg-surface/50 p-2 rounded border border-outline-variant/10">
                      &ldquo;{attempt.comment}&rdquo;
                    </p>
                  )}
                  {attempt.error_message && (
                    <p className="text-xs text-error mt-2 font-medium bg-error/5 p-2 rounded">
                      {attempt.error_message}
                    </p>
                  )}
                  <div className="mt-3 flex justify-between items-center text-[10px] text-on-surface-variant">
                    <span>{attempt.actor_display_name || attempt.actor_type || 'System'}</span>
                    <span>{formatDateTime(attempt.created_at)}</span>
                  </div>
                </div>
              ))}
              
              {/* Creation Record */}
              <div className="p-4 bg-surface-container-low/50 rounded-lg border-l-4 border-surface-variant">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Created By</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">
                    {(purchaseOrder.creator_name || String(purchaseOrder.created_by)).substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{purchaseOrder.creator_name || `Operator ID: ${purchaseOrder.created_by}`}</p>
                    <p className="text-[10px] text-on-surface-variant">{formatDateTime(purchaseOrder.created_at)}</p>
                  </div>
                </div>
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

      {/* Tabs Section - Full Width */}
      <section className="mt-12 mb-20 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <div className="flex border-b border-outline-variant/30 mb-8 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('line-items')}
            className={`px-8 py-4 font-extrabold tracking-tight text-sm uppercase transition-all relative ${
              activeTab === 'line-items' 
                ? 'text-primary' 
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            Line Items
            {activeTab === 'line-items' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-8 py-4 font-extrabold tracking-tight text-sm uppercase transition-all relative ${
              activeTab === 'documents' 
                ? 'text-primary' 
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            Documents
            {activeTab === 'documents' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('transitions')}
            className={`px-8 py-4 font-extrabold tracking-tight text-sm uppercase transition-all relative ${
              activeTab === 'transitions' 
                ? 'text-primary' 
                : 'text-on-surface-variant/60 hover:text-on-surface'
            }`}
          >
            Transition History
            {activeTab === 'transitions' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
            )}
          </button>
        </div>

        {activeTab === 'line-items' && (
          <PurchaseOrderLineItems
            poId={purchaseOrder.id}
            canManage={canManageUsers()}
            poStateSystemCode={purchaseOrder.po_state_system_code}
          />
        )}

        {activeTab === 'documents' && (
          <div className="flex flex-col gap-8">
            {/* Standard PO Documents */}
            <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-8">Standard PO Documents</h2>
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
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        View Document <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    ) : (
                      <p className="text-xs font-bold text-on-surface-variant/50">Not attached</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Shipment Documents (Uploaded by Supplier) */}
            <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-8">Shipment Documents (Supplier Upload)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Commercial Invoice', url: fixDocUrl(purchaseOrder.commercial_invoice_url) },
                  { label: 'Packing List', url: fixDocUrl(purchaseOrder.packing_list_url) },
                  { label: 'Dangerous Goods', url: fixDocUrl(purchaseOrder.dangerous_goods_declaration_url) },
                  { label: 'Cert. of Origin', url: fixDocUrl(purchaseOrder.certificate_of_origin_url) },
                ].map((doc, idx) => (
                  <div key={idx} className={`p-4 rounded-xl flex flex-col gap-3 ${doc.url ? 'bg-tertiary-container/20 border border-tertiary-container/30' : 'bg-surface-container-low opacity-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-tertiary text-sm">{doc.url ? 'check_circle' : 'cancel'}</span>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{doc.label}</p>
                    </div>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-tertiary hover:underline flex items-center gap-1">
                        View Document <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    ) : (
                      <p className="text-xs font-bold text-on-surface-variant/50">Not attached</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Misc Shipment Documents */}
              {purchaseOrder.misc_shipment_documents && purchaseOrder.misc_shipment_documents.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-4 font-bold">Miscellaneous Shipment Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {purchaseOrder.misc_shipment_documents.map((doc) => (
                      <div key={doc.id} className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/10 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-on-surface-variant text-sm">description</span>
                          <span className="text-xs font-medium text-on-surface truncate max-w-[200px]">{doc.filename}</span>
                        </div>
                        <a href={fixDocUrl(doc.url) || '#'} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary hover:underline">
                          DOWNLOAD
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'transitions' && (
          <PoTransitionAttempts poId={purchaseOrder.id} />
        )}
      </section>

      {/* Transition Comment Modal */}
      {commentModalOpen && pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface/80 backdrop-blur-sm">
          <div className="bg-surface-container rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant/20">
              <h3 className="text-xl font-bold text-on-surface">
                {pendingAction.action_name}
              </h3>
              <p className="text-sm text-on-surface-variant mt-1">
                A comment is required to perform this action.
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={transitionComment}
                onChange={(e) => setTransitionComment(e.target.value)}
                placeholder="Enter a comment for this transition..."
                className="w-full h-32 p-3 bg-surface border border-outline-variant/30 rounded-xl focus:ring-4 focus:ring-primary-container/40 transition-all font-medium text-on-surface"
              />
            </div>
            <div className="p-6 bg-surface-container-high flex justify-end gap-3">
              <button
                onClick={() => {
                  setCommentModalOpen(false)
                  setPendingAction(null)
                }}
                className="px-6 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => executeTransition(pendingAction, transitionComment)}
                disabled={isTransitioning || !transitionComment.trim()}
                className="px-8 py-2 rounded-xl text-sm font-bold text-on-primary bg-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isTransitioning ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
