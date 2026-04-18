import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import { listNotificationRules, deleteNotificationRule, exportNotificationRules } from '../../api/notification-rules'
import { listEntities } from '../../api/entities'
import { listPoStates } from '../../api/po-states'
import type { NotificationRuleResponse, EntityResponse, PoStateResponse } from '../../types/api'

const ROLE_CONFIG: Record<string, { icon: string, bg: string, text: string, label?: string }> = {
  seller: { icon: 'storefront', bg: 'bg-primary-container', text: 'text-on-primary-container' },
  logistics: { icon: 'local_shipping', bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  buyer: { icon: 'person', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  internal_manager: { icon: 'man', bg: 'bg-surface-container-highest', text: 'text-on-surface-variant', label: 'Internal Man' },
}

const CHANNEL_CONFIG: Record<string, { icon: string }> = {
  email: { icon: 'mail' },
  whatsapp: { icon: 'chat' },
  sms: { icon: 'sms' },
}

export function NotificationRuleListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()

  const [rules, setRules] = useState<NotificationRuleResponse[]>([])
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [poStates, setPoStates] = useState<PoStateResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sortKey, setSortKey] = useState<keyof NotificationRuleResponse>('party_role')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: keyof NotificationRuleResponse) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleExport = async () => {
    try {
      await exportNotificationRules()
    } catch (err) {
      console.error('Failed to export notification rules:', err)
    }
  }

  useEffect(() => {
    if (!isAuth) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [rulesData, entitiesData, statesData] = await Promise.all([
          listNotificationRules(),
          listEntities(),
          listPoStates(),
        ])
        setRules(rulesData)
        setEntities(entitiesData)
        setPoStates(statesData)
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        const message = err instanceof Error ? err.message : 'Failed to load notification rules'
        setError(message)
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

    const idToDelete = deletingId

    try {
      setIsLoading(true)
      await deleteNotificationRule(idToDelete)
      setRules((prev) => prev.filter((r) => r.id !== idToDelete))
      setShowDeleteConfirm(false)
      setDeletingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete notification rule'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const getEntityName = (id: number) => entities.find(e => e.id === id)?.name || `ID: ${id}`
  const getPoStateName = (id: number, name?: string) => name || poStates.find(s => s.id === id)?.name || `ID: ${id}`

  const filteredRules = rules.filter((rule) => {
    const searchLower = searchTerm.toLowerCase()
    const entityName = getEntityName(rule.entity_id).toLowerCase()
    const stateName = getPoStateName(rule.po_state_id, rule.po_state_name).toLowerCase()
    return (
      rule.party_role.toLowerCase().includes(searchLower) ||
      (rule.channels || []).join(' ').toLowerCase().includes(searchLower) ||
      entityName.includes(searchLower) ||
      stateName.includes(searchLower) ||
      (rule.template_id?.toLowerCase().includes(searchLower) ?? false)
    )
  }).sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

  const getSortIndicator = (key: keyof NotificationRuleResponse) => {
    if (sortKey !== key) return <span className="material-symbols-outlined text-outline text-xs ml-1">unfold_more</span>
    return <span className="material-symbols-outlined text-primary text-xs ml-1">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="space-y-0 max-w-[1600px] mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Editorial Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">Notification Rules</h1>
          <p className="text-on-surface-variant font-light tracking-wide">Configure automated notifications for your PO lifecycle.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">file_download</span>
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/notification-rules/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Create Rule</span>
          </button>
        </div>
      </section>

      {/* Summary Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-primary-container/30 text-primary rounded-xl material-symbols-outlined">notifications</span>
            <span className="text-on-surface-variant text-xs font-light">Total active</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Total Rules</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">{rules.length}</h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-tertiary-container/30 text-tertiary rounded-xl material-symbols-outlined">chat</span>
            <span className="text-on-surface-variant text-xs font-light">Multi-channel</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">WhatsApp Rules</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {rules.filter(r => r.channels?.includes('whatsapp')).length}
            </h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-secondary-container/30 text-secondary rounded-xl material-symbols-outlined">mail</span>
            <span className="text-on-surface-variant text-xs font-light">Email delivery</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Email Rules</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {rules.filter(r => r.channels?.includes('email')).length}
            </h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-error-container/30 text-error rounded-xl material-symbols-outlined">timer</span>
            <span className="text-on-surface-variant text-xs font-light">Scheduled tasks</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Delayed Notifications</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {rules.filter(r => r.delay_minutes > 0).length}
            </h3>
          </div>
        </div>
      </section>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      {/* Filters & Data Table Container */}
      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden">
        <div className="p-6 bg-surface-container-low flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input
                className="pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full lg:w-64 font-light text-sm"
                placeholder="Search rules..."
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
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => toggleSort('entity_id')}
                >
                  <div className="flex items-center gap-1">Entity {getSortIndicator('entity_id')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => toggleSort('po_state_id')}
                >
                  <div className="flex items-center gap-1">Trigger State {getSortIndicator('po_state_id')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => toggleSort('party_role')}
                >
                  <div className="flex items-center gap-1">Recipient {getSortIndicator('party_role')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
                  Channel
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">Status</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-outline">notifications_off</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface mb-1">No rules found</h3>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map((r) => {
                  const roleCfg = ROLE_CONFIG[r.party_role] || ROLE_CONFIG.seller;
                  return (
                    <tr 
                      key={r.id} 
                      className="hover:bg-surface-container-low transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate(`/notification-rules/${r.id}`)}
                    >
                      <td className="px-8 py-6 font-medium text-sm">
                        {getEntityName(r.entity_id)}
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-surface-container-high rounded-full text-xs font-medium">
                          {getPoStateName(r.po_state_id, r.po_state_name)}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-sm ${roleCfg.text}`}>{roleCfg.icon}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleCfg.bg} ${roleCfg.text}`}>
                            {roleCfg.label || r.party_role.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          {(r.channels || []).map(ch => (
                            <div key={ch} className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-lg text-on-surface-variant">{CHANNEL_CONFIG[ch]?.icon || 'notifications'}</span>
                              <span className="text-sm font-medium capitalize">{ch}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {r.is_active ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-surface-container-high text-outline rounded text-[10px] font-bold uppercase tracking-wider">Inactive</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right" onClick={(ev) => ev.stopPropagation()}>
                         <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => navigate(`/notification-rules/${r.id}`)}
                              className="p-2 opacity-40 group-hover:opacity-100 hover:text-primary transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">visibility</span>
                            </button>
                            <button 
                              onClick={() => navigate(`/notification-rules/${r.id}/edit`)}
                              className="p-2 opacity-40 group-hover:opacity-100 hover:text-secondary transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(r.id)}
                              className="p-2 opacity-40 group-hover:opacity-100 hover:text-error transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Delete Notification Rule"
        message="Are you sure you want to delete this notification rule? This will stop automated notifications for this specific role and state."
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingId(null) }}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />
    </div>
  )
}
