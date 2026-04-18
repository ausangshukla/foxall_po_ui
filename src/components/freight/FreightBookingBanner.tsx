import { useState, useEffect } from 'react'
import { freightBookingsApi } from '../../api/freight-bookings'
import type { BookingDraftResponse } from '../../api/freight-bookings'
import { FreightBookingWizard } from './FreightBookingWizard'

interface Props {
  poId: number
  poStateCode: string
  onConfirm: () => void
}

export function FreightBookingBanner({ poId, poStateCode, onConfirm }: Props) {
  const [draft, setDraft] = useState<BookingDraftResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    (window as any).openFreightWizard = () => setWizardOpen(true)
    return () => { delete (window as any).openFreightWizard }
  }, [])

  const fetchDraft = async () => {
    try {
      const response = await freightBookingsApi.getDraft(poId)
      setDraft(response)
    } catch (err) {
      console.error('Failed to fetch booking draft', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDraft() }, [poId])

  const onSuccess = (data: any) => {
    if (data && data.po_number && (window as any).setPurchaseOrder) {
      (window as any).setPurchaseOrder(data)
    }
    setWizardOpen(false)
    fetchDraft()
    onConfirm()
  }

  const handleConfirm = async () => {
    if (!draft?.booking) return
    setConfirming(true)
    try {
      await freightBookingsApi.update(poId, draft.booking.id, {
        status: 'pending_carrier_confirmation' as any
      })
      await fetchDraft()
      onConfirm()
    } catch (err) {
      console.error('Failed to confirm booking', err)
      setConfirmError('Failed to confirm booking. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return null

  const booking = draft?.booking
  const status = booking?.status

  // ── Confirmed — shipment tracking takes over, no banner needed ───────────────
  if (status === 'confirmed') return null

  // ── Awaiting carrier confirmation ────────────────────────────────────────────
  if (status === 'pending_carrier_confirmation') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <span className="material-symbols-outlined text-3xl">hourglass_top</span>
        </div>
        <div>
          <h3 className="text-blue-900 font-bold text-lg">Awaiting Carrier Confirmation</h3>
          <p className="text-blue-700 text-sm">
            Booking request sent to <strong>{booking?.carrier_name || 'the carrier'}</strong>.
            {booking?.carrier_booking_workflow !== 'api' && ' They will confirm via the link in their email.'}
          </p>
        </div>
      </div>
    )
  }

  // ── Carrier proposed ETD change — action required ────────────────────────────
  if (status === 'etd_changed') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
          <span className="material-symbols-outlined text-3xl">event_busy</span>
        </div>
        <div>
          <h3 className="text-orange-900 font-bold text-lg">Carrier Proposed an ETD Change</h3>
          <p className="text-orange-700 text-sm">
            <strong>{booking?.carrier_name || 'The carrier'}</strong> cannot honour the original ETD and has proposed{' '}
            <strong>{booking?.proposed_etd}</strong>. Review and accept or reject using the controls below.
          </p>
        </div>
      </div>
    )
  }

  // ── Contract rate auto-matched — awaiting manager confirmation ───────────────
  if (booking?.booking_source === 'contract_rate') {
    const isApiCarrier = booking.carrier_booking_workflow === 'api'
    return (
      <>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <span className="material-symbols-outlined text-3xl">directions_boat</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-emerald-900 font-bold text-lg">Contract Rate Found</h3>
                {isApiCarrier && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide rounded">Tier 1 API</span>
                )}
              </div>
              <p className="text-emerald-700 text-sm">
                Ready to book with <strong>{booking.carrier_name}</strong> at <strong>USD {Number(booking.total_cost_usd).toFixed(2)}</strong>.
                {isApiCarrier && <span className="ml-1 text-blue-700">Booking will be confirmed automatically via carrier API.</span>}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {confirmError && <p className="text-red-600 text-xs">{confirmError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setWizardOpen(true)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                Change Details
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {confirming ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
                {isApiCarrier ? 'Book via Carrier API' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
        {wizardOpen && (
          <FreightBookingWizard poId={poId} onClose={() => setWizardOpen(false)} onSuccess={onSuccess} />
        )}
      </>
    )
  }

  // ── Draft booking — incomplete, needs submitting ─────────────────────────────
  if (status === 'draft') {
    return (
      <>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <div>
              <h3 className="text-amber-900 font-bold text-lg">Incomplete Freight Booking</h3>
              <p className="text-amber-700 text-sm">
                Booking details are saved as a draft. Complete the booking to send it to the carrier.
              </p>
            </div>
          </div>
          <button
            onClick={() => setWizardOpen(true)}
            className="bg-amber-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md active:scale-[0.98] flex items-center gap-2"
          >
            <span className="material-symbols-outlined">directions_boat</span>
            Complete Booking
          </button>
        </div>
        {wizardOpen && (
          <FreightBookingWizard poId={poId} onClose={() => setWizardOpen(false)} onSuccess={onSuccess} />
        )}
      </>
    )
  }

  // ── No booking record ────────────────────────────────────────────────────────
  const PRE_FREIGHT_STATES = ['goods_ready_approved', 'draft', 'pending_approval', 'approved', 'sent_to_seller', 'seller_confirmed', 'seller_confirmed_partial', 'ready_to_ship']
  const isFreightState = !PRE_FREIGHT_STATES.includes(poStateCode)

  return (
    <>
      <div className={`${isFreightState ? 'bg-amber-50 border-amber-200' : 'bg-primary-container/10 border-primary-container/20'} border rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${isFreightState ? 'bg-amber-100 text-amber-600' : 'bg-primary-container/20 text-primary'} flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-3xl">{isFreightState ? 'warning' : 'smart_toy'}</span>
          </div>
          <div>
            <h3 className={`${isFreightState ? 'text-amber-900' : 'text-on-primary-container'} font-bold text-lg`}>
              {isFreightState ? 'Missing Freight Booking' : 'Ready to Book Freight'}
            </h3>
            <p className={`${isFreightState ? 'text-amber-700' : 'text-on-surface-variant'} text-sm`}>
              {isFreightState
                ? 'This PO is in a freight state but no booking record was found. Please create one.'
                : `AI recommends ${draft?.recommendation.transport_mode.replace('_', ' ').toUpperCase()}. ${draft?.recommendation.rationale}`
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className={`${isFreightState ? 'bg-amber-600' : 'bg-primary'} text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md active:scale-[0.98] flex items-center gap-2`}
        >
          <span className="material-symbols-outlined">directions_boat</span>
          {isFreightState ? 'Create Booking' : 'Book Freight'}
        </button>
      </div>
      {wizardOpen && (
        <FreightBookingWizard poId={poId} onClose={() => setWizardOpen(false)} onSuccess={onSuccess} />
      )}
    </>
  )
}
