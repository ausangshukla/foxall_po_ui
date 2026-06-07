import { useState } from 'react'
import { useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner } from '../../components/common'

type GuideId = 'getting-started' | 'purchase-orders' | 'freight-bookings' | 'states-transitions' | 'notifications-admin'

interface Section {
  id: string
  heading: string
  level: 1 | 2 | 3
  content: React.ReactNode
}

interface Guide {
  id: GuideId
  title: string
  icon: string
  description: string
  sections: Section[]
}

// ─── Typography helpers ───────────────────────────────────────────────────────

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-extrabold tracking-tight text-on-primary-container mt-10 mb-4 pb-2 border-b border-outline-variant/20">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-extrabold text-on-surface mt-6 mb-3">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-on-surface-variant leading-relaxed mb-4">{children}</p>
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1.5 mb-4 text-sm text-on-surface-variant">{children}</ul>
}

function OL({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal list-inside space-y-1.5 mb-4 text-sm text-on-surface-variant">{children}</ol>
}

function LI({ children }: { children: React.ReactNode }) {
  return <li className="leading-relaxed">{children}</li>
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="px-1.5 py-0.5 bg-surface-container-high rounded text-xs font-mono text-on-surface">{children}</code>
}

function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="p-4 bg-surface-container-high rounded-xl text-xs font-mono text-on-surface overflow-x-auto mb-4 leading-relaxed border border-outline-variant/20">
      {children}
    </pre>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto mb-6 rounded-xl border border-outline-variant/20">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-container-low">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/20">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-surface-container-low/50 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-on-surface-variant leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InfoBox({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-primary-container/20 border border-primary-container/30 mb-6 flex gap-3">
      <span className="material-symbols-outlined text-primary mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        {title && <p className="text-sm font-bold text-on-primary-container mb-1">{title}</p>}
        <div className="text-sm text-on-surface-variant leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

// ─── Diagram primitives ───────────────────────────────────────────────────────

function DiagramWrap({ children, label }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="my-6 rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 overflow-hidden">
      {label && (
        <div className="px-4 py-2 bg-surface-container-low border-b border-outline-variant/10">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">{label}</p>
        </div>
      )}
      <div className="p-5 overflow-x-auto">{children}</div>
    </div>
  )
}

type StateCategory = 'open' | 'transit' | 'closed' | 'exception' | 'service' | 'neutral'

function stateStyle(cat: StateCategory): string {
  switch (cat) {
    case 'open':     return 'bg-primary-container/30 text-on-primary-container border-primary-container/50'
    case 'transit':  return 'bg-secondary-container/40 text-on-secondary-container border-secondary-container/60'
    case 'closed':   return 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'
    case 'exception': return 'bg-error-container/30 text-error border-error-container/50'
    case 'service':  return 'bg-tertiary-container/30 text-on-tertiary-container border-tertiary-container/50'
    default:         return 'bg-surface-container text-on-surface border-outline-variant/30'
  }
}

function StateChip({ label, cat = 'neutral', sub }: { label: string; cat?: StateCategory; sub?: string }) {
  return (
    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap flex-shrink-0 ${stateStyle(cat)}`}>
      <span>{label}</span>
      {sub && <span className="block text-[10px] font-light opacity-70">{sub}</span>}
    </div>
  )
}

function Arrow({ label, down }: { label?: string; down?: boolean }) {
  return (
    <div className={`flex ${down ? 'flex-col' : 'flex-row'} items-center justify-center flex-shrink-0 gap-0.5`}>
      {label && <span className="text-[10px] text-on-surface-variant font-light leading-none whitespace-nowrap">{label}</span>}
      <span className="material-symbols-outlined text-on-surface-variant/50 text-base">
        {down ? 'arrow_downward' : 'arrow_forward'}
      </span>
    </div>
  )
}

function ServiceBox({ icon, label, sublabel, color }: { icon: string; label: string; sublabel?: string; color?: string }) {
  return (
    <div className={`rounded-xl border p-3 flex flex-col items-center text-center gap-1 flex-shrink-0 min-w-[90px] ${color ?? 'bg-surface-container border-outline-variant/30'}`}>
      <span className="material-symbols-outlined text-xl text-primary">{icon}</span>
      <span className="text-xs font-bold text-on-surface leading-tight">{label}</span>
      {sublabel && <span className="text-[10px] text-on-surface-variant leading-tight">{sublabel}</span>}
    </div>
  )
}

function SeqActor({ label, icon }: { label: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 w-28 flex-shrink-0">
      <div className="w-9 h-9 rounded-full bg-primary-container/40 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-[18px]">{icon ?? 'person'}</span>
      </div>
      <span className="text-[10px] font-bold text-on-surface-variant text-center leading-tight">{label}</span>
    </div>
  )
}

function SeqMessage({ from, to, label, type = 'sync', note }: {
  from: number; to: number; label: string; type?: 'sync' | 'async' | 'response'; note?: string
}) {
  const isLeft = from < to
  return (
    <div className="flex items-center px-2 py-1.5 gap-2 border-l-2 border-primary-container/20 ml-4">
      <div className={`h-0.5 flex-1 ${type === 'async' ? 'border-t-2 border-dashed border-secondary/40' : type === 'response' ? 'border-t-2 border-dashed border-on-surface-variant/30' : 'border-t-2 border-primary/30'} ${isLeft ? '' : 'order-last'}`} />
      <div className="text-center">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${type === 'async' ? 'bg-secondary-container/40 text-on-secondary-container' : type === 'response' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary-container/30 text-on-primary-container'}`}>
          {label}
        </span>
        {note && <p className="text-[9px] text-on-surface-variant mt-0.5 italic">{note}</p>}
      </div>
    </div>
  )
}

// ─── Specific diagram components ──────────────────────────────────────────────

