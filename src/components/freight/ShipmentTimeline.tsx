import type { ShipmentEvent } from '../../types/api'

interface Props {
  events: ShipmentEvent[]
}

export function ShipmentTimeline({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center bg-surface-container-low rounded-2xl border border-outline-variant/10">
        <p className="text-on-surface-variant text-sm italic">No tracking events recorded yet.</p>
      </div>
    )
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEventIcon = (category: string) => {
    switch (category) {
      case 'transport': return 'local_shipping'
      case 'equipment': return 'inventory_2'
      case 'customs': return 'gavel'
      case 'document': return 'description'
      case 'exception': return 'warning'
      default: return 'radio_button_checked'
    }
  }

  const getEventColor = (category: string) => {
    switch (category) {
      case 'exception': return 'text-error bg-error-container/20'
      case 'customs': return 'text-tertiary bg-tertiary-container/20'
      case 'transport': return 'text-primary bg-primary-container/20'
      default: return 'text-on-surface-variant bg-surface-variant/20'
    }
  }

  return (
    <div className="relative space-y-8 pl-8 before:absolute before:inset-y-0 before:left-[15px] before:w-0.5 before:bg-outline-variant/30">
      {events.map((event) => (
        <div key={event.id} data-test-id="shipment-event" className="relative">
          <div className={`absolute -left-[32px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface ${getEventColor(event.event_category)}`}>
            <span className="material-symbols-outlined text-sm">
              {getEventIcon(event.event_category)}
            </span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-on-surface">{event.event_description}</p>
                <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  event.event_time_type === 'actual' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {event.event_time_type}
                </span>
                {event.raw_source === 'manual_logistics' && (
                  <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[11px]">link</span>
                    Shipper
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                {event.location_name && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {event.location_name} {event.location_unlocode ? `(${event.location_unlocode})` : ''}
                  </div>
                )}
                {event.vessel_name && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">directions_boat</span>
                    {event.vessel_name}
                  </div>
                )}
                {event.container_number && (
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                    {event.container_number}
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <p className="text-sm font-black text-on-surface">{formatDateTime(event.event_time)}</p>
              {event.new_eta && (
                <p className="text-[10px] text-primary font-bold mt-1">
                  NEW ETA: {new Date(event.new_eta).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
