import { useState, useEffect } from 'react'
import { freightBookingsApi } from '../../api/freight-bookings'
import type { BookingDraftResponse } from '../../api/freight-bookings'
import FreightBookingWizard from './FreightBookingWizard'

interface Props {
  poId: number
  onConfirm: () => void
}

export function FreightBookingBanner({ poId, onConfirm }: Props) {
  const [draft, setDraft] = useState<BookingDraftResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)

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
            onSuccess={() => {
              setWizardOpen(false)
              fetchDraft() // Refresh the local draft state
              onConfirm()  // Refresh the parent PO state
            }} 
          />
        )}
      </>
    )
  }

  // If no contract rate OR if we are in a freight state without a booking record
  return (
    <>
      <div className="bg-primary-container/10 border border-primary-container/20 rounded-2xl p-6 mb-8 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">{isNoBookingInFreightState ? 'warning' : 'smart_toy'}</span>
          </div>
          <div>
            <h3 className="text-on-primary-container font-bold text-lg">
              {isNoBookingInFreightState ? 'Missing Freight Booking' : 'Ready to Book Freight'}
            </h3>
            <p className="text-on-surface-variant text-sm">
              {isNoBookingInFreightState 
                ? 'This PO is in a freight state but no booking record was found. Please create one.'
                : `AI recommends ${draft?.recommendation.transport_mode.replace('_', ' ').toUpperCase()}. ${draft?.recommendation.rationale}`
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => setWizardOpen(true)}
          className="bg-primary text-on-primary px-8 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md active:scale-[0.98] flex items-center gap-2"
        >
          <span className="material-symbols-outlined">directions_boat</span>
          {isNoBookingInFreightState ? 'Create Booking' : 'Book Freight'}
        </button>
      </div>
      {wizardOpen && (
        <FreightBookingWizard 
          poId={poId} 
          onClose={() => setWizardOpen(false)} 
          onSuccess={() => {
            setWizardOpen(false)
            fetchDraft() // Refresh local draft
            onConfirm()  // Refresh parent PO
          }} 
        />
      )}
    </>
  )
}
