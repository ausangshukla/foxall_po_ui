import { useState } from 'react'
import { FreightBookingBanner } from './FreightBookingBanner'
import { FreightBookingCard } from './FreightBookingCard'
import { ShipmentTrackingSection } from './ShipmentTrackingSection'

const FREIGHT_STATES = ['freight_booked', 'in_transit', 'picked_up', 'shipped', 'out_for_delivery', 'received', 'completed']
const TRACKING_STATES = ['in_transit', 'picked_up', 'shipped', 'out_for_delivery', 'received', 'completed']

interface Props {
  poId: number
  poStateCode: string
  onStateChange: () => void
}

export function FreightSection({ poId, poStateCode, onStateChange }: Props) {
  const [activeTab, setActiveTab] = useState<'booking' | 'tracking'>('booking')

  const isReadyForBooking = poStateCode === 'goods_ready_approved'
  const isFreightState = FREIGHT_STATES.includes(poStateCode)

  if (!isReadyForBooking && !isFreightState) return null

  const hasTracking = TRACKING_STATES.includes(poStateCode)

  return (
    <div className="space-y-6">
      {/* 
         If in a freight state but booking record is missing, 
         the Banner will show a "Create Booking" trigger.
      */}
      <FreightBookingBanner poId={poId} poStateCode={poStateCode} onConfirm={onStateChange} />
      
      {isFreightState && (
        <div className="glass-panel rounded-3xl ambient-shadow border border-outline-variant/20 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section header */}
          <div className="px-8 py-5 border-b border-outline-variant/10 bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">directions_boat</span>
              <h2 className="text-lg font-extrabold text-on-surface tracking-tight">Freight & Shipment</h2>
            </div>

            {hasTracking && (
              <div className="flex gap-1 bg-surface-container rounded-xl p-1">
                <TabButton
                  label="Booking"
                  icon="receipt_long"
                  active={activeTab === 'booking'}
                  onClick={() => setActiveTab('booking')}
                />
                <TabButton
                  label="Live Tracking"
                  icon="radar"
                  active={activeTab === 'tracking'}
                  onClick={() => setActiveTab('tracking')}
                />
              </div>
            )}
          </div>

          <div className="p-8">
            {(!hasTracking || activeTab === 'booking') && (
              <FreightBookingCard poId={poId} onUpdate={onStateChange} />
            )}
            {hasTracking && activeTab === 'tracking' && (
              <ShipmentTrackingSection poId={poId} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
        active
          ? 'bg-primary text-on-primary shadow-sm'
          : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </button>
  )
}
