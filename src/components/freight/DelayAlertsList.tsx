import type { DelayAlert } from '../../types/api'
import { shipmentTrackingsApi } from '../../api/shipment-trackings'
import { useState } from 'react'

interface Props {
  poId: number
  alerts: DelayAlert[]
  onAcknowledge: () => void
}

export function DelayAlertsList({ poId, alerts, onAcknowledge }: Props) {
  const [isAcknowledging, setIsAcknowledging] = useState<number | null>(null)

  if (!alerts || alerts.length === 0) return null

  const activeAlerts = alerts.filter(a => !a.acknowledged_at)
  if (activeAlerts.length === 0) return null

  const handleAcknowledge = async (alertId: number) => {
    try {
      setIsAcknowledging(alertId)
      await shipmentTrackingsApi.acknowledgeAlert(poId, alertId)
      onAcknowledge()
    } catch (err) {
      console.error('Failed to acknowledge alert', err)
    } finally {
      setIsAcknowledging(null)
    }
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-error text-on-error'
      case 'high': return 'bg-error-container text-on-error-container border-error/20'
      case 'medium': return 'bg-tertiary-container text-on-tertiary-container border-tertiary/20'
      default: return 'bg-surface-container text-on-surface border-outline-variant/20'
    }
  }

  return (
    <div className="space-y-4 mb-8">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          data-test-id="delay-alert"
          className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 ${getSeverityStyles(alert.severity)}`}
        >
          <div className="flex items-start gap-4">
            <span className="material-symbols-outlined mt-1">
              {alert.alert_type === 'eta_change' ? 'event_busy' : 'warning'}
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-extrabold uppercase tracking-tight">
                  {alert.alert_type === 'eta_change' ? 'Shipment Delay Detected' : 'Shipment Alert'}
                </p>
                <span className="text-[10px] font-black bg-black/10 px-2 py-0.5 rounded uppercase">
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm font-medium opacity-90">
                {alert.delay_reason_text || `ETA changed from ${alert.original_eta || 'TBD'} to ${alert.revised_eta}.`}
                {alert.delay_days && alert.delay_days > 0 && ` (${alert.delay_days} day delay)`}
              </p>
              {alert.impact_on_delivery_date && (
                <p className="text-[10px] font-bold mt-2 flex items-center gap-1 text-error">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  IMPACT ON PO DELIVERY DATE
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={() => handleAcknowledge(alert.id)}
            disabled={isAcknowledging === alert.id}
            className="px-6 py-2.5 bg-on-surface text-surface font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isAcknowledging === alert.id ? 'Acknowledging...' : 'Acknowledge'}
          </button>
        </div>
      ))}
    </div>
  )
}
