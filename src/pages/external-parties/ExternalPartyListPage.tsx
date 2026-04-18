import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import { listExternalParties, deleteExternalParty, exportExternalParties } from '../../api/external-parties'
import type { ExternalPartyResponse, ExternalPartyType } from '../../types/api'

const PARTY_TYPE_CONFIG: Record<ExternalPartyType, { icon: string; bg: string; text: string; label: string }> = {
  seller: { icon: 'local_shipping', bg: 'bg-primary-container', text: 'text-on-primary-container', label: 'Seller' },
  logistics: { icon: 'inventory_2', bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'Logistics' },
  carrier: { icon: 'flight', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', label: 'Carrier' },
}

export function ExternalPartyListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [externalParties, setExternalParties] = useState<ExternalPartyResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<ExternalPartyType | 'all'>('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sortKey, setSortKey] = useState<keyof ExternalPartyResponse>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const isAdmin = user?.roles.includes('internal_manager') || user?.roles.includes('super')

  const toggleSort = (key: keyof ExternalPartyResponse) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleExport = async () => {
    try {
      await exportExternalParties()
    } catch (err) {
      console.error('Failed to export external parties:', err)
    }
  }

  useEffect(() => {
    if (!isAuth) return
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await listExternalParties()
        setExternalParties(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') throw err
        setError(err instanceof Error ? err.message : 'Failed to load external parties')
      } finally { setIsLoading(false) }
    }
    fetchData()
  }, [isAuth])

  const handleDelete = (id: number) => { setDeletingId(id); setShowDeleteConfirm(true) }

  const confirmDelete = async () => {
    if (deletingId === null) return
    try {
      setIsLoading(true)
      await deleteExternalParty(deletingId)
      setExternalParties((prev) => prev.filter((ep) => ep.id !== deletingId))
      setShowDeleteConfirm(false); setDeletingId(null)
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete') }
    finally { setIsLoading(false) }
  }

  const filteredParties = externalParties.filter((ep) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (ep.name?.toLowerCase().includes(searchLower) ?? false) ||
      (ep.email?.toLowerCase().includes(searchLower) ?? false) ||
      (ep.company_name?.toLowerCase().includes(searchLower) ?? false)
    const matchesType = filterType === 'all' || ep.party_type === filterType
    return matchesSearch && matchesType
  }).sort((a, b) => {
    const aVal = a[sortKey]; const bVal = b[sortKey]
    if (typeof aVal === 'string' && typeof bVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    if (typeof aVal === 'number' && typeof bVal === 'number') return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    return 0
  })

  const getSortIndicator = (key: keyof ExternalPartyResponse) => {
    if (sortKey !== key) return <span className="material-symbols-outlined text-outline text-xs ml-1">unfold_more</span>
    return <span className="material-symbols-outlined text-primary text-xs ml-1">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!isAdmin) return <AlertMessage variant="danger" message="Access denied. Manager privileges required." />

  return (
    <div className="space-y-0 max-w-[1600px] mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">External Parties</h1>
          <p className="text-on-surface-variant font-light tracking-wide">Manage vendors, logistics providers, and carriers.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">file_download</span>
            <span>Export</span>
          </button>
          <button onClick={() => navigate('/external-parties/new')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform">
            <span className="material-symbols-outlined">add</span><span>Add External Party</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="w-12 h-12 bg-primary-container/30 text-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div><p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Total</p><h3 className="text-3xl font-extrabold text-on-primary-container">{externalParties.length}</h3></div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="w-12 h-12 bg-primary-container/30 text-primary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div><p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Sellers</p><h3 className="text-3xl font-extrabold text-on-primary-container">{externalParties.filter(ep => ep.party_type === 'seller').length}</h3></div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="w-12 h-12 bg-secondary-container/30 text-secondary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">inventory_2</span>
          </div>
          <div><p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Logistics</p><h3 className="text-3xl font-extrabold text-on-primary-container">{externalParties.filter(ep => ep.party_type === 'logistics').length}</h3></div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="w-12 h-12 bg-tertiary-container/30 text-tertiary rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined">flight</span>
          </div>
          <div><p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Carriers</p><h3 className="text-3xl font-extrabold text-on-primary-container">{externalParties.filter(ep => ep.party_type === 'carrier').length}</h3></div>
        </div>
      </section>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden">
        <div className="p-6 bg-surface-container-low flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input className="pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full lg:w-64 font-light text-sm" placeholder="Search..." type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select className="pl-4 pr-10 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container font-light text-sm appearance-none cursor-pointer" value={filterType} onChange={(e) => setFilterType(e.target.value as ExternalPartyType | 'all')}>
              <option value="all">All Types</option><option value="seller">Seller</option><option value="logistics">Logistics</option><option value="carrier">Carrier</option>
            </select>
          </div>
          <span className="text-sm text-on-surface-variant font-light">Showing {filteredParties.length} parties</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer" onClick={() => toggleSort('name')}><div className="flex items-center gap-1">Name {getSortIndicator('name')}</div></th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">Type</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">Contact</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">Company</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-center">Status</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredParties.length === 0 ? (
                <tr><td colSpan={6} className="px-8 py-20 text-center">
                  <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-4 mx-auto"><span className="material-symbols-outlined text-4xl text-outline">person_off</span></div>
                  <h3 className="text-lg font-bold text-on-surface mb-1">No external parties found</h3>
                </td></tr>
              ) : filteredParties.map((ep) => {
                const typeConfig = PARTY_TYPE_CONFIG[ep.party_type] || PARTY_TYPE_CONFIG.seller
                return (
                  <tr key={ep.id} className="hover:bg-surface-container-low transition-all duration-200 group cursor-pointer" onClick={() => navigate(`/external-parties/${ep.id}`)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${typeConfig.bg} ${typeConfig.text} flex items-center justify-center`}>
                          <span className="material-symbols-outlined text-xl">{typeConfig.icon}</span>
                        </div>
                        <span className="font-medium text-sm">{ep.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.text}`}>{typeConfig.label}</span>
                        {ep.party_type === 'carrier' && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${ep.booking_workflow === 'api' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                            {ep.booking_workflow === 'api' ? 'API' : 'Manual'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">{ep.email ? <a href={`mailto:${ep.email}`} onClick={(ev) => ev.stopPropagation()} className="text-primary hover:underline text-sm">{ep.email}</a> : <span className="text-outline text-xs">—</span>}</td>
                    <td className="px-8 py-6">{ep.company_name ? <span className="font-medium text-sm">{ep.company_name}</span> : <span className="text-outline text-xs">—</span>}</td>
                    <td className="px-8 py-6"><div className="flex justify-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${ep.opt_out ? 'bg-error-container/30 text-error' : 'bg-primary-container/30 text-primary'}`}>{ep.opt_out ? 'Opted Out' : 'Active'}</span></div></td>
                    <td className="px-8 py-6 text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => navigate(`/external-parties/${ep.id}`)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-primary transition-all"><span className="material-symbols-outlined text-xl">visibility</span></button>
                        <button onClick={() => navigate(`/external-parties/${ep.id}/edit`)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-secondary transition-all"><span className="material-symbols-outlined text-xl">edit</span></button>
                        <button onClick={() => handleDelete(ep.id)} className="p-2 opacity-40 group-hover:opacity-100 hover:text-error transition-all"><span className="material-symbols-outlined text-xl">delete</span></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmationModal show={showDeleteConfirm} title="Delete External Party" message={`Are you sure you want to delete "${externalParties.find(ep => ep.id === deletingId)?.name}"? This action cannot be reversed.`} onConfirm={confirmDelete} onCancel={() => { setShowDeleteConfirm(false); setDeletingId(null) }} confirmText="Delete" variant="danger" isLoading={isLoading && deletingId !== null} />
    </div>
  )
}