function SystemArchDiagram() {
  return (
    <DiagramWrap label="System Architecture">
      <div className="flex flex-col gap-4">
        {/* Top layer: UIs */}
        <div className="flex justify-center gap-4">
          <ServiceBox icon="computer" label="React UI" sublabel="foxall_po_ui" color="bg-primary-container/20 border-primary-container/40" />
          <ServiceBox icon="link" label="Magic Link" sublabel="Seller / Docs page" color="bg-tertiary-container/20 border-tertiary-container/40" />
        </div>
        {/* Arrow down */}
        <div className="flex justify-center"><Arrow down label="JWT + REST" /></div>
        {/* Middle: Rails API */}
        <div className="flex justify-center">
          <ServiceBox icon="dns" label="Rails 8.1 API" sublabel="foxall_po_rails" color="bg-primary-container/30 border-primary-container/50" />
        </div>
        {/* Arrow down */}
        <div className="flex justify-center"><Arrow down /></div>
        {/* Lower: DB + Queue */}
        <div className="flex justify-center gap-4">
          <ServiceBox icon="database" label="PostgreSQL" sublabel="All data" color="bg-surface-container border-outline-variant/30" />
          <ServiceBox icon="pending_actions" label="solid_queue" sublabel="Background jobs" color="bg-surface-container border-outline-variant/30" />
        </div>
        {/* Arrow down */}
        <div className="flex justify-center"><Arrow down label="async jobs" /></div>
        {/* Bottom: External services */}
        <div className="flex justify-center gap-3 flex-wrap">
          <ServiceBox icon="flight_takeoff" label="Bird API" sublabel="Shipping tracking" color="bg-secondary-container/20 border-secondary-container/40" />
          <ServiceBox icon="mail" label="Action Mailer" sublabel="Email delivery" color="bg-secondary-container/20 border-secondary-container/40" />
          <ServiceBox icon="chat" label="WhatsApp API" sublabel="Notifications" color="bg-secondary-container/20 border-secondary-container/40" />
          <ServiceBox icon="webhook" label="Webhooks" sublabel="Carrier push events" color="bg-secondary-container/20 border-secondary-container/40" />
        </div>
      </div>
    </DiagramWrap>
  )
}

function POStateMachineDiagram() {
  return (
    <DiagramWrap label="Default PO Workflow (configurable per entity)">
      <div className="flex flex-col gap-3">
        {/* Legend */}
        <div className="flex gap-3 mb-1 flex-wrap">
          {([['open', 'Open'], ['transit', 'In Transit'], ['closed', 'Closed'], ['exception', 'Exception']] as [StateCategory, string][]).map(([cat, lbl]) => (
            <div key={cat} className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stateStyle(cat)}`}>{lbl}</div>
          ))}
        </div>
        {/* Happy path */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <StateChip label="Draft" cat="open" />
          <Arrow />
          <StateChip label="Pending" cat="open" />
          <Arrow label="Approve" />
          <StateChip label="Approved" cat="open" />
          <Arrow label="Send to Seller" />
          <StateChip label="Sent to Seller" cat="open" />
          <Arrow label="Seller Confirms" />
          <StateChip label="Seller Confirmed" cat="open" />
          <Arrow label="Book Freight" />
          <StateChip label="Ready to Ship" cat="transit" />
          <Arrow label="Docs OK" />
          <StateChip label="Shipped" cat="transit" />
          <Arrow label="Received" />
          <StateChip label="Received ✓" cat="closed" />
        </div>
        {/* Exception / branch paths */}
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-error-container/30">
          <p className="text-[10px] font-bold uppercase tracking-widest text-error/60 mb-1">Exception paths</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StateChip label="Pending" cat="open" />
            <Arrow label="Reject" />
            <StateChip label="Rejected" cat="exception" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StateChip label="Sent to Seller" cat="open" />
            <Arrow label="Seller Rejects" />
            <StateChip label="Seller Rejected" cat="exception" />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StateChip label="Sent to Seller" cat="open" />
            <Arrow label="Partial Confirm" />
            <StateChip label="Seller Partial" cat="open" />
            <Arrow label="Request Correction" />
            <StateChip label="Correction Requested" cat="exception" />
            <Arrow label="Re-send ↺" />
            <StateChip label="Sent to Seller" cat="open" />
          </div>
        </div>
      </div>
    </DiagramWrap>
  )
}

function SellerConfirmationDiagram() {
  return (
    <DiagramWrap label="Seller Confirmation Sequence">
      <div className="flex flex-col gap-0">
        {/* Actors row */}
        <div className="flex gap-2 justify-between mb-4">
          <SeqActor label="Buyer" icon="person" />
          <SeqActor label="Rails API" icon="dns" />
          <SeqActor label="solid_queue" icon="pending_actions" />
          <SeqActor label="Seller" icon="storefront" />
        </div>
        {/* Messages */}
        <SeqMessage from={0} to={1} label='Click "Send to Seller"' />
        <SeqMessage from={1} to={1} label="Transition PO → sent_to_seller · Generate magic link token" type="sync" />
        <SeqMessage from={1} to={2} label="Enqueue NotificationRouterJob" type="async" />
        <SeqMessage from={2} to={3} label="Email / WhatsApp with magic link" type="async" note="Link expires after N minutes (set per state)" />
        <SeqMessage from={3} to={1} label="Seller opens link" type="sync" />
        <SeqMessage from={1} to={3} label="Return PO details + line items" type="response" />
        {/* Alt responses */}
        <div className="ml-4 mt-2 mb-2 rounded-xl border border-outline-variant/20 overflow-hidden">
          <div className="bg-surface-container-low px-3 py-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">alt  Seller response</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stateStyle('open')}`}>Confirm</span>
              <span className="text-[10px] text-on-surface-variant">→ PO transitions to Seller Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stateStyle('open')}`}>Partial</span>
              <span className="text-[10px] text-on-surface-variant">→ Updated line item quantities/prices · PO → Seller Confirmed (Partial)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${stateStyle('exception')}`}>Reject</span>
              <span className="text-[10px] text-on-surface-variant">→ Comment required · PO → Seller Rejected</span>
            </div>
          </div>
        </div>
        <SeqMessage from={1} to={2} label="Enqueue buyer notification" type="async" />
        <SeqMessage from={2} to={0} label="Email: seller has responded" type="async" />
        <SeqMessage from={0} to={1} label="View updated PO with response card" type="response" />
      </div>
    </DiagramWrap>
  )
}

