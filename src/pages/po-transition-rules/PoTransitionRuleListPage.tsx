import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal, Modal } from '../../components/common'
import { listPoTransitionRules, deletePoTransitionRule } from '../../api/po-transition-rules'
import { listPoStates } from '../../api/po-states'
import { listEntities } from '../../api/entities'
import type { PoTransitionRuleResponse, PoStateResponse, EntityResponse } from '../../types/api'

const HelpIcon = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1 align-middle">
    <span className="material-symbols-outlined text-xs text-outline cursor-help hover:text-primary transition-colors">help</span>
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-surface-container-highest text-on-surface text-[11px] leading-relaxed rounded-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-outline-variant/20 font-normal normal-case tracking-normal backdrop-blur-md">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-surface-container-highest"></div>
    </div>
  </div>
)

const RoleBadge = ({ role }: { role: string }) => {
  const isInternal = ['internal_manager', 'internal_user'].includes(role.toLowerCase())
  return (
    <div className="flex items-center gap-2">
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isInternal ? 'bg-secondary-container text-on-secondary-container border border-secondary/20' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/20'}`}>
        {role.replace('_', ' ')}
      </span>
      {isInternal && (
        <div className="group relative">
          <span className="material-symbols-outlined text-xs text-secondary animate-pulse">north</span>
          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-secondary text-on-secondary text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            Hierarchy Inherited
          </div>
        </div>
      )}
    </div>
  )
}

