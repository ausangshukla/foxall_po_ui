import { useState, useEffect } from 'react'
import type { FreightBooking } from '../../types/api'
import { freightBookingsApi } from '../../api/freight-bookings'
import { LoadingSpinner, AlertMessage } from '../common'

interface Props {
  poId: number
  embedded?: boolean
  onUpdate?: () => void
}

function statusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'draft': return 'bg-slate-100 text-slate-500 border-slate-200 border-dashed'
    case 'pending_carrier_confirmation': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'etd_changed': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

function formatStatus(status: string) {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function BookingBody({ booking }: { booking: FreightBooking }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        <div className="space-y-1">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Carrier</p>
          <div className="flex items-center flex-wrap gap-2">
            <div className="w-6 h-6 rounded bg-primary-container flex items-center justify-center text-[10px] font-bold text-on-primary-container shrink-0">
              {(booking.carrier_name || booking.carrier_entity_name || '??').substring(0, 2).toUpperCase()}
            </div>
            <p className="font-bold text-on-surface truncate max-w-[120px]" title={booking.carrier_name || booking.carrier_entity_name || ''}>
              {booking.carrier_name || booking.carrier_entity_name || 'Not assigned'}
            </p>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide shrink-0 ${booking.carrier_booking_workflow === 'api' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
              {booking.carrier_booking_workflow === 'api' ? 'API' : 'Manual'}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Route & Mode</p>
          <div className="flex items-center flex-wrap gap-2 font-bold text-on-surface">
            <span>{booking.origin_port}</span>
            <span className="material-symbols-outlined text-sm text-outline-variant shrink-0">arrow_forward</span>
            <span>{booking.destination_port}</span>
            <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] rounded uppercase shrink-0">
              {booking.transport_mode?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Schedule</p>
          <div className="space-y-0.5">
            <p className="font-bold text-on-surface flex items-center gap-2">
              <span className="text-[10px] text-on-surface-variant w-8">ETD</span>
              {booking.etd || 'TBD'}
            </p>
            {booking.eta && (
              <p className="font-bold text-on-surface-variant flex items-center gap-2">
                <span className="text-[10px] text-on-surface-variant w-8">ETA</span>
                {booking.eta}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Reference</p>
          <p className="font-bold text-primary text-lg tracking-tight">
            {booking.booking_reference || booking.awb_number || booking.bl_number || 'Awaiting Confirmation'}
          </p>
        </div>
      </div>

      {booking.status === 'etd_changed' && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-orange-600">event_busy</span>
            <div>
              <p className="text-orange-900 font-bold text-sm">Carrier Proposed ETD Change</p>
              <p className="text-orange-700 text-xs">New ETD: <strong>{booking.proposed_etd}</strong>. Reason: {booking.etd_change_reason}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-orange-200 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-50 transition-colors">Reject</button>
            <button className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors">Accept Change</button>
          </div>
        </div>
      )}
    </>
  )
}

export function FreightBookingCard({ poId, embedded = false, onUpdate }: Props) {
  const [booking, setBooking] = useState<FreightBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBooking = async () => {
    try {
      const response = await freightBookingsApi.getDraft(poId)
      if (response?.booking) setBooking(response.booking)
    } catch (err) {
      console.error('Failed to fetch booking', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
  }, [poId])

  const handleSubmitToCarrier = async () => {
    if (!booking) return
    setSubmitting(true)
    setError(null)
    try {
      await freightBookingsApi.update(poId, booking.id, {
        status: 'pending_carrier_confirmation' as any
      })
      await fetchBooking()
      if (onUpdate) onUpdate()
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center"><LoadingSpinner /></div>
  
  if (!booking) return null

  const isDraft = booking.status === 'draft'

  const handleEdit = () => {
    if ((window as any).openFreightWizard) {
      (window as any).openFreightWizard();
    }
  }

  if (embedded) {
    return (
      <div>
        {error && <AlertMessage variant="danger" message={error} className="mb-4" />}
        <div className="flex items-center justify-between mb-6">
          <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Booking Status</p>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor(booking.status)}`}>
              {formatStatus(booking.status)}
            </span>
            {isDraft && (
              <button
                onClick={handleSubmitToCarrier}
                disabled={submitting}
                className="px-3 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
              >
                {submitting ? <span className="material-symbols-outlined animate-spin text-xs">progress_activity</span> : <span className="material-symbols-outlined text-xs">send</span>}
                Submit to Carrier
              </button>
            )}
          </div>
        </div>
        <BookingBody booking={booking} />
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-3xl ambient-shadow border border-outline-variant/20 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-8 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">directions_boat</span>
          <h2 className="text-lg font-extrabold text-on-surface font-headline tracking-tight">Freight Booking Details</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor(booking.status)}`}>
            {formatStatus(booking.status)}
          </span>
          <div className="flex gap-2">
            {(isDraft || booking.status === 'pending_carrier_confirmation') && (
              <button
                onClick={handleEdit}
                className="p-1.5 rounded-lg text-on-surface-variant hover:bg-primary-container/20 hover:text-primary transition-all"
                title="Edit Booking"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            )}
            {isDraft && (
              <button
                onClick={handleSubmitToCarrier}
                disabled={submitting}
                className="px-4 py-1.5 bg-primary text-on-primary text-xs font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">send</span>}
                Submit to Carrier
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="p-8">
        {error && <AlertMessage variant="danger" message={error} className="mb-6" />}
        <BookingBody booking={booking} />
      </div>
    </div>
  )
}
