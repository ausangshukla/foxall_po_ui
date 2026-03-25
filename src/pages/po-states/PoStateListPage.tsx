import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import { listPoStates, deletePoState } from '../../api/po-states'
import { listEntities } from '../../api/entities'
import type { PoStateResponse, EntityResponse } from '../../types/api'

const CATEGORY_CONFIG: Record<string, { icon: string, bg: string, text: string }> = {
  open: { icon: 'hourglass_empty', bg: 'bg-primary-container', text: 'text-on-primary-container' },
  in_transit: { icon: 'local_shipping', bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  closed: { icon: 'check_circle', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  exception: { icon: 'error', bg: 'bg-error-container', text: 'text-on-error-container' },
}

export function PoStateListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()

  const [poStates, setPoStates] = useState<PoStateResponse[]>([])
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sortKey, setSortKey] = useState<keyof PoStateResponse>('position')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: keyof PoStateResponse) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  useEffect(() => {
    if (!isAuth) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [statesData, entitiesData] = await Promise.all([
          listPoStates(),
          listEntities(),
        ])
        setPoStates(statesData)
        setEntities(entitiesData)
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        const message = err instanceof Error ? err.message : 'Failed to load PO states'
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
      await deletePoState(idToDelete)
      setPoStates((prev) => prev.filter((s) => s.id !== idToDelete))
      setShowDeleteConfirm(false)
      setDeletingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete PO state'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const getEntityName = (id: number) => entities.find(e => e.id === id)?.name || `ID: ${id}`

  const filteredPoStates = poStates.filter((state) => {
    const searchLower = searchTerm.toLowerCase()
    const entityName = getEntityName(state.entity_id).toLowerCase()
    return (
      state.name.toLowerCase().includes(searchLower) ||
      state.system_code.toLowerCase().includes(searchLower) ||
      state.category.toLowerCase().includes(searchLower) ||
      entityName.includes(searchLower)
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

  const getSortIndicator = (key: keyof PoStateResponse) => {
    if (sortKey !== key) return <span className="material-symbols-outlined text-outline text-xs ml-1">unfold_more</span>
    return <span className="material-symbols-outlined text-primary text-xs ml-1">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="space-y-0 max-w-[1600px] mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">PO States</h1>
          <p className="text-on-surface-variant font-light tracking-wide">Manage your custom PO lifecycle states.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/po-states/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Create State</span>
          </button>
        </div>
      </section>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden">
        <div className="p-6 bg-surface-container-low flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input
                className="pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full lg:w-64 font-light text-sm"
                placeholder="Search states..."
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
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group" onClick={() => toggleSort('entity_id')}>
                  <div className="flex items-center gap-1">Entity {getSortIndicator('entity_id')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1">Name {getSortIndicator('name')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group" onClick={() => toggleSort('system_code')}>
                  <div className="flex items-center gap-1">System Code {getSortIndicator('system_code')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group" onClick={() => toggleSort('category')}>
                  <div className="flex items-center gap-1">Category {getSortIndicator('category')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group" onClick={() => toggleSort('position')}>
                  <div className="flex items-center gap-1">Pos {getSortIndicator('position')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredPoStates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-on-surface-variant">No states found</td>
                </tr>
              ) : (
                filteredPoStates.map((s) => {
                  const cfg = CATEGORY_CONFIG[s.category] || CATEGORY_CONFIG.open;
                  return (
                    <tr 
                      key={s.id} 
                      className="hover:bg-surface-container-low transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate(`/po-states/${s.id}`)}
                    >
                      <td className="px-8 py-6 font-medium text-sm">{getEntityName(s.entity_id)}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                           <span className="font-medium text-sm">{s.name}</span>
                           {s.is_default && <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-tighter">Default</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6"><code className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">{s.system_code}</code></td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-sm ${cfg.text}`}>{cfg.icon}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            {s.category.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm text-on-surface-variant">{s.position}</td>
                      <td className="px-8 py-6 text-right" onClick={(ev) => ev.stopPropagation()}>
                         <div className="flex justify-end gap-1">
                            <button onClick={() => navigate(`/po-states/${s.id}`)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-primary transition-all"><span className="material-symbols-outlined text-xl">visibility</span></button>
                            <button onClick={() => navigate(`/po-states/${s.id}/edit`)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-secondary transition-all"><span className="material-symbols-outlined text-xl">edit</span></button>
                            <button onClick={() => handleDelete(s.id)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-error transition-all"><span className="material-symbols-outlined text-xl">delete</span></button>
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
        title="Delete PO State"
        message="Are you sure you want to delete this state? This may affect existing POs in this state."
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingId(null) }}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />
    </div>
  )
}
