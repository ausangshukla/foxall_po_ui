import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { shipmentTrackingsApi } from '../../api/shipment-trackings'
import type { DelayAlert } from '../../types/api'
import { LoadingSpinner } from '../common'

export function DelayAlertsWidget() {
  const [alerts, setAlerts] = useState<DelayAlert[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await shipmentTrackingsApi.getAllAlerts()
        // Filter for unacknowledged alerts
        setAlerts(data.filter(a => !a.acknowledged_at))
      } catch (err) {
        console.error('Failed to fetch dashboard alerts', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  if (loading) return <div className="p-4"><LoadingSpinner /></div>
  if (alerts.length === 0) return null

  return (
    <section className="mb-16 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-error">notification_important</span>
        <h2 className="text-xl font-extrabold text-on-surface-variant uppercase tracking-tighter">Urgent Shipment Alerts</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.slice(0, 4).map((alert) => (
          <div 
            key={alert.id}
            onClick={() => navigate(`/purchase-orders/${alert.purchase_order_id}`)}
            className={`cursor-pointer p-6 rounded-2xl border flex items-start gap-4 transition-all hover:scale-[1.01] hover:shadow-lg ${
              alert.severity === 'critical' || alert.severity === 'high' 
                ? 'bg-error-container/10 border-error/20' 
                : 'bg-tertiary-container/10 border-tertiary/20'
            }`}
          >
            <div className={`p-3 rounded-xl ${
              alert.severity === 'critical' || alert.severity === 'high' ? 'bg-error text-on-error' : 'bg-tertiary text-on-tertiary'
            }`}>
              <span className="material-symbols-outlined">
                {alert.alert_type === 'eta_change' ? 'event_busy' : 'warning'}
              </span>
            </div>
            
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-1">
                <p className="font-extrabold text-on-surface text-sm">PO #{alert.purchase_order_id} Shipment Delay</p>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant leading-snug">
                {alert.delay_reason_text || `ETA changed to ${alert.revised_eta}.`}
                {alert.delay_days && alert.delay_days > 0 && ` (${alert.delay_days} day delay)`}
              </p>
              <div className="mt-4 flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest">
                <span>View Details</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
