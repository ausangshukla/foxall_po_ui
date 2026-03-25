import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getNotificationRule } from '../../api/notification-rules'
import { listEntities } from '../../api/entities'
import { listPoStates } from '../../api/po-states'
import type { NotificationRuleResponse, EntityResponse, PoStateResponse } from '../../types/api'

const ROLE_LABELS: Record<string, string> = {
  seller: 'Seller',
  logistics: 'Logistics',
  buyer: 'Buyer',
  internal_manager: 'Internal Man',
}

export function NotificationRuleShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()

  const [rule, setRule] = useState<NotificationRuleResponse | null>(null)
  const [entity, setEntity] = useState<EntityResponse | null>(null)
  const [poState, setPoState] = useState<PoStateResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth || !id) return

    const fetchData = async () => {
      try {
        const ruleData = await getNotificationRule(parseInt(id, 10))
        setRule(ruleData)
        
        const [entitiesData, statesData] = await Promise.all([
          listEntities(),
          listPoStates(),
        ])
        
        setEntity(entitiesData.find(e => e.id === ruleData.entity_id) || null)
        setPoState(statesData.find(s => s.id === ruleData.po_state_id) || null)
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        setError('Failed to load notification rule details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth, id])

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />
  if (!rule) return <AlertMessage variant="danger" message="Rule not found" />

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-12 animate-in fade-in duration-500">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-outline-variant/10 pb-8">
        <div>
           <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/notification-rules')}>Notification Rules</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Configuration Details</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">Notification Rule #{rule.id}</h1>
          <p className="text-on-surface-variant font-light tracking-wide italic">Trigger: {poState?.name || rule.po_state_id} → {ROLE_LABELS[rule.party_role] || rule.party_role.replace('_', ' ')}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate(`/notification-rules/${rule.id}/edit`)}
            className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-bold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">edit</span>
            <span>Edit Rule</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section className="space-y-12">
          <div className="glass-panel p-8 rounded-2xl ambient-shadow">
            <h2 className="text-sm font-bold text-primary uppercase tracking-[0.15em] mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">logic</span>
              Execution Parameters
            </h2>
            
            <div className="grid grid-cols-1 gap-6">
               <div className="flex justify-between items-center py-4 border-b border-outline-variant/5">
                 <span className="text-on-surface-variant font-light text-sm tracking-wide">Entity</span>
                 <span className="text-on-surface font-bold text-sm">{entity?.name || rule.entity_id}</span>
               </div>
               <div className="flex justify-between items-center py-4 border-b border-outline-variant/5">
                 <span className="text-on-surface-variant font-light text-sm tracking-wide">Trigger Event</span>
                 <span className="text-on-surface font-bold text-sm">{poState?.name || rule.po_state_id}</span>
               </div>
               <div className="flex justify-between items-center py-4 border-b border-outline-variant/5">
                 <span className="text-on-surface-variant font-light text-sm tracking-wide">Recipient Role</span>
                 <span className="text-on-surface font-bold text-sm uppercase tracking-widest text-[10px] bg-primary-container/30 px-3 py-1 rounded-full text-primary">
                    {ROLE_LABELS[rule.party_role] || rule.party_role.replace('_', ' ')}
                 </span>
               </div>
               <div className="flex justify-between items-center py-4 border-b border-outline-variant/5">
                 <span className="text-on-surface-variant font-light text-sm tracking-wide">Channel</span>
                 <span className="text-on-surface font-bold text-sm capitalize">{rule.channel}</span>
               </div>
               <div className="flex justify-between items-center py-4 border-b border-outline-variant/5">
                 <span className="text-on-surface-variant font-light text-sm tracking-wide">Execution Status</span>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${rule.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container-high text-outline'}`}>
                    {rule.is_active ? 'ACTIVE' : 'INACTIVE'}
                 </span>
               </div>
               <div className="flex justify-between items-center py-4">
                 <span className="text-on-surface-variant font-light text-sm tracking-wide">Delay Minutes</span>
                 <span className="text-on-surface font-bold text-sm">{rule.delay_minutes} min</span>
               </div>
            </div>
          </div>
        </section>

        <section className="space-y-12">
          <div className="glass-panel p-8 rounded-2xl ambient-shadow bg-surface-container-low/30 border-white/50">
            <h2 className="text-sm font-bold text-secondary uppercase tracking-[0.15em] mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">content_paste</span>
              Template Configuration
            </h2>
            
            <div className="space-y-6">
               <div className="p-5 bg-surface-container-lowest rounded-xl">
                 <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Template Identifier</label>
                 <div className="text-sm font-medium text-on-surface-variant">{rule.template_id || '—'}</div>
               </div>
               
               <div className="p-5 bg-surface-container-lowest rounded-xl">
                 <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Subject Template</label>
                 <div className="text-sm font-medium text-on-surface-variant leading-relaxed">
                   {rule.subject_template || '—'}
                 </div>
               </div>

               <div className="p-5 bg-surface-container-lowest rounded-xl">
                 <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest block mb-2">Additional Parameters</label>
                 <pre className="text-[11px] font-mono bg-surface-container-low p-4 rounded-lg overflow-x-auto text-on-surface">
                   {JSON.stringify(rule.additional_params, null, 2)}
                 </pre>
               </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
