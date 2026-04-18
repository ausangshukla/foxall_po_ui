import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/common'
import { ShipmentTimeline } from '../../components/freight/ShipmentTimeline'
import { DelayAlertsList } from '../../components/freight/DelayAlertsList'
import { freightBookingsApi } from '../../api/freight-bookings'
import { shipmentTrackingsApi } from '../../api/shipment-trackings'
import type { FreightBookingDetail } from '../../types/api'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  contract_rate_applied: 'Rate Applied',
  pending_carrier_confirmation: 'Pending Confirmation',
  confirmed: 'Confirmed',
  etd_changed: 'ETD Changed',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  contract_rate_applied: 'bg-blue-100 text-blue-700',
  pending_carrier_confirmation: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  etd_changed: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-600',
}

const TRANSPORT_ICONS: Record<string, string> = {
  ocean_fcl: 'directions_boat',
  ocean_lcl: 'directions_boat',
  air: 'flight',
  road: 'local_shipping',
  rail: 'train',
}

function InfoRow({ icon, label, value, highlight }: { icon: string; label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-outline-variant/10 last:border-0">
      <span className={`material-symbols-outlined text-[16px] flex-shrink-0 ${highlight ? 'text-primary' : 'text-on-surface-variant'}`}>{icon}</span>
      <span className="text-on-surface-variant text-xs font-medium flex-1">{label}</span>
      <span className={`text-xs font-bold text-right ${highlight ? 'text-primary' : 'text-on-surface'}`}>{value ?? '—'}</span>
    </div>
  )
}

