import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getEntity } from '../../api/entities'
import { listUsers } from '../../api/users'
import type { EntityResponse, UserResponse } from '../../types/api'

const TYPE_CONFIG: Record<string, { icon: string, bg: string, text: string, border: string, gradient: string }> = {
  company: { icon: 'corporate_fare', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', gradient: 'from-blue-600 to-indigo-700' },
  branch: { icon: 'store', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', gradient: 'from-indigo-500 to-purple-600' },
  department: { icon: 'lan', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', gradient: 'from-emerald-500 to-teal-600' },
  warehouse: { icon: 'inventory_2', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', gradient: 'from-amber-500 to-orange-600' },
  store: { icon: 'shopping_basket', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', gradient: 'from-rose-500 to-pink-600' },
}

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

  const typeCfg = TYPE_CONFIG[entity.entity_type.toLowerCase()] || TYPE_CONFIG.company
  const adminCount = users.filter(u => u.roles.includes('admin') || u.roles.includes('super')).length
  const employeeCount = users.length - adminCount

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation */}
      <button 
        onClick={() => navigate('/entities')}
        className="group inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold"
      >
        <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
        Back to Entity Directory
      </button>

      {/* Entity Header Card */}
      <div className={`relative overflow-hidden rounded-[2.5rem] shadow-2xl bg-gradient-to-r ${typeCfg.gradient}`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-20 -mt-20 blur-3xl"></div>
        </div>

        <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <span className="material-symbols-outlined text-4xl">{typeCfg.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold text-white tracking-tighter font-headline">
                  {entity.name}
                </h1>
                <span className="px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                  {entity.entity_type}
                </span>
              </div>
              <p className="text-white/70 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">location_on</span>
                {entity.address || 'Central Headquarters'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {canManageUsers() && (
               <button 
                onClick={() => navigate(`/entities/${entity.id}/edit`)}
                className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
               >
                 <span className="material-symbols-outlined">edit</span>
                 Edit Entity
               </button>
             )}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Staff', value: users.length, icon: 'groups', color: 'blue' },
          { label: 'Administrators', value: adminCount, icon: 'shield_person', color: 'amber' },
          { label: 'Employees', value: employeeCount, icon: 'person', color: 'emerald' },
          { label: 'Digital Hubs', value: entity.url ? '1' : '0', icon: 'language', color: 'indigo' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:border-blue-100 transition-colors">
            <div className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{stat.value}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Organization Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-sm">corporate_fare</span>
              <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Entity Profile</h3>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Official Name</p>
                <p className="font-bold text-slate-900">{entity.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Digital Presence</p>
                {entity.url ? (
                  <a href={entity.url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
                    {entity.url.replace(/^https?:\/\//, '')}
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                ) : <p className="text-slate-400 font-medium italic">No website configured</p>}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Physical Location</p>
                <p className="font-bold text-slate-700 text-sm leading-relaxed">{entity.address || 'No physical address registered for this entity.'}</p>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unique Identifier</p>
                <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">ENT-{entity.id.toString().padStart(4, '0')}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-sm">group</span>
              <h3 className="font-bold text-slate-900 uppercase tracking-widest text-[10px]">Entity Members</h3>
            </div>
            {canManageUsers() && (
              <button 
                onClick={() => navigate('/users/new')}
                className="text-xs font-black uppercase text-blue-600 hover:text-blue-800 transition-colors"
              >
                + Register Member
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Notification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-12 text-center">
                       <p className="text-slate-400 font-medium italic">No users currently assigned to this entity.</p>
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr 
                      key={u.id} 
                      className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                      onClick={() => navigate(`/users/${u.id}`)}
                    >
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[10px]">
                            {u.first_name.charAt(0)}{u.last_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{u.first_name} {u.last_name}</div>
                            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex gap-1">
                          {u.roles.map(r => (
                            <span key={r} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${
                              r === 'super' ? 'bg-red-50 text-red-600 border-red-100' : 
                              r === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${u.email_enabled ? 'bg-emerald-500' : 'bg-slate-200'}`} title="Email"></span>
                           <span className={`w-2 h-2 rounded-full ${u.wa_enabled ? 'bg-green-400' : 'bg-slate-200'}`} title="WhatsApp"></span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
