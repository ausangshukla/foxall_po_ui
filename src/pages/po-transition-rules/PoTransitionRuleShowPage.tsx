import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getPoTransitionRule } from '../../api/po-transition-rules'
import { listPoStates } from '../../api/po-states'
import { listEntities } from '../../api/entities'
import type { 
  PoTransitionRuleResponse, 
  PoStateResponse, 
  EntityResponse 
} from '../../types/api'

export function PoTransitionRuleShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()

  const ruleId = id ? parseInt(id, 10) : null

  const [rule, setRule] = useState<PoTransitionRuleResponse | null>(null)
  const [states, setStates] = useState<PoStateResponse[]>([])
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth || !ruleId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [ruleData, statesData, entitiesData] = await Promise.all([
          getPoTransitionRule(ruleId),
          listPoStates(),
          listEntities(),
        ])
        setRule(ruleData)
        setStates(statesData)
        setEntities(entitiesData)
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        setError(err instanceof Error ? err.message : 'Failed to load transition rule')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth, ruleId])

  const getEntityName = (id: number) => entities.find(e => e.id === id)?.name || `ID: ${id}`
  const getStateName = (id: number | null) => {
    if (id === null) return 'Any State (Initial)'
    return states.find(s => s.id === id)?.name || `ID: ${id}`
  }

  if (!isAuth || isLoading) return <LoadingSpinner />

  if (error || !rule) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertMessage variant="danger" message={error || "Transition rule not found"} />
        <button 
          onClick={() => navigate('/po-transition-rules')}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Transition Rules
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 pt-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/po-transition-rules')}>Transition Rules</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Rule #{rule.id}</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            Transition Details
          </h1>
          <p className="text-on-surface-variant font-light tracking-wide">
            Authorization rule for transitioning from <span className="font-bold text-primary">{getStateName(rule.from_state_id)}</span> to <span className="font-bold text-primary">{getStateName(rule.to_state_id)}</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(`/po-transition-rules/${rule.id}/edit`)}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-fixed-dim editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit Rule
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
            <h2 className="text-xl font-bold text-on-primary-container mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1 font-bold">Entity</p>
                  <p className="font-bold text-on-surface">{getEntityName(rule.entity_id)}</p>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1 font-bold">Authorized Role</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold rounded-full uppercase tracking-wider">
                      {rule.allowed_role.replace('_', ' ')}
                    </span>
                    {['admin', 'internal_manager', 'internal_user'].includes(rule.allowed_role.toLowerCase()) && (
                      <span className="text-[10px] text-secondary font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">north</span>
                        Hierarchy Applies
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1 font-bold">Trigger Logic</p>
                  <p className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-primary">{rule.auto_transition ? 'smart_toy' : 'bolt'}</span>
                    {rule.auto_transition ? 'Automatic (System Triggered)' : 'Manual (User Action Required)'}
                  </p>
                </div>
              </div>
              <div className="space-y-6 p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-4 font-bold border-b border-outline-variant/20 pb-2">Requirements</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">chat_bubble</span>
                      Mandatory Comment
                    </span>
                    <span className={`material-symbols-outlined ${rule.requires_comment ? 'text-primary' : 'text-outline opacity-20'}`}>
                      {rule.requires_comment ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">attach_file</span>
                      Supporting Documents
                    </span>
                    <span className={`material-symbols-outlined ${rule.requires_attachment ? 'text-primary' : 'text-outline opacity-20'}`}>
                      {rule.requires_attachment ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">link</span>
                      External Magic Link
                    </span>
                    <span className={`material-symbols-outlined ${rule.is_magic_link_enabled ? 'text-primary' : 'text-outline opacity-20'}`}>
                      {rule.is_magic_link_enabled ? 'check_circle' : 'cancel'}
                    </span>
                  </div>
                  {rule.is_magic_link_enabled && rule.to_state_magic_link_expiry_minutes && (
                    <div className="pt-2 mt-2 border-t border-outline-variant/10 text-[10px] text-on-surface-variant italic">
                      Link expires in {rule.to_state_magic_link_expiry_minutes} minutes.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4">
           <section className="bg-surface-container-highest rounded-3xl p-8 editorial-shadow border border-primary/20 sticky top-24">
              <h2 className="text-xl font-bold text-on-primary-container mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">account_tree</span>
                Flow Preview
              </h2>
              
              <div className="flex flex-col items-center py-4">
                <div className="flex flex-col items-center gap-2 p-4 bg-surface-container-low rounded-2xl w-full border border-outline-variant/10 shadow-sm">
                   <span className="text-[10px] uppercase font-bold text-outline">Current Status</span>
                   <span className="text-md font-bold text-on-surface-variant italic">{getStateName(rule.from_state_id)}</span>
                </div>
                
                <div className="flex flex-col items-center my-4">
                   <div className="w-1 h-8 bg-gradient-to-b from-primary/60 to-primary rounded-full"></div>
                   <div className="bg-primary text-on-primary px-4 py-1.5 rounded-full text-[10px] font-bold shadow-lg -my-1 z-10 flex items-center gap-2 uppercase tracking-wider">
                     <span className="material-symbols-outlined text-xs">{rule.auto_transition ? 'smart_toy' : 'bolt'}</span>
                     {rule.auto_transition ? 'Auto' : 'Action'}
                   </div>
                   <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                </div>

                <div className="flex flex-col items-center gap-2 p-6 bg-primary/10 rounded-2xl w-full border border-primary/20 shadow-lg">
                   <span className="text-[10px] uppercase font-bold text-primary/80">Target Status</span>
                   <span className="text-xl font-black text-primary tracking-tight uppercase text-center">{getStateName(rule.to_state_id)}</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
                 <p className="text-[11px] text-on-surface-variant leading-relaxed">
                   When a PO is in <span className="font-bold text-on-surface">{getStateName(rule.from_state_id)}</span>, 
                   the <span className="font-bold text-on-surface">{rule.allowed_role.replace('_', ' ')}</span> role 
                   can trigger a transition to <span className="font-bold text-on-surface">{getStateName(rule.to_state_id)}</span>
                   {rule.auto_transition ? ' automatically via system logic.' : ' by manually clicking the action button.'}
                 </p>
              </div>
           </section>
        </div>
      </div>
    </div>
  )
}
