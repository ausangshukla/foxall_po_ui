import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/common'
import { freightBookingsApi } from '../../api/freight-bookings'
import type { FreightBookingWithSummary } from '../../types/api'

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

const TRACKING_ICONS: Record<string, string> = {
  GTIN: 'login',
  LOAD: 'archive',
  DEPA: 'directions_boat',
  ARRI: 'location_on',
  GTOT: 'logout',
  DELY: 'schedule',
  HOLD: 'lock',
}

const ALL_STATUSES = Object.keys(STATUS_LABELS)

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

function TrackingBadge({ code }: { code: string | null }) {
  if (!code) return <span className="text-on-surface-variant text-xs">—</span>
  const icon = TRACKING_ICONS[code] ?? 'radio_button_checked'
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
      <span className="material-symbols-outlined text-[13px]">{icon}</span>
      {code}
    </span>
  )
}

export function FreightBookingListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()

  const [bookings, setBookings] = useState<FreightBookingWithSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const handleExport = async () => {
    try {
      await freightBookingsApi.export(statusFilter !== 'all' ? { status: statusFilter } : undefined)
    } catch (err: any) {
      console.error('Failed to export freight bookings:', err)
    }
  }

  useEffect(() => {
    if (!isAuth) return
    setLoading(true)
    freightBookingsApi
      .list(statusFilter !== 'all' ? { status: statusFilter } : undefined)
      .then(setBookings)
      .catch(() => setError('Failed to load freight bookings.'))
      .finally(() => setLoading(false))
  }, [isAuth, statusFilter])

  if (!isAuth) return <LoadingSpinner />

  const filtered = search.trim()
    ? bookings.filter(b =>
        b.po_number?.toLowerCase().includes(search.toLowerCase()) ||
        b.booking_reference?.toLowerCase().includes(search.toLowerCase()) ||
        b.carrier_name?.toLowerCase().includes(search.toLowerCase())
      )
    : bookings

  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
  const pendingCount   = bookings.filter(b => b.status === 'pending_carrier_confirmation').length
  const alertsCount    = bookings.reduce((sum, b) => sum + (b.active_delay_alerts ?? 0), 0)

  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1">Logistics</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-primary-container">Freight Bookings</h1>
          <p className="text-on-surface-variant text-sm mt-1">All shipment bookings across purchase orders</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined">file_download</span>
          <span>Export</span>
        </button>
      </header>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: bookings.length, icon: 'inventory_2', color: 'text-primary' },
          { label: 'Confirmed',      value: confirmedCount,  icon: 'check_circle', color: 'text-emerald-600' },
          { label: 'Pending',        value: pendingCount,    icon: 'pending',      color: 'text-amber-600' },
          { label: 'Active Alerts',  value: alertsCount,     icon: 'warning',      color: 'text-error' },
        ].map(s => (
          <div key={s.label} className="glass-panel rounded-xl p-6 border border-outline-variant/20 ambient-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
            </div>
            <p className="text-2xl font-extrabold text-on-surface">{s.value}</p>
            <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            placeholder="Search PO number, booking ref, carrier…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'}`}
          >
            All
          </button>
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {error && (
        <div className="p-4 bg-error-container/20 text-error rounded-xl text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-16 text-center border border-outline-variant/20">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4 block">directions_boat</span>
          <p className="text-on-surface-variant font-medium">No freight bookings found.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-outline-variant/20 ambient-shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                {['PO Number', 'Carrier', 'Route', 'Booking Ref', 'ETD', 'ETA', 'Status', 'Tracking', 'Alerts'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filtered.map(b => (
                <tr
                  key={b.id}
                  onClick={() => navigate(`/freight-bookings/${b.id}`)}
                  className="hover:bg-surface-container/50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-4">
                    <span className="font-bold text-primary hover:underline">{b.po_number ?? '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {b.carrier_api_source && (
                        <span className="px-1.5 py-0.5 bg-primary-container/30 text-primary text-[9px] font-black uppercase rounded">API</span>
                      )}
                      <span className="font-medium">{b.carrier_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <span className="font-bold text-on-surface">{b.origin_port}</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      <span className="font-bold text-on-surface">{b.destination_port}</span>
                    </span>
                    <span className="text-[10px] text-on-surface-variant uppercase mt-0.5 block">
                      {b.transport_mode?.replace('_', ' ')} {b.container_type ? `· ${b.container_type}` : ''}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{b.booking_reference ?? '—'}</td>
                  <td className="px-5 py-4 text-on-surface-variant">{b.etd ? new Date(b.etd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                  <td className="px-5 py-4 text-on-surface-variant">{b.eta ? new Date(b.eta).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                  <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-5 py-4"><TrackingBadge code={b.tracking_status} /></td>
                  <td className="px-5 py-4">
                    {(b.active_delay_alerts ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-error text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]">warning</span>
                        {b.active_delay_alerts}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
