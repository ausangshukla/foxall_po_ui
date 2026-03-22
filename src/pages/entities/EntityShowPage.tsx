import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getEntity } from '../../api/entities'
import { listUsers } from '../../api/users'
import type { EntityResponse, UserResponse } from '../../types/api'

export function EntityShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()

  const entityId = id ? parseInt(id, 10) : null

  const [entity, setEntity] = useState<EntityResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth || !entityId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [entityData, usersData] = await Promise.all([
          getEntity(entityId),
          listUsers(),
        ])
        setEntity(entityData)
        setUsers(usersData.filter((u) => u.entity_id === entityId))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load entity'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth, entityId])

  if (!isAuth || isLoading) return <LoadingSpinner />

  if (error || !entity) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertMessage variant={error ? "danger" : "warning"} message={error || "Entity not found"} />
        <button 
          onClick={() => navigate('/entities')}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Entities
        </button>
      </div>
    )
  }

  const adminCount = users.filter(u => u.roles.includes('admin') || u.roles.includes('super')).length
  const employeeCount = users.length - adminCount

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section: Editorial Mint Gradient */}
      <header className="relative overflow-hidden rounded-xl mb-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end md:items-center bg-gradient-to-br from-primary-container via-surface to-surface-container-low">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-surface-container-lowest text-primary`}>
              {entity.entity_type}
            </span>
            <span className="text-on-surface-variant font-light tracking-widest text-sm">ENT-{entity.id.toString().padStart(4, '0')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-primary-fixed mb-2">
            {entity.name}
          </h1>
          <p className="text-on-surface-variant font-light tracking-wide max-w-md">
            {entity.address || 'Central Headquarters'}
          </p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0">
          {canManageUsers() && (
            <button 
              onClick={() => navigate(`/entities/${entity.id}/edit`)}
              className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Modify Entity
            </button>
          )}
        </div>
        {/* Decorative Abstract Pattern */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </header>

      {/* Stats Summary Bento Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Staff', value: users.length, icon: 'groups' },
          { label: 'Administrators', value: adminCount, icon: 'shield_person' },
          { label: 'Employees', value: employeeCount, icon: 'person' },
          { label: 'Digital Hubs', value: entity.url ? '1' : '0', icon: 'language' }
        ].map((stat, i) => (
          <div key={i} className="glass-panel ambient-shadow p-6 rounded-xl border border-outline-variant/20 flex flex-col items-center text-center group hover:bg-primary/5 transition-all">
            <div className={`w-12 h-12 rounded-xl mb-3 flex items-center justify-center bg-primary-container text-primary group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div className="text-2xl font-extrabold text-on-surface tracking-tight">{stat.value}</div>
            <div className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column 1: Organization Info */}
        <div className="lg:col-span-4 space-y-8">
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">corporate_fare</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Entity Profile</h2>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Official Name</p>
                <p className="font-bold text-on-surface">{entity.name}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Digital Presence</p>
                {entity.url ? (
                  <a href={entity.url} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline inline-flex items-center gap-1">
                    {entity.url.replace(/^https?:\/\//, '')}
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                ) : <p className="text-on-surface-variant font-light italic">No website configured</p>}
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Physical Location</p>
                <p className="font-light text-on-surface leading-relaxed">{entity.address || 'No physical address registered.'}</p>
              </div>
            </div>
          </section>

          {/* Help Link */}
          <a className="group flex items-center justify-between p-6 glass-panel ambient-shadow rounded-xl border border-outline-variant/20 hover:bg-primary/5 transition-colors" href="#">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">help_center</span>
              <span className="font-bold text-sm">Need Help with this Entity?</span>
            </div>
            <span className="material-symbols-outlined text-primary-container group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </div>

        {/* Column 2: Members Table */}
        <div className="lg:col-span-8">
          <section className="glass-panel ambient-shadow rounded-xl border border-outline-variant/20 overflow-hidden">
            <div className="px-8 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">group</span>
                <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Entity Members</h2>
              </div>
              {canManageUsers() && (
                <button 
                  onClick={() => navigate('/users/new')}
                  className="px-4 py-2 bg-primary-container text-on-primary-container text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all"
                >
                  + Register Member
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Name</th>
                    <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Permissions</th>
                    <th className="px-8 py-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-8 py-12 text-center">
                         <p className="text-on-surface-variant font-light italic">No users currently assigned to this entity.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr 
                        key={u.id} 
                        className="hover:bg-primary/5 transition-all cursor-pointer group"
                        onClick={() => navigate(`/users/${u.id}`)}
                      >
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-container text-primary flex items-center justify-center font-black text-[10px]">
                              {u.first_name.charAt(0)}{u.last_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{u.first_name} {u.last_name}</div>
                              <div className="text-[10px] font-medium text-on-surface-variant uppercase tracking-tight">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex gap-1">
                            {u.roles.map(r => (
                              <span key={r} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                                r === 'super' ? 'bg-error-container text-on-error-container border-error/20' : 
                                r === 'admin' ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/20' : 
                                'bg-primary-container text-on-primary-container border-primary/20'
                              }`}>
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-2">
                             <span className={`w-2 h-2 rounded-full ${u.email_enabled ? 'bg-primary' : 'bg-outline-variant'}`} title="Email Active"></span>
                             <span className={`w-2 h-2 rounded-full ${u.wa_enabled ? 'bg-primary/70' : 'bg-outline-variant'}`} title="WhatsApp Active"></span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
