/**
 * SellerConfirmationPage
 *
 * Public page — NO authentication required.
 * Sellers arrive here via the magic link in their notification email.
 * Styled to match the authenticated PurchaseOrderShowPage exactly.
 *
 * URL pattern: /seller-confirmation/:poId?token=…&action_key=…
 */

import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getSellerConfirmationData,
  submitSellerConfirmation,
} from '../../api/seller-confirmations'
import type {
  SellerConfirmationDataResponse,
  SellerConfirmationLineItem,
} from '../../types/api'

// ============================================================================
// Types
// ============================================================================

interface LineItemFormState {
  id: number
  confirmedQty: string
  confirmedPrice: string
  notes: string
}

// ============================================================================
// Component
// ============================================================================

export function SellerConfirmationPage() {
  const { poId } = useParams<{ poId: string }>()
  const [searchParams] = useSearchParams()

  const token     = searchParams.get('token') || ''
  const actionKey = searchParams.get('action_key') || 'seller_confirm'
  const poIdNum   = poId ? parseInt(poId, 10) : null

  const [data, setData]             = useState<SellerConfirmationDataResponse | null>(null)
  const [loadError, setLoadError]   = useState<string | null>(null)
  const [isLoading, setIsLoading]   = useState(true)

  const [lineItemForms, setLineItemForms] = useState<LineItemFormState[]>([])
  const [comment, setComment]             = useState('')
  const [isRejecting, setIsRejecting]     = useState(false)
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [submitError, setSubmitError]     = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<{ message: string; newState: string } | null>(null)
  const [commentError, setCommentError]   = useState<string | null>(null)

  useEffect(() => {
    if (!poIdNum || !token) {
      setLoadError('Invalid confirmation link — missing order ID or token.')
      setIsLoading(false)
      return
    }

    getSellerConfirmationData(poIdNum, token, actionKey)
      .then((response) => {
        setData(response)
        setLineItemForms(
          response.line_items.map((item) => ({
            id: item.id,
            confirmedQty: formatDecimal(
              item.seller_confirmed_quantity ?? item.quantity_ordered
            ),
            confirmedPrice: formatDecimal(
              item.seller_confirmed_unit_price ?? item.unit_value ?? 0
            ),
            notes: item.seller_confirmation_notes ?? '',
          }))
        )
      })
      .catch((err: Error) => {
        setLoadError(err.message || 'Failed to load order details.')
      })
      .finally(() => setIsLoading(false))
  }, [poIdNum, token, actionKey])

  const handleCopyFromOriginal = useCallback(() => {
    if (!data) return
    setLineItemForms(
      data.line_items.map((item) => ({
        id: item.id,
        confirmedQty:   formatDecimal(item.quantity_ordered),
        confirmedPrice: formatDecimal(item.unit_value ?? 0),
        notes: '',
      }))
    )
  }, [data])

  const handleLineItemChange = (
    id: number,
    field: 'confirmedQty' | 'confirmedPrice' | 'notes',
    value: string
  ) => {
    setLineItemForms((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    )
  }

  const handleSubmit = async (reject = false) => {
    if (!poIdNum || !data) return

    if (reject && !comment.trim()) {
      setCommentError('Please provide a reason for rejecting this order.')
      return
    }
    setCommentError(null)
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const result = await submitSellerConfirmation(poIdNum, {
        token,
        action_key: reject ? 'seller_reject' : 'seller_confirm',
        comment: comment.trim() || undefined,
        line_items: lineItemForms.map((row) => ({
          id: row.id,
          seller_confirmed_quantity:   parseFloat(row.confirmedQty) || 0,
          seller_confirmed_unit_price: parseFloat(row.confirmedPrice) || 0,
          seller_confirmation_notes:   row.notes,
        })),
      })
      setSubmitSuccess({ message: result.message, newState: result.new_state })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isRowChanged = (item: SellerConfirmationLineItem, form: LineItemFormState): boolean => {
    const qtyChanged   = parseFloat(form.confirmedQty) !== item.quantity_ordered
    const priceChanged = item.unit_value !== null &&
                         parseFloat(form.confirmedPrice) !== item.unit_value
    return qtyChanged || priceChanged
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="glass-panel ambient-shadow rounded-xl p-10 text-center">
          <div className="w-10 h-10 border-4 border-surface-container-high border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant text-sm font-medium">Loading order details…</p>
        </div>
      </div>
    )
  }

  // ── Link/token error ───────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="glass-panel ambient-shadow rounded-xl p-10 max-w-md w-full border-t-4 border-error">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-error">link_off</span>
            <h1 className="text-xl font-extrabold tracking-tight text-error">Link Error</h1>
          </div>
          <p className="text-on-surface text-sm mb-4">{loadError}</p>
          <p className="text-on-surface-variant text-xs">
            If you believe this is a mistake, please contact the buyer directly and ask them to resend the confirmation link.
          </p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const po = data.purchase_order
  const alreadyProcessed = po.current_state && !['sent_to_seller'].includes(po.current_state)

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitSuccess) {
    const isRejected = submitSuccess.newState === 'seller_rejected'
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className={`glass-panel ambient-shadow rounded-xl p-10 max-w-md w-full text-center border-t-4 ${isRejected ? 'border-tertiary' : 'border-primary'}`}>
          <span className={`material-symbols-outlined text-5xl mb-4 block ${isRejected ? 'text-tertiary' : 'text-primary'}`}>
            {isRejected ? 'assignment_return' : 'check_circle'}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface mb-2">
            {isRejected ? 'Order Rejected' : 'Confirmation Received'}
          </h1>
          <p className="text-on-surface-variant text-sm mb-4">{submitSuccess.message}</p>
          <p className="text-xs text-on-surface-variant">You may close this window.</p>
        </div>
      </div>
    )
  }

  // ── Main page ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface">
      {/* Minimal navbar — same frosted style, no auth links */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline">
            Logistics Portal
          </span>
          <span className="text-sm font-semibold text-on-surface-variant">
            Order Confirmation Request
          </span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-12 pt-24 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* ── Hero header — identical structure to PurchaseOrderShowPage ── */}
        <header className="relative overflow-hidden rounded-xl mb-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end md:items-center bg-gradient-to-br from-primary-container via-surface to-surface-container-low">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-surface-container-lowest text-primary text-[10px] font-extrabold tracking-widest rounded-full uppercase">
                Awaiting Confirmation
              </span>
              <span className="text-on-surface-variant font-light tracking-widest text-sm">
                {po.po_number}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-primary-fixed mb-2">
              PO #{po.po_number}
            </h1>
            <p className="text-on-surface-variant font-light tracking-wide max-w-md">
              {po.buyer_entity_name} is requesting your confirmation for this purchase order.
            </p>
          </div>

          {/* Action buttons — only shown when PO is still awaiting confirmation */}
          {!alreadyProcessed && (
            <div className="relative z-10 mt-6 md:mt-0 flex gap-4 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsRejecting(true)
                  if (window.confirm(
                    'Are you sure you want to reject this purchase order? ' +
                    'Please make sure you have filled in a reason in the Comments section below.'
                  )) {
                    handleSubmit(true)
                  } else {
                    setIsRejecting(false)
                  }
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 bg-error text-on-error disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">cancel</span>
                {isSubmitting && isRejecting ? 'Rejecting…' : 'Reject Order'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-6 py-2.5 font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 bg-primary text-on-primary disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                {isSubmitting && !isRejecting ? 'Submitting…' : 'Confirm Order'}
              </button>
            </div>
          )}

          {/* Decorative blur — same as show page */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </header>

        {/* ── Alert banners ── */}
        {alreadyProcessed && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-tertiary-container text-on-tertiary-container text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">info</span>
            <span>
              <strong>This order has already been processed.</strong>{' '}
              Current status: <em>{po.current_state?.replace(/_/g, ' ')}</em>.
              If you need to make changes, please contact the buyer.
            </span>
          </div>
        )}
        {submitError && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span><strong>Submission failed:</strong> {submitError}</span>
          </div>
        )}

        {/* ── Bento grid — same 8/4 split as show page ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* ── Left column (8 cols) ── */}
          <div className="md:col-span-8 flex flex-col gap-6">

            {/* Essential Details */}
            <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-8">
                Essential Details
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Buyer</p>
                  <p className="font-bold text-on-surface">{po.buyer_entity_name || '—'}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Your Company</p>
                  <p className="font-bold text-on-surface">{po.seller_entity_name || '—'}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Order Total</p>
                  <p className="font-bold text-primary text-xl tracking-tight">
                    {formatMoney(po.total_amount, po.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Currency</p>
                  <p className="font-bold text-on-surface uppercase">{po.currency}</p>
                </div>
              </div>
            </section>

            {/* Line Items */}
            <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">inventory_2</span>
                  <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Line Items</h2>
                </div>
                {!alreadyProcessed && (
                  <button
                    type="button"
                    onClick={handleCopyFromOriginal}
                    className="text-xs font-bold px-4 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors border border-outline-variant/30"
                    title="Fill all confirmed quantities and prices with the original ordered values"
                  >
                    Copy from Original
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-outline-variant/40">
                      <th className="text-left pb-3 px-2 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">SKU / Part</th>
                      <th className="text-left pb-3 px-2 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Description</th>
                      <th className="text-right pb-3 px-2 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Ordered Qty</th>
                      <th className="text-right pb-3 px-2 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">Unit Price</th>
                      <th className="text-right pb-3 px-2 text-[10px] font-extrabold text-primary uppercase tracking-widest whitespace-nowrap">Confirmed Qty *</th>
                      <th className="text-right pb-3 px-2 text-[10px] font-extrabold text-primary uppercase tracking-widest whitespace-nowrap">Confirmed Price *</th>
                      <th className="text-left pb-3 px-2 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Seller Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.line_items.map((item) => {
                      const form    = lineItemForms.find((f) => f.id === item.id)
                      const changed = form ? isRowChanged(item, form) : false

                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-outline-variant/20 transition-colors ${changed ? 'bg-tertiary-fixed/20' : 'hover:bg-surface-container-low/50'}`}
                        >
                          <td className="py-3 px-2 font-bold text-on-surface">{item.sku_or_part_number || '—'}</td>
                          <td className="py-3 px-2 text-on-surface-variant">{item.description || '—'}</td>
                          <td className="py-3 px-2 text-right text-on-surface-variant">
                            {formatDecimal(item.quantity_ordered)} {item.unit_of_measure}
                          </td>
                          <td className="py-3 px-2 text-right text-on-surface-variant">
                            {item.unit_value != null ? formatMoney(item.unit_value, item.currency) : '—'}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {alreadyProcessed ? (
                              <span className="font-bold text-on-surface">{form?.confirmedQty ?? '—'}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                step="0.001"
                                value={form?.confirmedQty ?? ''}
                                onChange={(e) => handleLineItemChange(item.id, 'confirmedQty', e.target.value)}
                                className="w-24 text-right px-2 py-1.5 bg-surface border border-outline-variant rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                              />
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            {alreadyProcessed ? (
                              <span className="font-bold text-on-surface">{form?.confirmedPrice ?? '—'}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form?.confirmedPrice ?? ''}
                                onChange={(e) => handleLineItemChange(item.id, 'confirmedPrice', e.target.value)}
                                className="w-24 text-right px-2 py-1.5 bg-surface border border-outline-variant rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                              />
                            )}
                          </td>
                          <td className="py-3 px-2">
                            {alreadyProcessed ? (
                              <span className="text-on-surface-variant text-xs">{form?.notes || '—'}</span>
                            ) : (
                              <input
                                type="text"
                                placeholder="Optional note…"
                                value={form?.notes ?? ''}
                                onChange={(e) => handleLineItemChange(item.id, 'notes', e.target.value)}
                                className="w-full min-w-28 px-2 py-1.5 bg-surface border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                              />
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[10px] text-on-surface-variant uppercase tracking-widest">
                * Editable fields — rows highlighted in yellow have been modified from the original.
              </p>
            </section>

            {/* Comments */}
            {!alreadyProcessed && (
              <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-primary">chat</span>
                  <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Comments</h2>
                </div>
                <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest mb-2" htmlFor="seller-comment">
                  Overall comment{' '}
                  <span className="normal-case tracking-normal font-normal text-on-surface-variant/70">
                    (required if rejecting; optional otherwise)
                  </span>
                </label>
                <textarea
                  id="seller-comment"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add any notes, questions, or reasons for changes…"
                  className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                {commentError && (
                  <p className="text-error text-xs mt-2 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {commentError}
                  </p>
                )}
              </section>
            )}
          </div>

          {/* ── Right column (4 cols) ── */}
          <div className="md:col-span-4 flex flex-col gap-6">

            {/* Order Dates */}
            <section className="glass-panel ambient-shadow rounded-xl p-6 border border-outline-variant/20">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
                <h2 className="text-on-primary-container font-extrabold tracking-tight text-base">Key Dates</h2>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Order Date</p>
                  <p className="font-bold text-on-surface text-sm">{formatDate(po.order_date)}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Est. Ready Date</p>
                  <p className="font-bold text-on-surface text-sm">{formatDate(po.estimated_ready_date)}</p>
                </div>
              </div>
            </section>

            {/* Shipping */}
            <section className="glass-panel ambient-shadow rounded-xl p-6 border border-outline-variant/20">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-primary text-base">local_shipping</span>
                <h2 className="text-on-primary-container font-extrabold tracking-tight text-base">Shipping</h2>
              </div>
              <div className="flex flex-col gap-4">
                {po.incoterm && (
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Incoterm</p>
                    <p className="font-bold text-on-surface text-sm uppercase">{po.incoterm}</p>
                  </div>
                )}
                {po.payment_terms && (
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Payment Terms</p>
                    <p className="font-bold text-on-surface text-sm">{po.payment_terms}</p>
                  </div>
                )}
                {po.cargo_description && (
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Cargo</p>
                    <p className="text-on-surface text-sm">{po.cargo_description}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Confirm / Reject actions — repeated in sidebar for convenience */}
            {!alreadyProcessed && (
              <section className="glass-panel ambient-shadow rounded-xl p-6 border border-outline-variant/20">
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-primary text-base">task_alt</span>
                  <h2 className="text-on-primary-container font-extrabold tracking-tight text-base">Your Response</h2>
                </div>
                <p className="text-on-surface-variant text-xs mb-4">
                  Review the line items above, adjust quantities or prices if needed, then confirm or reject.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-primary text-on-primary disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {isSubmitting && !isRejecting ? 'Submitting…' : 'Confirm Order'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRejecting(true)
                      if (window.confirm(
                        'Are you sure you want to reject this purchase order? ' +
                        'Please make sure you have filled in a reason in the Comments section.'
                      )) {
                        handleSubmit(true)
                      } else {
                        setIsRejecting(false)
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 font-bold rounded-lg shadow-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-error text-on-error disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    {isSubmitting && isRejecting ? 'Rejecting…' : 'Reject Order'}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant">
          This confirmation link was sent to you by {po.buyer_entity_name}.
          If you have questions, please reply to their procurement team directly.
        </footer>
      </div>
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return parseFloat(String(value)).toString()
}

function formatMoney(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}
