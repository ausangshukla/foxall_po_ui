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
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    (window as any).openFreightWizard = () => setWizardOpen(true);
    return () => { delete (window as any).openFreightWizard; };
  }, []);

  const onSuccess = (data: any) => {
    // If the response is a full PO object (standard for our creates)
    if (data && data.po_number && (window as any).setPurchaseOrder) {
      (window as any).setPurchaseOrder(data)
    }
    setWizardOpen(false)
    fetchDraft()
    onConfirm()
  }

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

  useEffect(() => {
    fetchDraft()
  }, [poId])

  const handleConfirm = async () => {
    if (!draft?.booking) return
    setConfirming(true)
    try {
      await freightBookingsApi.update(poId, draft.booking.id, {
        status: 'pending_carrier_confirmation' as any
      })
      onConfirm()
    } catch (err) {
      console.error('Failed to confirm booking', err)
      alert('Failed to confirm booking')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return null

  // If no booking exists but we are in a freight state, show the trigger to create one
  const isNoBookingInFreightState = !draft?.booking && poId

  // If a contract rate was auto-applied
  if (draft?.booking?.booking_source === 'contract_rate') {
    const isApiCarrier = draft.booking.carrier_booking_workflow === 'api'
    return (
      <>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <span className="material-symbols-outlined text-3xl">directions_boat</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-emerald-900 font-bold text-lg">Contract Rate Found</h3>
                {isApiCarrier && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide rounded">Tier 1 API</span>
                )}
              </div>
              <p className="text-emerald-700">
                Ready to book with <strong>{draft.booking.carrier_name}</strong> at <strong>USD {Number(draft.booking.total_cost_usd).toFixed(2)}</strong>.
                {isApiCarrier && <span className="ml-1 text-blue-700">Booking will be confirmed automatically via carrier API.</span>}
              </p>
            </div>
          </div>
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
        {wizardOpen && (
          <FreightBookingWizard 
            poId={poId} 
            onClose={() => setWizardOpen(false)} 
            onSuccess={onSuccess} 
          />
        )}
      </>
    )
  }

  // If no contract rate OR if we are in a freight state without a booking record
  const isInFreightState = !['goods_ready_approved', 'draft', 'pending_approval', 'approved', 'sent_to_seller', 'seller_confirmed', 'seller_confirmed_partial', 'ready_to_ship'].includes(poStateCode)

  return (
    <>
      <div className={`${isInFreightState ? 'bg-amber-50 border-amber-200' : 'bg-primary-container/10 border-primary-container/20'} border rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full ${isInFreightState ? 'bg-amber-100 text-amber-600' : 'bg-primary-container/20 text-primary'} flex items-center justify-center`}>
            <span className="material-symbols-outlined text-3xl">{isInFreightState || isNoBookingInFreightState ? 'warning' : 'smart_toy'}</span>
          </div>
          <div>
            <h3 className={`${isInFreightState ? 'text-amber-900' : 'text-on-primary-container'} font-bold text-lg`}>
              {isNoBookingInFreightState ? 'Missing Freight Booking' : isInFreightState ? 'Incomplete Freight Booking' : 'Ready to Book Freight'}
            </h3>
            <p className={`${isInFreightState ? 'text-amber-700' : 'text-on-surface-variant'} text-sm`}>
              {isNoBookingInFreightState 
                ? 'This PO is in a freight state but no booking record was found. Please create one.'
                : isInFreightState
                ? 'This PO is marked as Freight Booked but the booking details are still in draft. Please complete the booking.'
                : `AI recommends ${draft?.recommendation.transport_mode.replace('_', ' ').toUpperCase()}. ${draft?.recommendation.rationale}`
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className={`${isInFreightState ? 'bg-amber-600' : 'bg-primary'} text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md active:scale-[0.98] flex items-center gap-2`}
        >
          <span className="material-symbols-outlined">directions_boat</span>
          {isNoBookingInFreightState ? 'Create Booking' : isInFreightState ? 'Complete Booking' : 'Book Freight'}
        </button>
      </div>
      {wizardOpen && (
        <FreightBookingWizard 
          poId={poId} 
          onClose={() => setWizardOpen(false)} 
          onSuccess={onSuccess} 
        />
      )}
    </>
  )
}
