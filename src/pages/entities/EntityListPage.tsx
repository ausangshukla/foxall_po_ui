import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import { listEntities, deleteEntity } from '../../api/entities'
import { listUsers } from '../../api/users'
import type { EntityResponse, UserResponse } from '../../types/api'

const TYPE_CONFIG: Record<string, { icon: string, bg: string, text: string, border: string }> = {
  company: { icon: 'corporate_fare', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' },
  branch: { icon: 'store', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
  department: { icon: 'lan', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  warehouse: { icon: 'inventory_2', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
}

export function EntityListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()

  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [userCounts, setUserCounts] = useState<Map<number, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sortKey, setSortKey] = useState<keyof EntityResponse>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: keyof EntityResponse) => {
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
        const [entitiesData, usersData] = await Promise.all([
          listEntities(),
          listUsers(),
        ])
        setEntities(entitiesData)

        const counts = new Map<number, number>()
        usersData.forEach((user: UserResponse) => {
          counts.set(user.entity_id, (counts.get(user.entity_id) || 0) + 1)
        })
        setUserCounts(counts)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load entities'
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

    try {
      setIsLoading(true)
      await deleteEntity(deletingId)
      setEntities(entities.filter((e) => e.id !== deletingId))
      setShowDeleteConfirm(false)
    } catch {
      setError('Failed to delete entity')
    } finally {
      setIsLoading(false)
      setDeletingId(null)
    }
  }

  const filteredEntities = entities.filter((entity) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      entity.name.toLowerCase().includes(searchLower) ||
      entity.entity_type.toLowerCase().includes(searchLower) ||
      entity.address.toLowerCase().includes(searchLower)
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

  const getSortIndicator = (key: keyof EntityResponse) => {
    if (sortKey !== key) return <span className="material-symbols-outlined text-slate-300 text-xs ml-1">unfold_more</span>
    return <span className="material-symbols-outlined text-blue-600 text-xs ml-1">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-headline">Entities</h1>
          <p className="mt-1 text-slate-500 font-medium">Manage organizations, branches, and distribution departments</p>
        </div>
        <button
          onClick={() => navigate('/entities/new')}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
        >
          <span className="material-symbols-outlined">add_business</span>
          Register New Entity
        </button>
      </div>

      {error && <AlertMessage variant="danger" message={error} onClose={() => setError(null)} />}

      {/* Search/Filter Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="max-w-md relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            placeholder="Search by name, type, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid Display */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600">
            Showing <span className="text-blue-600 font-bold">{filteredEntities.length}</span> active entities
          </div>
        </div>

        {filteredEntities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">location_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No entities found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Try adjusting your search terms or add a new subsidiary entity.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort('name')}>
                    <div className="flex items-center">Organization {getSortIndicator('name')}</div>
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort('entity_type')}>
                    <div className="flex items-center">Category {getSortIndicator('entity_type')}</div>
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Digital Presence</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User Base</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEntities.map((e) => {
                  const type = e.entity_type.toLowerCase();
                  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.company;
                  return (
                    <tr 
                      key={e.id} 
                      className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                      onClick={() => navigate(`/entities/${e.id}`)}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                            <span className="material-symbols-outlined text-2xl">{cfg.icon}</span>
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{e.name}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase truncate max-w-[200px]">{e.address || 'No Address Listed'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {e.entity_type}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {e.url ? (
                          <a 
                            href={e.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(ev) => ev.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-sm"
                          >
                            <span className="material-symbols-outlined text-[18px]">language</span>
                            <span className="underline underline-offset-4 decoration-blue-100">{e.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                          </a>
                        ) : (
                          <span className="text-slate-300 font-medium text-xs">—</span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                             {[1,2,3].slice(0, Math.min(3, userCounts.get(e.id) || 0)).map(i => (
                               <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                             ))}
                          </div>
                          <span className="text-xs font-bold text-slate-600">
                            {userCounts.get(e.id) || 0} Members
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right" onClick={(ev) => ev.stopPropagation()}>
                         <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => navigate(`/entities/${e.id}/edit`)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                              title="Edit Entity"
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button 
                              onClick={() => handleDelete(e.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete Entity"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Delete Entity Subsidiary"
        message={`Are you sure you want to delete this entity? This will remove all associated configurations. This action cannot be reversed and may affect users assigned to this entity.`}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingId(null) }}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />
    </div>
  )
}