export function PoTransitionRuleListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()

  const [rules, setRules] = useState<PoTransitionRuleResponse[]>([])
  const [states, setStates] = useState<PoStateResponse[]>([])
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sortKey, setSortKey] = useState<keyof PoTransitionRuleResponse>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [previewRule, setPreviewRule] = useState<PoTransitionRuleResponse | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  useEffect(() => {
    if (!isAuth) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [rulesData, statesData, entitiesData] = await Promise.all([
          listPoTransitionRules(),
          listPoStates(),
          listEntities(),
        ])
        setRules(rulesData)
        setStates(statesData)
        setEntities(entitiesData)
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        setError(err instanceof Error ? err.message : 'Failed to load transition rules')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth])

  const handleDelete = (id: number) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (deletingId === null) return
    try {
      setIsLoading(true)
      await deletePoTransitionRule(deletingId)
      setRules((prev) => prev.filter((r) => r.id !== deletingId))
      setShowDeleteConfirm(false)
      setDeletingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule')
    } finally {
      setIsLoading(false)
    }
  }

  const getEntityName = (id: number) => entities.find(e => e.id === id)?.name || `ID: ${id}`
  const getStateName = (id: number | null) => {
    if (id === null) return <span className="text-primary font-bold italic opacity-60">Any State (Initial)</span>
    return states.find(s => s.id === id)?.name || `ID: ${id}`
  }

  const filteredRules = rules.filter((rule) => {
    const searchLower = searchTerm.toLowerCase()
    const fromName = (rule.from_state_name || '').toLowerCase()
    const toName = (rule.to_state_name || '').toLowerCase()
    const role = rule.allowed_role.toLowerCase()
    const entity = getEntityName(rule.entity_id).toLowerCase()
    
    return (
      fromName.includes(searchLower) ||
      toName.includes(searchLower) ||
      role.includes(searchLower) ||
      entity.includes(searchLower)
    )
  }).sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal === null || bVal === null) return 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

  const toggleSort = (key: keyof PoTransitionRuleResponse) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const getSortIndicator = (key: keyof PoTransitionRuleResponse) => {
    if (sortKey !== key) return <span className="material-symbols-outlined text-outline text-xs ml-1">unfold_more</span>
    return <span className="material-symbols-outlined text-primary text-xs ml-1">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="space-y-0 max-w-[1600px] mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">Transition Rules</h1>
          <p className="text-on-surface-variant font-light tracking-wide">The authorization backbone of your Purchase Order lifecycle.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/po-transition-rules/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Transition</span>
          </button>
        </div>
      </section>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden border border-outline-variant/10">
        <div className="p-6 bg-surface-container-low flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input
                className="pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full lg:w-64 font-light text-sm"
                placeholder="Search transitions..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group" onClick={() => toggleSort('from_state_id')}>
                  <div className="flex items-center">
                    Start State <HelpIcon text="The current status of the Purchase Order before this action occurs." />
                    {getSortIndicator('from_state_id')}
                  </div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group" onClick={() => toggleSort('to_state_id')}>
                  <div className="flex items-center">
                    Target State <HelpIcon text="The new status the PO will move into after this action is completed." />
                    {getSortIndicator('to_state_id')}
                  </div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group" onClick={() => toggleSort('allowed_role')}>
                  <div className="flex items-center">
                    Who Can Do This? <HelpIcon text="Specifies which user role is authorized to perform this change. Note: Admins inherit permissions from all internal roles." />
                    {getSortIndicator('allowed_role')}
                  </div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  <div className="flex items-center">
                    Required Actions <HelpIcon text="💬 A comment is mandatory for this transition. 📎 Supporting documents must be uploaded." />
                  </div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  <div className="flex items-center">
                    Trigger Type <HelpIcon text="⚡ Manual: Requires user click. 🤖 Auto: Triggered automatically by system/webhooks." />
                  </div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  <div className="flex items-center">
                    External Access <HelpIcon text="Generates a secure, temporary link for external parties (Sellers/Logistics) to perform this action without logging in." />
                  </div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-on-surface-variant font-light italic">No transition rules found</td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr 
                    key={rule.id} 
                    className="hover:bg-surface-container-low transition-all duration-200 group cursor-pointer"
                    onClick={() => navigate(`/po-transition-rules/${rule.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{getStateName(rule.from_state_id)}</span>
                        <span className="material-symbols-outlined text-outline text-xs">arrow_forward</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-primary">{getStateName(rule.to_state_id)}</span>
                    </td>
                    <td className="px-8 py-6">
                      <RoleBadge role={rule.allowed_role} />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {rule.requires_comment && (
                          <div className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 text-primary border border-primary/10">
                            <span className="material-symbols-outlined text-lg">chat_bubble</span>
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg border border-outline-variant/20">Comment Required</div>
                          </div>
                        )}
                        {rule.requires_attachment && (
                          <div className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-secondary/5 text-secondary border border-secondary/10">
                            <span className="material-symbols-outlined text-lg">attach_file</span>
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container-highest text-on-surface text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg border border-outline-variant/20">Attachment Required</div>
                          </div>
                        )}
                        {!rule.requires_comment && !rule.requires_attachment && <span className="text-xs text-outline font-light italic">None</span>}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {rule.auto_transition ? (
                        <div className="flex items-center gap-2 text-tertiary">
                          <span className="material-symbols-outlined text-sm">smart_toy</span>
                          <span className="text-xs font-bold uppercase tracking-tight">System/API</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">bolt</span>
                          <span className="text-xs font-bold uppercase tracking-tight">User Action</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {rule.is_magic_link_enabled ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 text-primary font-bold">
                            <span className="material-symbols-outlined text-sm">link</span>
                            <span className="text-xs uppercase tracking-tight">Enabled</span>
                          </div>
                          {rule.to_state_magic_link_expiry_minutes && (
                            <span className="text-[10px] text-outline mt-0.5">Expires in {rule.to_state_magic_link_expiry_minutes}m</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-outline font-light italic">Internal Only</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right" onClick={(ev) => ev.stopPropagation()}>
                       <div className="flex justify-end gap-1">
                          <button onClick={() => navigate(`/po-transition-rules/${rule.id}`)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-primary transition-all"><span className="material-symbols-outlined text-xl">visibility</span></button>
                          <button 
                            onClick={() => {
                              setPreviewRule(rule);
                              setShowPreviewModal(true);
                            }} 
                            className="p-2 opacity-40 group-hover:opacity-100 hover:text-primary transition-all"
                            title="Preview Transition"
                          >
                            <span className="material-symbols-outlined text-xl">account_tree</span>
                          </button>
                          <button onClick={() => navigate(`/po-transition-rules/${rule.id}/edit`)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-secondary transition-all"><span className="material-symbols-outlined text-xl">edit</span></button>
                          <button onClick={() => handleDelete(rule.id)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-error transition-all"><span className="material-symbols-outlined text-xl">delete</span></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Delete Transition Rule"
        message="Are you sure you want to delete this transition rule? This will prevent users from performing this action on POs."
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingId(null) }}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />

      {previewRule && (
        <Modal
          show={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Transition Flow Preview"
          maxWidth="max-w-md"
        >
          <div className="flex flex-col items-center py-8">
            <div className="flex flex-col items-center gap-2 p-4 bg-surface-container-high rounded-2xl w-full border border-outline-variant/10 shadow-sm animate-in zoom-in-95 duration-300">
               <span className="text-[10px] uppercase font-bold text-outline">Current Status</span>
               <span className="text-lg font-bold text-on-surface-variant italic">{getStateName(previewRule.from_state_id)}</span>
            </div>
            
            <div className="flex flex-col items-center my-4">
               <div className="w-1 h-8 bg-gradient-to-b from-primary/60 to-primary rounded-full"></div>
               <div className="bg-primary text-on-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-lg -my-1 z-10 flex items-center gap-2 animate-in slide-in-from-top-2 duration-500">
                 <span className="material-symbols-outlined text-sm">{previewRule.auto_transition ? 'smart_toy' : 'bolt'}</span>
                 {previewRule.auto_transition ? 'Auto Trigger' : 'User Action'}
               </div>
               <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            </div>

            <div className="flex flex-col items-center gap-2 p-6 bg-primary/10 rounded-2xl w-full border border-primary/20 shadow-lg animate-in zoom-in-95 delay-150 duration-300">
               <span className="text-[10px] uppercase font-bold text-primary/80">Target Status</span>
               <span className="text-2xl font-black text-primary tracking-tight uppercase">{getStateName(previewRule.to_state_id)}</span>
            </div>

            <div className="mt-8 w-full p-4 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-3">
               <div className="flex justify-between items-center text-xs">
                  <span className="text-outline font-medium">Actor Role</span>
                  <span className="font-bold text-on-surface uppercase tracking-tight">{previewRule.allowed_role.replace('_', ' ')}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-outline font-medium">External Access</span>
                  <span className={`font-bold ${previewRule.is_magic_link_enabled ? 'text-primary' : 'text-outline'}`}>{previewRule.is_magic_link_enabled ? 'Magic Link Enabled' : 'Internal Only'}</span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-outline font-medium">Req. Actions</span>
                  <div className="flex gap-2">
                     {previewRule.requires_comment && <span className="material-symbols-outlined text-sm text-primary" title="Comment Required">chat_bubble</span>}
                     {previewRule.requires_attachment && <span className="material-symbols-outlined text-sm text-secondary" title="Attachment Required">attach_file</span>}
                     {!previewRule.requires_comment && !previewRule.requires_attachment && <span className="text-outline italic">None</span>}
                  </div>
               </div>
            </div>

            <button 
              onClick={() => setShowPreviewModal(false)}
              className="mt-8 w-full py-3 bg-on-surface text-surface rounded-xl font-bold hover:opacity-90 transition-all"
            >
              Close Preview
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
