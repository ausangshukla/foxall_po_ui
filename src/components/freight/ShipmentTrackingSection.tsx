import { useState, useEffect } from 'react'
import type { ShipmentTracking } from '../../types/api'
import { ApiError } from '../../types/api'
import { shipmentTrackingsApi } from '../../api/shipment-trackings'
import { LoadingSpinner } from '../common'
import { ShipmentTimeline } from './ShipmentTimeline'
import { DelayAlertsList } from './DelayAlertsList'

interface Props {
  poId: number
  embedded?: boolean
}

export function ShipmentTrackingSection({ poId, embedded = false }: Props) {
  const [tracking, setTracking] = useState<ShipmentTracking | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const fetchTracking = async () => {
    try {
      const data = await shipmentTrackingsApi.getByPo(poId)
      setTracking(data)
    } catch (err) {
      if (!(err instanceof ApiError && err.code === 'NOT_FOUND')) {
        console.error('Failed to fetch shipment tracking', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTracking()
  }, [poId])

  if (loading) return <div className="p-8 text-center"><LoadingSpinner /></div>
  if (!tracking) return null

  const hasActiveAlerts = tracking.alerts?.some(a => !a.acknowledged_at)
  const API_CARRIER_SOURCES = ['maersk', 'hapag_lloyd']
  const isApiTracking = API_CARRIER_SOURCES.includes((tracking.carrier_api_source || '').toLowerCase())

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Active Alerts */}
      <DelayAlertsList 
        poId={poId} 
        alerts={tracking.alerts || []} 
        onAcknowledge={fetchTracking} 
      />

      {/* Tracking Summary Card */}
      <section className="glass-panel ambient-shadow rounded-xl border border-outline-variant/20 overflow-hidden">
        <div className="px-8 py-5 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">analytics</span>
            <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">
              {isApiTracking ? 'Live Shipment Status' : 'Shipment Status'}
            </h2>
            {!isApiTracking && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide rounded">Manual Updates</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
              Last updated: {tracking.updated_at ? new Date(tracking.updated_at).toLocaleString() : 'Just now'}
            </span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
            >
              {isExpanded ? 'Hide Details' : 'Show Full Timeline'}
              <span className="material-symbols-outlined text-sm">
                {isExpanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Current Status</p>
              <p className="font-extrabold text-on-surface text-xl tracking-tight">
                {tracking.current_status_code.replace(/_/g, ' ')}
              </p>
              <p className="text-xs text-on-surface-variant">
                {tracking.current_location_unlocode || 'In Transit'}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Vessel / Voyage</p>
              <p className="font-bold text-on-surface">
                {tracking.vessel_name || 'TBD'}
              </p>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-on-surface-variant">
                  {tracking.vessel_imo ? `IMO: ${tracking.vessel_imo}` : ''}
                </p>
                {tracking.vessel_latitude && tracking.vessel_longitude && (
                  <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    {tracking.vessel_latitude.toFixed(4)}, {tracking.vessel_longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Live ETA</p>
              <p className={`font-extrabold text-xl tracking-tight ${hasActiveAlerts ? 'text-error' : 'text-primary'}`}>
                {tracking.carrier_eta || 'Pending'}
              </p>
              {tracking.predicted_eta && tracking.predicted_eta !== tracking.carrier_eta && (
                <p className="text-[10px] text-tertiary font-bold">
                  PREDICTED: {tracking.predicted_eta}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Customs / Free Time</p>
              <p className="font-bold text-on-surface uppercase text-sm">
                {tracking.customs_status.replace(/_/g, ' ')}
              </p>
              {tracking.free_time_expiry && (
                <p className="text-xs text-error font-medium">
                  Free time ends: {tracking.free_time_expiry}
                </p>
              )}
            </div>
          </div>

          {!isApiTracking && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">info</span>
              <p className="text-slate-600 text-sm">Live tracking is not available for this carrier. Contact the carrier directly for status updates.</p>
            </div>
          )}

          {isExpanded && (
            <div className="mt-12 pt-12 border-t border-outline-variant/10 animate-in fade-in duration-500">
              <h3 className="text-on-surface-variant text-[10px] uppercase tracking-widest font-black mb-8">Shipment Milestones</h3>
              <ShipmentTimeline events={tracking.events || []} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