function DocumentOwnershipDiagram() {
  return (
    <DiagramWrap label="Document Upload Responsibility">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-xl border p-4 ${stateStyle('open')}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-lg">person</span>
            <span className="text-xs font-extrabold uppercase tracking-wider">Buyer uploads</span>
          </div>
          <p className="text-[10px] text-on-surface-variant mb-2">At PO creation or edit time</p>
          {['PO Document', 'Spec Sheet', 'MSDS', 'Sample Approval'].map((d) => (
            <div key={d} className="flex items-center gap-2 py-1">
              <span className="material-symbols-outlined text-primary text-sm">description</span>
              <span className="text-xs">{d}</span>
            </div>
          ))}
        </div>
        <div className={`rounded-xl border p-4 ${stateStyle('service')}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-tertiary text-lg">storefront</span>
            <span className="text-xs font-extrabold uppercase tracking-wider">Supplier uploads</span>
          </div>
          <p className="text-[10px] text-on-tertiary-container mb-2">Via magic link when PO → ready_to_ship</p>
          {['Commercial Invoice', 'Packing List', 'Dangerous Goods Decl.', 'Certificate of Origin', 'Misc Shipment Docs'].map((d) => (
            <div key={d} className="flex items-center gap-2 py-1">
              <span className="material-symbols-outlined text-tertiary text-sm">description</span>
              <span className="text-xs">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </DiagramWrap>
  )
}

function BookingStatusFlowDiagram() {
  return (
    <DiagramWrap label="Freight Booking Status Flow">
      <div className="flex items-start gap-2 flex-wrap">
        <div className="flex flex-col gap-2">
          <StateChip label="Draft" cat="neutral" sub="created" />
          <div className="flex gap-2 pl-4">
            <Arrow down />
            <div className="flex flex-col gap-1.5 mt-1">
              <StateChip label="Rate Applied" cat="open" sub="best rate matched" />
              <Arrow down />
              <StateChip label="Pending Carrier Confirmation" cat="open" sub="sent to carrier" />
              <Arrow down />
              <div className="flex gap-3 flex-wrap">
                <div className="flex flex-col gap-1.5">
                  <StateChip label="Confirmed ✓" cat="closed" sub="carrier confirmed" />
                  <div className="flex gap-2 pl-4">
                    <Arrow down />
                    <StateChip label="ETD Changed" cat="exception" sub="schedule change" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <StateChip label="Cancelled" cat="exception" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DiagramWrap>
  )
}

function FreightBackendDiagram() {
  return (
    <DiagramWrap label="Backend: PO → Freight Booking → Live Tracking">
      <div className="flex flex-col gap-2 items-center">
        <StateChip label="PO transitions → ready_to_ship category" cat="transit" />
        <Arrow down label="post-transition action: create_freight_booking" />
        <StateChip label="FreightBooking record created" cat="open" />
        <Arrow down />

        {/* Branch: api vs manual */}
        <div className="flex gap-6 justify-center flex-wrap">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-on-surface-variant font-bold border border-outline-variant/30 rounded px-2 py-0.5">carrier_booking_workflow = api</span>
            <Arrow down />
            <StateChip label="Bird API called" cat="service" />
            <Arrow down />
            <StateChip label="Pending Carrier Confirmation" cat="open" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-on-surface-variant font-bold border border-outline-variant/30 rounded px-2 py-0.5">carrier_booking_workflow = manual</span>
            <Arrow down />
            <StateChip label="Draft — manual booking" cat="neutral" />
          </div>
        </div>

        <Arrow down label="solid_queue cron" />

        {/* Polling + Webhooks */}
        <div className="flex gap-4 justify-center flex-wrap">
          <div className="flex flex-col items-center gap-1.5">
            <StateChip label="PollShippingStatusJob" cat="service" sub="runs periodically" />
            <Arrow down label="Bird API fetch" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <StateChip label="ProcessWebhookJob" cat="service" sub="carrier push events" />
            <Arrow down label="near real-time" />
          </div>
        </div>

        <StateChip label="Timeline milestones + ETA updated" cat="open" />
        <Arrow down label="if ETA shifts" />
        <div className="flex gap-3 flex-wrap justify-center">
          <StateChip label="DelayAlert created" cat="exception" />
          <StateChip label="Banner on PO page" cat="exception" />
          <StateChip label="Logistics notified" cat="exception" />
        </div>
      </div>
    </DiagramWrap>
  )
}

function TransitionEnforcementDiagram() {
  return (
    <DiagramWrap label="Transition Enforcement: Browser → API → Database">
      <div className="flex flex-col gap-2 items-center">
        <StateChip label="Buyer clicks action button" cat="neutral" />
        <Arrow down label='POST /api/v1/purchase_orders/:id/transition' />
        <StateChip label="PoTransitionsController" cat="service" sub="authenticate JWT · Pundit authorize" />
        <Arrow down />
        <StateChip label="PoTransitionService" cat="service" />
        <Arrow down />

        {/* Validation steps */}
        <div className="w-full max-w-sm border border-outline-variant/20 rounded-xl overflow-hidden">
          <div className="bg-surface-container-low px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">Validation steps</div>
          {[
            'Load PoTransitionRule (from_state, to_state)',
            'Check user.roles ∩ allowed_roles ≠ ∅',
            'PoTransitionContract (comment required?)',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 border-t border-outline-variant/10">
              <span className="w-4 h-4 rounded-full bg-primary-container text-on-primary-container text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="text-xs text-on-surface-variant">{step}</span>
            </div>
          ))}
        </div>

        <Arrow down />
        <div className="flex gap-4 flex-wrap justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold text-primary border border-primary-container/50 bg-primary-container/20 rounded px-2 py-0.5">✓ Valid</span>
            <Arrow down />
            <StateChip label="UPDATE po SET po_state_id" cat="open" />
            <Arrow down />
            <StateChip label="PoTransitionAttempt (success)" cat="closed" />
            <Arrow down />
            <StateChip label="NotificationRouterJob enqueued" cat="service" />
            <Arrow down />
            <StateChip label="PostTransitionActions run in order" cat="service" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-bold text-error border border-error-container/50 bg-error-container/20 rounded px-2 py-0.5">✗ Invalid</span>
            <Arrow down />
            <StateChip label="PoTransitionAttempt (failed)" cat="exception" />
            <Arrow down />
            <StateChip label="Error message → Audit Log" cat="exception" />
          </div>
        </div>
      </div>
    </DiagramWrap>
  )
}

function NotificationPipelineDiagram() {
  return (
    <DiagramWrap label="Notification Delivery Pipeline">
      <div className="flex flex-col gap-2 items-center">
        <StateChip label="PO state transition completes" cat="open" />
        <Arrow down />
        <StateChip label="NotificationRouterJob enqueued (solid_queue)" cat="service" />
        <Arrow down label="queries NotificationRules for (entity_id, po_state_id)" />
        <div className="flex gap-3 flex-wrap justify-center">
          <StateChip label="Rule 1: seller / email" cat="neutral" />
          <StateChip label="Rule 2: seller / whatsapp" cat="neutral" />
          <StateChip label="Rule 3: buyer / email" cat="neutral" />
          <StateChip label="Rule N: …" cat="neutral" />
        </div>
        <Arrow down label="for each matching rule" />
        <StateChip label="noticed Notification record created" cat="service" />
        <Arrow down />
        <div className="flex gap-4 flex-wrap justify-center">
          <div className="flex flex-col items-center gap-1.5">
            <StateChip label="Email" cat="open" sub="EmailNotificationJob" />
            <Arrow down />
            <StateChip label="Action Mailer → SMTP" cat="service" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <StateChip label="WhatsApp" cat="open" sub="noticed adapter" />
            <Arrow down />
            <StateChip label="WhatsApp Business API" cat="service" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <StateChip label="SMS" cat="open" sub="noticed adapter" />
            <Arrow down />
            <StateChip label="SMS gateway" cat="service" />
          </div>
        </div>
        <div className="mt-2 text-[10px] text-on-surface-variant text-center">Failures retry with solid_queue's default retry policy</div>
      </div>
    </DiagramWrap>
  )
}

function EntitySetupDiagram() {
  const steps = [
    { icon: 'corporate_fare', label: 'Create Entity', sub: 'More → Entities' },
    { icon: 'account_tree', label: 'Create PoStates', sub: 'More → States' },
    { icon: 'rule', label: 'Create Transition Rules', sub: 'More → Transitions' },
    { icon: 'notifications', label: 'Create Notification Rules', sub: 'More → Rules' },
    { icon: 'storefront', label: 'Add External Parties', sub: 'More → Parties' },
    { icon: 'group', label: 'Invite Users', sub: 'More → Users' },
    { icon: 'tune', label: 'Define Custom Fields', sub: 'More → Custom Fields' },
  ]
  return (
    <DiagramWrap label="New Entity Setup Checklist">
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/20 hover:bg-primary-container/10 transition-colors">
              <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">{step.icon}</span>
              <div>
                <p className="text-sm font-bold text-on-surface">{step.label}</p>
                <p className="text-[10px] text-on-surface-variant">{step.sub}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-0.5">
                <span className="material-symbols-outlined text-outline-variant text-sm">arrow_downward</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </DiagramWrap>
  )
}

// ─── Guide content ────────────────────────────────────────────────────────────

const GUIDES: Guide[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket_launch',
    description: 'Roles, login, navigation, and multi-tenancy',
    sections: [
      {
        id: 'who-uses',
        heading: 'Who Uses This Portal',
        level: 2,
        content: (
          <>
            <P>The portal serves two main groups:</P>
            <H3>Internal team (logged-in users)</H3>
            <UL>
              <LI><strong>Internal Users</strong> — buyers and logistics coordinators who create and manage purchase orders day-to-day.</LI>
              <LI><strong>Internal Managers</strong> — administrators who also configure states, transition rules, notification rules, entities, and users.</LI>
            </UL>
            <H3>External parties (magic-link access)</H3>
            <UL>
              <LI><strong>Sellers / Suppliers</strong> — receive a time-limited link via email or WhatsApp to confirm or reject a PO. No account needed.</LI>
              <LI><strong>Logistics providers and carriers</strong> — may receive document upload links to submit shipment paperwork.</LI>
            </UL>
          </>
        ),
      },
      {
        id: 'logging-in',
        heading: 'Logging In',
        level: 2,
        content: (
          <>
            <P>Navigate to the portal URL and enter your email and password on the login screen. The system uses JWT authentication; your session is automatically renewed while you remain active.</P>
            <P>If you have lost access, contact your Internal Manager to reset your account.</P>
          </>
        ),
      },
      {
        id: 'navigation',
        heading: 'Navigation Overview',
        level: 2,
        content: (
          <Table
            headers={['Nav item', 'What it is', 'Who sees it']}
            rows={[
              ['Dashboard', 'Summary metrics and recent activity', 'All users'],
              ['Orders', 'Purchase order list and search', 'All users'],
              ['Freight', 'Freight bookings and shipment tracking', 'All users'],
              ['Rates', 'Contract freight rate configuration', 'Managers only'],
              ['More → Entities', 'Organisation / buyer accounts', 'Managers only'],
              ['More → Users', 'Team member accounts', 'Managers only'],
              ['More → Custom Fields', 'Extra fields on POs', 'Managers only'],
              ['More → Parties', 'External sellers, carriers, logistics', 'Managers only'],
              ['More → Rules', 'Notification rules', 'Managers only'],
              ['More → States', 'PO state definitions', 'Managers only'],
              ['More → Transitions', 'PO transition rules', 'Managers only'],
            ]}
          />
        ),
      },
      {
        id: 'roles',
        heading: 'Your Role and Permissions',
        level: 2,
        content: (
          <>
            <P>Roles are stored as an array on your user account so you can hold multiple. The two built-in roles are:</P>
            <UL>
              <LI><Code>internal_user</Code> — read and operate on POs; trigger transitions that are allowed for your role.</LI>
              <LI><Code>internal_manager</Code> — everything an internal_user can do, plus full administrative access to configuration.</LI>
            </UL>
            <P>Which transitions you can trigger on a PO depends on the <Code>PoTransitionRule</Code> records configured for your entity — see the PO States & Transitions guide.</P>
          </>
        ),
      },
      {
        id: 'entities',
        heading: 'Entities and Multi-Tenancy',
        level: 2,
        content: (
          <>
            <P>All data (POs, states, rules, users) is scoped to an <strong>Entity</strong> — an organisation record representing a buyer. When you log in, your data is automatically filtered to your entity.</P>
            <P>A single deployment of the portal can serve multiple entities without their data overlapping. Managers can create and switch between entities in the <strong>Entities</strong> section.</P>
          </>
        ),
      },
      {
        id: 'system-architecture',
        heading: 'System Architecture',
        level: 2,
        content: (
          <>
            <P>The portal is a React single-page app that communicates with a Rails 8.1 API. Background jobs (notifications, shipment polling, freight booking) run via solid_queue on the same database.</P>
            <SystemArchDiagram />
            <P>Carrier webhooks arrive at <Code>POST /api/v1/webhooks</Code> and are processed by <Code>ProcessWebhookJob</Code>, keeping shipment timelines up to date in near real-time alongside the scheduled <Code>PollShippingStatusJob</Code>.</P>
          </>
        ),
      },
    ],
  },

  {
    id: 'purchase-orders',
    title: 'Purchase Orders',
    icon: 'shopping_cart',
    description: 'Creating POs, state transitions, seller confirmation, documents',
    sections: [
      {
        id: 'lifecycle',
        heading: 'The PO Lifecycle at a Glance',
        level: 2,
        content: (
          <>
            <POStateMachineDiagram />
            <P>The exact states and transitions are configured per entity by an Internal Manager. Each state belongs to one of four categories:</P>
            <Table
              headers={['Category', 'Meaning']}
              rows={[
                [<Code>open</Code>, 'Actively being processed'],
                [<Code>in_transit</Code>, 'Goods are moving'],
                [<Code>closed</Code>, 'Final, no further action needed'],
                [<Code>exception</Code>, 'Requires intervention'],
              ]}
            />
          </>
        ),
      },
      {
        id: 'creating',
        heading: 'Creating a Purchase Order',
        level: 2,
        content: (
          <>
            <OL>
              <LI>Go to <strong>Orders</strong> and click <strong>Create Order</strong>.</LI>
              <LI>Fill in the required fields: PO Number, PO Type (Standard / Blanket / Service), Entity, Vendor, Order Date, Expected Delivery Date, Total Amount, Currency, and Shipping Method.</LI>
              <LI>Add cargo details: description, HS code, quantity, CBM, gross and net weight.</LI>
              <LI>Assign stakeholders: seller, logistics partner, and carrier. Select from the External Parties list to enable notifications and magic links, or type free-text for display only.</LI>
              <LI>Set billing and destination addresses, payment terms, and incoterm.</LI>
              <LI>Optionally attach documents at creation time (PO Document, Spec Sheet, MSDS, Sample Approval).</LI>
              <LI>Click <strong>Save</strong>. The PO is created in the initial state defined for your entity (typically <strong>Draft</strong>).</LI>
            </OL>
          </>
        ),
      },
      {
        id: 'transitions',
        heading: 'State Transitions',
        level: 2,
        content: (
          <>
            <P>Available transitions are shown as buttons in the PO header. Buttons appear only for transitions your role is permitted to perform (determined by the entity's Transition Rules).</P>
            <OL>
              <LI>Open the PO detail page.</LI>
              <LI>Click an action button in the header (e.g. <strong>Approve</strong>, <strong>Send to Seller</strong>).</LI>
              <LI>If the transition requires a comment, a modal will appear — enter your note and click <strong>Confirm Action</strong>.</LI>
              <LI>The state updates immediately and a success message is shown.</LI>
            </OL>
            <InfoBox icon="info" title="Red vs. primary buttons">
              Transitions whose action key contains <Code>reject</Code> or <Code>cancel</Code> render in red. All others use the primary colour.
            </InfoBox>
          </>
        ),
      },
      {
        id: 'seller-confirmation',
        heading: 'Seller Confirmation Workflow',
        level: 2,
        content: (
          <>
            <P>When a PO is sent to a seller, the backend generates a <strong>magic link</strong> — a time-limited URL delivered by email or WhatsApp. The seller needs no account.</P>
            <SellerConfirmationDiagram />
            <P>If the magic link expires before the seller responds, a manager can regenerate it by re-triggering the "Send to Seller" transition. The expiry duration is configured per state by an Internal Manager.</P>
            <P>After the seller responds, a summary card appears on the PO detail page. For partial confirmations, the Line Items tab shows original vs. confirmed values side by side.</P>
          </>
        ),
      },
      {
        id: 'documents',
        heading: 'Documents',
        level: 2,
        content: (
          <>
            <DocumentOwnershipDiagram />
            <P>Documents with a green check icon are attached. Click <strong>View Document</strong> to open in a new tab. When the PO is in the <Code>ready_to_ship</Code> state, a banner reminds the buyer to review the Documents tab before approving.</P>
          </>
        ),
      },
      {
        id: 'audit-log',
        heading: 'Audit Log & Transition History',
        level: 2,
        content: (
          <>
            <P>Every state change attempt — successful or failed — is recorded automatically. Each entry shows the action, from/to states, actor, timestamp, comment (if entered), and error message (if the transition failed).</P>
            <P>The sidebar Audit Log shows the 3 most recent events. Click <strong>Show All</strong> or open the <strong>Transition History</strong> tab to see the complete log.</P>
          </>
        ),
      },
      {
        id: 'search-filter',
        heading: 'Searching and Filtering',
        level: 2,
        content: (
          <>
            <UL>
              <LI><strong>Search bar</strong> — full-text search across PO number, vendor, carrier, etc.</LI>
              <LI><strong>Status dropdown</strong> — filter by a single status</LI>
              <LI><strong>Advanced filters</strong> — PO type, shipping method, carrier, order date range, total amount range, tracking number</LI>
            </UL>
            <P>Click any <strong>status badge</strong>, <strong>type chip</strong>, <strong>carrier name</strong>, or <strong>shipping method</strong> in the table to instantly apply that filter. Sort any column by clicking its header.</P>
            <P>Click <strong>Export</strong> to download a CSV of the current filtered result set.</P>
          </>
        ),
      },
    ],
  },

  {
    id: 'freight-bookings',
    title: 'Freight Bookings',
    icon: 'local_shipping',
    description: 'Booking statuses, shipment timeline, delay alerts, freight rates',
    sections: [
      {
        id: 'what-is',
        heading: 'What Is a Freight Booking',
        level: 2,
        content: (
          <>
            <P>A freight booking tracks the physical movement of goods from origin port to destination port. The portal creates bookings automatically (via the Bird API) or manually when a PO transitions into a <Code>ready_to_ship</Code>-category state, depending on the carrier's booking workflow setting.</P>
            <P>Each booking captures: carrier, transport mode, port of loading (POL), port of discharge (POD), container/vessel/flight details, ETD, ETA, freight cost, and live tracking events.</P>
          </>
        ),
      },
      {
        id: 'statuses',
        heading: 'Booking Statuses',
        level: 2,
        content: (
          <>
            <BookingStatusFlowDiagram />
            <Table
              headers={['Status', 'Meaning']}
              rows={[
                ['Draft', 'Created but not yet sent to the carrier'],
                ['Rate Applied', 'A contract freight rate has been matched and applied'],
                ['Pending Carrier Confirmation', 'Sent to carrier; awaiting their booking confirmation'],
                ['Confirmed', 'Carrier has confirmed space and schedule'],
                ['ETD Changed', 'Carrier notified a schedule change; review ETA impact'],
                ['Cancelled', 'Booking cancelled by buyer or carrier'],
              ]}
            />
          </>
        ),
      },
      {
        id: 'transport-modes',
        heading: 'Transport Modes',
        level: 2,
        content: (
          <Table
            headers={['Mode', 'Use case']}
            rows={[
              ['Ocean FCL', 'Full Container Load — dedicated container'],
              ['Ocean LCL', 'Less than Container Load — shared container'],
              ['Air', 'Time-sensitive or high-value goods'],
              ['Road', 'Domestic or cross-border overland'],
              ['Rail', 'Long-haul land freight'],
            ]}
          />
        ),
      },
      {
        id: 'timeline',
        heading: 'Shipment Timeline',
        level: 2,
        content: (
          <>
            <P>The shipment timeline shows the journey of your cargo from loading to discharge. Each milestone (e.g. Loaded at Port, Departed, Arrived at POD, Customs Cleared) shows a status icon, location, expected and actual timestamps, and carrier notes.</P>
            <P>The timeline is populated automatically when the backend polls the Bird API via <Code>PollShippingStatusJob</Code>. Webhooks from the carrier at <Code>POST /api/v1/webhooks</Code> also update the timeline in near real-time.</P>
          </>
        ),
      },
      {
        id: 'delay-alerts',
        heading: 'Delay Alerts',
        level: 2,
        content: (
          <>
            <P>When the polling job detects that an ETA has shifted or a milestone is overdue, a delay alert is created. Alerts appear on both the freight booking detail page and the parent PO detail page (FreightSection banner).</P>
            <P>Each alert shows: alert type (ETA Change, Milestone Overdue, etc.), original vs. revised dates, severity (warning / critical), and when the alert was detected.</P>
            <InfoBox icon="warning" title="Alerts are informational">
              Delay alerts do not automatically change PO state. Your logistics team should review the impact and decide whether a PO action is required.
            </InfoBox>
          </>
        ),
      },
      {
        id: 'freight-rates',
        heading: 'Freight Rates',
        level: 2,
        content: (
          <>
            <P>Managers configure contract freight rates at <strong>Rates → Freight Rates</strong>. A rate record captures origin/destination, transport mode, container type, weight class, rate amount, and validity dates.</P>
            <P>When a booking is created, the system automatically matches and applies the best rate. If no rate matches, the booking requires manual rate entry.</P>
          </>
        ),
      },
      {
        id: 'backend-flow',
        heading: 'How the Backend Creates & Tracks Bookings',
        level: 2,
        content: (
          <>
            <P>This diagram shows the full journey from a PO state change to live shipment tracking and delay detection.</P>
            <FreightBackendDiagram />
          </>
        ),
      },
    ],
  },

  {
    id: 'states-transitions',
    title: 'PO States & Transitions',
    icon: 'account_tree',
    description: 'Configuring states, transition rules, and post-transition actions',
    sections: [
      {
        id: 'overview',
        heading: 'Overview',
        level: 2,
        content: (
          <>
            <P>Rather than hard-coding a fixed lifecycle, each entity defines its own states and the rules governing who can move a PO between them. This makes the portal adaptable to any procurement workflow.</P>
            <Pre>{`Entity
 └── PoState (e.g. "Draft", "Approved", "Sent to Seller")
      └── PoTransitionRule (from_state → to_state, allowed_roles)
           └── PostTransitionAction (notify, send magic link, create freight booking…)`}</Pre>
          </>
        ),
      },
      {
        id: 'po-states',
        heading: 'PO States',
        level: 2,
        content: (
          <>
            <P>Manage states at <strong>More → States</strong>. Each state has:</P>
            <Table
              headers={['Field', 'Description']}
              rows={[
                ['Name', 'Display name shown to users (e.g. "Awaiting Approval")'],
                ['System Code', 'Machine-readable slug (e.g. awaiting_approval). Keep this stable — code and notification rules reference it.'],
                ['Category', 'One of: open, in_transit, closed, exception'],
                ['Description', 'Optional text shown on the PO detail page'],
                ['Is Initial', 'If checked, new POs start in this state'],
                ['Magic Link Expiry Minutes', 'For sent_to_seller states: how long the seller link stays valid'],
              ]}
            />
            <H3>Special system codes</H3>
            <Table
              headers={['System Code', 'Effect']}
              rows={[
                [<Code>ready_to_ship</Code>, 'Shows "Review Required" banner on the PO detail page'],
                [<Code>ready_correction_requested</Code>, 'Shows "Correction Requested" banner'],
                [<Code>sent_to_seller</Code>, 'Activates magic link generation and expiry logic'],
                [<Code>seller_confirmed</Code>, 'Shows seller confirmed response card'],
                [<Code>seller_confirmed_partial</Code>, 'Shows partial confirmation card + line-item diff'],
                [<Code>seller_rejected</Code>, 'Shows seller rejected response card'],
              ]}
            />
          </>
        ),
      },
      {
        id: 'transition-rules',
        heading: 'PO Transition Rules',
        level: 2,
        content: (
          <>
            <P>Manage rules at <strong>More → Transitions</strong>. Each rule defines one allowed transition:</P>
            <Table
              headers={['Field', 'Description']}
              rows={[
                ['From State', 'The state the PO must currently be in'],
                ['To State', 'The state the PO will move to'],
                ['Action Name', 'Button label shown to the user (e.g. "Approve")'],
                ['Action Key', 'Machine-readable key. Keys containing reject or cancel render as red buttons.'],
                ['Allowed Roles', 'Which user roles may trigger this transition'],
                ['Requires Comment', 'If checked, user must enter a comment before confirming'],
                ['Post-Transition Actions', 'Ordered list of actions to execute after a successful transition'],
              ]}
            />
          </>
        ),
      },
      {
        id: 'post-actions',
        heading: 'Post-Transition Actions',
        level: 2,
        content: (
          <>
            <Table
              headers={['Action Type', 'Effect']}
              rows={[
                [<Code>notify</Code>, 'Sends a notification via channels defined in matching NotificationRules'],
                [<Code>send_magic_link</Code>, 'Generates and sends the seller magic link'],
                [<Code>create_freight_booking</Code>, 'Creates a FreightBooking record and calls the carrier API'],
                [<Code>custom_webhook</Code>, 'POSTs a payload to a configured external URL'],
              ]}
            />
            <P>Actions execute in order. A failed action is marked in the TransitionActionsPanel on the PO detail page but does not roll back the state change.</P>
          </>
        ),
      },
      {
        id: 'backend-enforcement',
        heading: 'How the Backend Enforces Rules',
        level: 2,
        content: (
          <>
            <P>When you click an action button, the frontend calls <Code>POST /api/v1/purchase_orders/:id/transition</Code>. Here is what happens end-to-end:</P>
            <TransitionEnforcementDiagram />
            <P>The <Code>GET /api/v1/purchase_orders/:id/available_actions</Code> endpoint powers the action buttons — it filters transition rules by the current user's roles and returns only what is permitted.</P>
          </>
        ),
      },
    ],
  },

  {
    id: 'notifications-admin',
    title: 'Notifications & Administration',
    icon: 'admin_panel_settings',
    description: 'Notification rules, external parties, entities, users, custom fields',
    sections: [
      {
        id: 'notification-rules',
        heading: 'Notification Rules',
        level: 2,
        content: (
          <>
            <P>Manage rules at <strong>More → Rules</strong>. A notification rule defines: "When a PO enters state X, notify party role Y via channel Z."</P>
            <NotificationPipelineDiagram />
            <Table
              headers={['Field', 'Description']}
              rows={[
                ['Entity', 'Which entity this rule applies to'],
                ['PO State', 'The state that triggers the notification'],
                ['Party Role', 'Who to notify: seller, logistics, buyer, internal_manager'],
                ['Channel', 'email, whatsapp, or sms'],
              ]}
            />
            <H3>Example rules for a typical workflow</H3>
            <Table
              headers={['State', 'Role', 'Channel']}
              rows={[
                ['Sent to Seller', 'seller', 'email + whatsapp'],
                ['Seller Confirmed', 'buyer', 'email'],
                ['Seller Rejected', 'internal_manager', 'email'],
                ['Ready to Ship', 'logistics', 'email'],
                ['Shipped', 'buyer', 'email'],
              ]}
            />
            <P>Multiple rules can fire on the same state transition — all matching rules are processed.</P>
          </>
        ),
      },
      {
        id: 'external-parties',
        heading: 'External Parties',
        level: 2,
        content: (
          <>
            <P>Manage at <strong>More → Parties</strong>. An external party is a company or person who interacts with POs but does not have a portal login.</P>
            <Table
              headers={['Field', 'Description']}
              rows={[
                ['Name', 'Company or person name'],
                ['Role', 'seller, logistics, or carrier'],
                ['Email', 'Used for magic link delivery and email notifications'],
                ['Phone', 'Used for WhatsApp / SMS notifications'],
                ['Entity', 'Which buyer this party works with'],
              ]}
            />
            <P>When assigning a seller to a PO, selecting from the External Parties list enables magic link sending and typed notifications. Free-text entries are display only and receive no automatic communications.</P>
          </>
        ),
      },
      {
        id: 'entities',
        heading: 'Entities',
        level: 2,
        content: (
          <>
            <P>Manage at <strong>More → Entities</strong>. An entity represents a buyer organisation. Every piece of data is scoped to an entity, enabling full multi-tenancy.</P>
            <P>Creating a new entity does not automatically create states or transition rules. Follow this checklist to configure a new entity from scratch:</P>
            <EntitySetupDiagram />
          </>
        ),
      },
      {
        id: 'users',
        heading: 'Users',
        level: 2,
        content: (
          <>
            <P>Manage at <strong>More → Users</strong>. After creating a user, they receive a welcome email with a password reset link.</P>
            <Table
              headers={['Field', 'Description']}
              rows={[
                ['Name', 'First and last name'],
                ['Email', 'Login email (must be unique)'],
                ['Roles', 'Array of role strings, e.g. ["internal_user", "internal_manager"]'],
                ['Entity', 'The entity this user belongs to'],
              ]}
            />
            <P>To grant manager access, add <Code>internal_manager</Code> to the user's roles. Users can update their own profile from the <strong>Profile</strong> page (top-right avatar menu).</P>
          </>
        ),
      },
      {
        id: 'custom-fields',
        heading: 'Custom Field Definitions',
        level: 2,
        content: (
          <>
            <P>Manage at <strong>More → Custom Fields</strong>. Custom fields extend POs with domain-specific attributes scoped to a PO type.</P>
            <Table
              headers={['Field', 'Description']}
              rows={[
                ['Field Label', 'Display name shown in the UI'],
                ['Field Key', 'Machine-readable key stored in the PO\'s custom_fields JSON column'],
                ['Field Type', 'text, number, date, checkbox, or select'],
                ['Options', 'For select type: allowed values'],
                ['PO Type', 'standard, blanket, or service — field only appears for this type'],
                ['Required', 'Whether the field must be filled before saving'],
              ]}
            />
            <P>Custom field values appear in the <strong>Extended Attributes</strong> section of the PO detail page and in the create/edit form for the matching PO type.</P>
          </>
        ),
      },
    ],
  },
]

// ─── Page chrome ──────────────────────────────────────────────────────────────

function TableOfContents({ guide, onSectionClick }: { guide: Guide; onSectionClick: (id: string) => void }) {
  return (
    <div className="hidden lg:block sticky top-24 w-52 flex-shrink-0">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant mb-3">On this page</p>
      <nav className="space-y-1">
        {guide.sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onSectionClick(s.id)}
            className="block w-full text-left text-xs text-on-surface-variant hover:text-primary transition-colors py-1 pl-2 border-l-2 border-transparent hover:border-primary"
          >
            {s.heading}
          </button>
        ))}
      </nav>
    </div>
  )
}

export function HelpPage() {
  const isAuth = useRequireAuth()
  const [activeGuide, setActiveGuide] = useState<GuideId>('getting-started')

  const guide = GUIDES.find((g) => g.id === activeGuide)!

  const scrollToSection = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!isAuth) return <LoadingSpinner />

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-3xl">help_center</span>
          <h1 className="text-4xl font-extrabold tracking-tighter text-on-primary-container">Help & User Guides</h1>
        </div>
        <p className="text-on-surface-variant font-light">Everything you need to know about the Foxall Logistics Portal.</p>
      </header>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <nav className="space-y-2 sticky top-24">
            {GUIDES.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGuide(g.id)}
                className={`w-full text-left p-4 rounded-xl transition-all flex items-start gap-3 ${
                  activeGuide === g.id
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className={`material-symbols-outlined text-xl mt-0.5 flex-shrink-0 ${activeGuide === g.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                  {g.icon}
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight">{g.title}</p>
                  <p className="text-xs font-light opacity-70 mt-0.5 leading-snug">{g.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content + TOC */}
        <div className="flex gap-8 flex-1 min-w-0">
          <main className="flex-1 min-w-0">
            <div className="glass-panel ambient-shadow rounded-2xl p-8 md:p-12 border border-outline-variant/20">
              <div className="flex items-center gap-4 mb-8">
                <span className="p-3 bg-primary-container/30 text-primary rounded-xl material-symbols-outlined text-2xl">
                  {guide.icon}
                </span>
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tighter text-on-primary-container">{guide.title}</h1>
                  <p className="text-on-surface-variant font-light mt-1">{guide.description}</p>
                </div>
              </div>

              {guide.sections.map((section) => (
                <div key={section.id} id={`section-${section.id}`} className="scroll-mt-28">
                  <H2>{section.heading}</H2>
                  {section.content}
                </div>
              ))}
            </div>
          </main>

          <TableOfContents guide={guide} onSectionClick={scrollToSection} />
        </div>
      </div>
    </div>
  )
}