function DetailCard({ title, icon, iconColor, children }: { title: string; icon: string; iconColor: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface overflow-hidden">
      <div className={`px-5 py-4 flex items-center gap-2.5 border-b border-outline-variant/10 ${iconColor}`}>
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <h3 className="text-[11px] font-black uppercase tracking-widest">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

export function FreightBookingShowPage() {
  const isAuth = useRequireAuth()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [booking, setBooking] = useState<FreightBookingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('timeline')

  const loadBooking = () => {
    if (!id) return
    freightBookingsApi
      .getWithTracking(Number(id))
      .then(setBooking)
      .catch(() => setError('Failed to load booking.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (isAuth) loadBooking()
  }, [isAuth, id])

  const acknowledgeAlert = async (alertId: number) => {
    if (!booking?.purchase_order?.id) return
    await shipmentTrackingsApi.acknowledgeAlert(booking.purchase_order.id, alertId)
    loadBooking()
  }

  if (!isAuth || loading) return <LoadingSpinner />
  if (error || !booking) return (
    <div className="max-w-screen-2xl mx-auto px-8 py-16 text-center">
      <p className="text-error">{error ?? 'Booking not found.'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold text-sm hover:underline">← Go back</button>
    </div>
  )

  const tracking = booking.tracking
  const events = tracking?.events ?? []
  const alerts = tracking?.alerts ?? []
  const hasActiveAlerts = alerts.some(a => !a.acknowledged_at)
  const transportIcon = TRANSPORT_ICONS[booking.transport_mode ?? ''] ?? 'directions_boat'

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'

  const etdDate = booking.etd ? new Date(booking.etd) : null
  const etaDate = tracking?.carrier_eta ? new Date(tracking.carrier_eta.toString()) : booking.eta ? new Date(booking.eta) : null
  const transitDays = etdDate && etaDate ? Math.round((etaDate.getTime() - etdDate.getTime()) / 86400000) : null

  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant">
        <Link to="/freight-bookings" className="hover:text-primary font-medium transition-colors">Freight Bookings</Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="font-bold text-on-surface">{booking.booking_reference ?? `Booking #${booking.id}`}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[booking.status] ?? 'bg-slate-100 text-slate-500'}`}>
              {STATUS_LABELS[booking.status] ?? booking.status}
            </span>
            {booking.carrier_api_source && (
              <span className="px-2.5 py-1 bg-primary-container/30 text-primary text-[10px] font-black uppercase rounded-full">Live Tracked</span>
            )}
            {hasActiveAlerts && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error-container text-error text-[10px] font-black uppercase">
                <span className="material-symbols-outlined text-[12px]">warning</span>
                Delay Alert
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-primary-container">
            {booking.carrier_name ?? 'Unknown Carrier'}
          </h1>
          {booking.purchase_order && (
            <Link
              to={`/purchase-orders/${booking.purchase_order.id}`}
              className="text-sm text-primary font-bold hover:underline mt-1 inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">receipt_long</span>
              {booking.purchase_order.po_number}
            </Link>
          )}
        </div>
      </div>

      {/* Hero route card */}
      <div className="glass-panel rounded-2xl border border-outline-variant/20 ambient-shadow overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/10">

          {/* Origin */}
          <div className="p-8 flex flex-col justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Origin</p>
              <p className="text-3xl font-extrabold tracking-tight text-on-surface">{booking.origin_port}</p>
              <p className="text-sm text-on-surface-variant mt-1 font-medium">Departure</p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/10">
              <span className="material-symbols-outlined text-primary text-[18px]">flight_takeoff</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">ETD</p>
                <p className="text-base font-extrabold text-on-surface">{formatDate(booking.etd)}</p>
              </div>
            </div>
          </div>

          {/* Journey visual */}
          <div className="p-8 flex flex-col items-center justify-center gap-4 bg-surface-container-low/40">
            <div className="flex items-center gap-3 w-full justify-center">
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow-md flex-shrink-0" />
              <div className="flex-1 relative h-0.5 bg-outline-variant/20">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/30 rounded-full" />
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2">
                  <div className="bg-surface border border-outline-variant/20 rounded-full p-1.5 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[20px]">{transportIcon}</span>
                  </div>
                </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-outline-variant/50 border-2 border-white shadow-md flex-shrink-0" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                {booking.transport_mode?.replace('_', ' ').toUpperCase() ?? '—'}
                {booking.container_type ? ` · ${booking.container_type}` : ''}
              </p>
              {transitDays !== null && (
                <p className="text-xs font-bold text-primary">{transitDays} days transit</p>
              )}
              {tracking?.vessel_name && (
                <p className="text-xs text-on-surface-variant font-medium">{tracking.vessel_name}</p>
              )}
            </div>
          </div>

          {/* Destination */}
          <div className="p-8 flex flex-col justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Destination</p>
              <p className="text-3xl font-extrabold tracking-tight text-on-surface">{booking.destination_port}</p>
              <p className="text-sm text-on-surface-variant mt-1 font-medium">Arrival</p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/10">
              <span className={`material-symbols-outlined text-[18px] ${hasActiveAlerts ? 'text-error' : 'text-primary'}`}>flag</span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                  {tracking?.carrier_eta ? 'Live ETA' : 'ETA'}
                </p>
                <p className={`text-base font-extrabold ${hasActiveAlerts ? 'text-error' : 'text-on-surface'}`}>
                  {formatDate(tracking?.carrier_eta?.toString() ?? booking.eta)}
                </p>
              </div>
              {hasActiveAlerts && (
                <span className="ml-auto material-symbols-outlined text-error text-[18px]">warning</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom stats strip */}
        <div className="border-t border-outline-variant/10 bg-surface-container-low/60 grid grid-cols-2 md:grid-cols-4 divide-x divide-outline-variant/10">
          {[
            { label: 'Tracking Status', value: tracking?.current_status_code ?? '—', icon: 'radar', color: 'text-primary' },
            { label: 'Booking Ref', value: booking.booking_reference ?? '—', icon: 'tag', color: 'text-on-surface' },
            { label: 'Agreed Rate', value: booking.agreed_rate_usd ? `$${Number(booking.agreed_rate_usd).toLocaleString()}` : '—', icon: 'contract', color: 'text-on-surface' },
            { label: 'Total Cost', value: booking.total_cost_usd ? `$${Number(booking.total_cost_usd).toLocaleString()}` : '—', icon: 'payments', color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="px-6 py-4 flex items-center gap-3">
              <span className={`material-symbols-outlined text-[18px] flex-shrink-0 ${s.color}`}>{s.icon}</span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">{s.label}</p>
                <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delay alerts */}
      {alerts.length > 0 && booking.purchase_order && (
        <DelayAlertsList
          poId={booking.purchase_order.id}
          alerts={alerts}
          onAcknowledge={loadBooking}
        />
      )}

      {/* Tabs */}
      <div className="glass-panel rounded-2xl border border-outline-variant/20 ambient-shadow overflow-hidden">
        <div className="px-8 py-4 border-b border-outline-variant/10 bg-surface-container-low flex items-center justify-between">
          <div className="flex gap-1 bg-surface-container rounded-xl p-1">
            {([
              { key: 'timeline', label: 'Shipment Timeline', icon: 'timeline' },
              { key: 'overview', label: 'Booking Details',   icon: 'info' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="p-8">
          {activeTab === 'timeline' && (
            <div data-test-id="shipment-milestones">
              {events.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-3">radar</span>
                  <p className="text-on-surface-variant text-sm italic">No tracking events recorded yet.</p>
                  {!tracking && (
                    <p className="text-on-surface-variant text-xs mt-2">This booking has no shipment tracking record. Tracking is created when the carrier confirms the booking.</p>
                  )}
                </div>
              ) : (
                <ShipmentTimeline events={events} />
              )}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

              {/* Carrier & Route */}
              <DetailCard title="Carrier & Route" icon="directions_boat" iconColor="bg-blue-50/80 text-blue-700">
                <InfoRow icon="business"     label="Carrier"           value={booking.carrier_name} highlight />
                <InfoRow icon="anchor"       label="Origin Port"       value={booking.origin_port} />
                <InfoRow icon="flag"         label="Destination Port"  value={booking.destination_port} />
                <InfoRow icon={transportIcon} label="Transport Mode"   value={booking.transport_mode?.replace('_', ' ').toUpperCase()} />
                <InfoRow icon="deployed_code" label="Container Type"   value={booking.container_type} />
              </DetailCard>

              {/* Documents */}
              <DetailCard title="Documents & Reference" icon="description" iconColor="bg-violet-50/80 text-violet-700">
                <InfoRow icon="tag"          label="Booking Reference" value={booking.booking_reference} highlight />
                <InfoRow icon="receipt"      label="BL Number"         value={booking.bl_number} />
                <InfoRow icon="flight"       label="AWB Number"        value={booking.awb_number} />
                {booking.carrier_api_source && (
                  <InfoRow icon="api"        label="API Source"        value={booking.carrier_api_source} />
                )}
              </DetailCard>

              {/* Dates */}
              <DetailCard title="Schedule" icon="calendar_month" iconColor="bg-amber-50/80 text-amber-700">
                <InfoRow icon="flight_takeoff" label="ETD"             value={formatDate(booking.etd)} />
                <InfoRow icon="flag"           label="ETA (Original)"  value={formatDate(booking.eta)} />
                {tracking?.carrier_eta && (
                  <InfoRow icon="radar"        label="Live ETA"        value={formatDate(tracking.carrier_eta.toString())} highlight />
                )}
                {transitDays !== null && (
                  <InfoRow icon="schedule"     label="Transit Time"    value={`${transitDays} days`} />
                )}
                <InfoRow icon="check_circle"   label="Confirmed At"    value={booking.carrier_confirmed_at ? formatDate(booking.carrier_confirmed_at) : null} />
              </DetailCard>

              {/* Financials */}
              <DetailCard title="Financials" icon="payments" iconColor="bg-emerald-50/80 text-emerald-700">
                <InfoRow icon="contract"     label="Agreed Rate"       value={booking.agreed_rate_usd ? `$${Number(booking.agreed_rate_usd).toLocaleString()}` : null} />
                <InfoRow icon="payments"     label="Total Cost"        value={booking.total_cost_usd ? `$${Number(booking.total_cost_usd).toLocaleString()}` : null} highlight />
                {booking.chargeable_weight_kg && (
                  <InfoRow icon="scale"      label="Chargeable Weight" value={`${booking.chargeable_weight_kg} kg`} />
                )}
              </DetailCard>

              {/* Live Tracking */}
              {tracking && (
                <DetailCard title="Live Tracking" icon="radar" iconColor="bg-primary/5 text-primary">
                  <InfoRow icon="radar"          label="Current Status"  value={tracking.current_status_code} highlight />
                  <InfoRow icon="directions_boat" label="Vessel"         value={tracking.vessel_name} />
                  <InfoRow icon="tag"            label="Voyage Number"   value={tracking.voyage_number} />
                  <InfoRow icon="schedule"       label="Last Updated"    value={tracking.updated_at ? formatDate(tracking.updated_at) : null} />
                </DetailCard>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="md:col-span-2 lg:col-span-1 rounded-2xl border border-outline-variant/20 bg-amber-50/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">sticky_note_2</span>
                    <p className="text-[11px] font-black uppercase tracking-widest text-amber-700">Notes</p>
                  </div>
                  <p className="text-sm text-on-surface leading-relaxed">{booking.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
