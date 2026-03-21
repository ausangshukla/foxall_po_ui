import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import { listEntities, deleteEntity } from '../../api/entities'
import { listUsers } from '../../api/users'
import type { EntityResponse, UserResponse } from '../../types/api'

const TYPE_CONFIG: Record<string, { icon: string, bg: string, text: string }> = {
  company: { icon: 'corporate_fare', bg: 'bg-primary-container', text: 'text-on-primary-container' },
  branch: { icon: 'store', bg: 'bg-secondary-container', text: 'text-on-secondary-container' },
  department: { icon: 'lan', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
  warehouse: { icon: 'inventory_2', bg: 'bg-surface-container-highest', text: 'text-on-surface-variant' },
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

    const idToDelete = deletingId

    try {
      setIsLoading(true)
      await deleteEntity(idToDelete)
      setEntities((prev) => prev.filter((e) => e.id !== idToDelete))
      setShowDeleteConfirm(false)
      setDeletingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete entity'
      setError(message)
    } finally {
      setIsLoading(false)
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
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">Entities</h1>
          <p className="text-on-surface-variant font-light tracking-wide">Manage and curate your global procurement workflow.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-medium hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined">file_download</span>
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/entities/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Register Entity</span>
          </button>
        </div>
      </section>

      {/* Summary Metrics: Glass Bento */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-primary-container/30 text-primary rounded-xl material-symbols-outlined">domain</span>
            <span className="text-emerald-600 font-bold text-xs bg-primary-container/20 px-2 py-1 rounded">+2</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Total Entities</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">{entities.length}</h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-tertiary-container/30 text-tertiary rounded-xl material-symbols-outlined">group</span>
            <span className="text-on-surface-variant text-xs font-light">Across network</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Total Users</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {Array.from(userCounts.values()).reduce((a, b) => a + b, 0)}
            </h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-secondary-container/30 text-secondary rounded-xl material-symbols-outlined">location_on</span>
            <span className="text-emerald-600 font-bold text-xs bg-primary-container/20 px-2 py-1 rounded">+5.4%</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Physical Locations</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {entities.filter(e => e.address).length}
            </h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-error-container/30 text-error rounded-xl material-symbols-outlined">emergency</span>
            <span className="text-error font-bold text-xs bg-error-container/20 px-2 py-1 rounded">Active</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">System Status</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">Online</h3>
          </div>
        </div>
      </section>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      {/* Filters & Data Table Container */}
      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 bg-surface-container-low flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input
                className="pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full lg:w-64 font-light text-sm"
                placeholder="Search entities..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">filter_list</span>
              <select className="pl-12 pr-10 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full font-light text-sm appearance-none cursor-pointer">
                <option>All Types</option>
                <option>Company</option>
                <option>Branch</option>
                <option>Warehouse</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant font-light">
            <span>Showing {filteredEntities.length} active entities</span>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
        </div>

        {/* Modern Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center gap-1">Organization {getSortIndicator('name')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => toggleSort('entity_type')}
                >
                  <div className="flex items-center gap-1">Category {getSortIndicator('entity_type')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">Digital Presence</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-center">User Base</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-outline">location_off</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface mb-1">No entities found</h3>
                      <p className="text-on-surface-variant max-w-xs mx-auto mb-6 font-medium">
                        Try adjusting your search terms or add a new subsidiary entity.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntities.map((e) => {
                  const type = e.entity_type.toLowerCase();
                  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.company;
                  return (
                    <tr 
                      key={e.id} 
                      className="hover:bg-surface-container-low transition-all duration-200 group cursor-pointer"
                      onClick={() => navigate(`/entities/${e.id}`)}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant`}>
                            {e.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{e.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                            {e.entity_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {e.url ? (
                          <a 
                            href={e.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            onClick={(ev) => ev.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-primary hover:text-on-primary-container font-bold text-sm transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">language</span>
                            <span className="underline underline-offset-4 decoration-primary-container/50 truncate max-w-[150px]">
                              {e.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            </span>
                          </a>
                        ) : (
                          <span className="text-outline font-medium text-xs">—</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold">{userCounts.get(e.id) || 0}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right" onClick={(ev) => ev.stopPropagation()}>
                         <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => navigate(`/entities/${e.id}`)}
                              className="p-2 opacity-40 group-hover:opacity-100 hover:text-primary transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">visibility</span>
                            </button>
                            {canManageUsers() && (
                              <>
                                <button 
                                  onClick={() => navigate(`/entities/${e.id}/edit`)}
                                  className="p-2 opacity-40 group-hover:opacity-100 hover:text-secondary transition-all"
                                >
                                  <span className="material-symbols-outlined text-xl">edit</span>
                                </button>
                                <button 
                                  onClick={() => handleDelete(e.id)}
                                  className="p-2 opacity-40 group-hover:opacity-100 hover:text-error transition-all"
                                >
                                  <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                              </>
                            )}
                            <button 
                              className="p-2 opacity-40 group-hover:opacity-100 hover:text-primary transition-all"
                            >
                              <span className="material-symbols-outlined text-xl">more_vert</span>
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

        {/* Footer of Table */}
        <div className="p-8 border-t border-outline-variant/10 flex justify-center">
          <button className="text-sm font-bold text-primary hover:text-on-primary-container flex items-center gap-2 transition-colors">
            View Regional Distribution Data
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>

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
