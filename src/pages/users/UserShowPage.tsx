import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getUser } from '../../api/users'
import { getEntity } from '../../api/entities'
import type { UserResponse, EntityResponse } from '../../types/api'

const ROLE_CONFIG: Record<string, { icon: string, color: string, bg: string, border: string, text: string }> = {
  super: { icon: 'verified_user', color: 'red', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700' },
  admin: { icon: 'manage_accounts', color: 'amber', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700' },
  employee: { icon: 'badge', color: 'blue', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700' },
}

export function UserShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { user: currentUser } = useAuth()

  const userId = id ? parseInt(id, 10) : null

  const [user, setUser] = useState<UserResponse | null>(null)
  const [entity, setEntity] = useState<EntityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth || !userId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const userData = await getUser(userId)
        setUser(userData)
        const entityData = await getEntity(userData.entity_id)
        setEntity(entityData)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load user'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth, userId])

  const canManageThisUser = (): boolean => {
    if (!user || !currentUser) return false
    if (currentUser.roles.includes('super')) return true
    if (currentUser.roles.includes('admin') && currentUser.entity_id === user.entity_id) return true
    return currentUser.id === user.id
  }

  if (!isAuth || isLoading) return <LoadingSpinner />

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <AlertMessage variant={error ? "danger" : "warning"} message={error || "User not found"} />
        <button 
          onClick={() => navigate('/users')}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Back to User Directory
        </button>
      </div>
    )
  }

  const primaryRole = user.roles.includes('super') ? 'super' : user.roles.includes('admin') ? 'admin' : 'employee'
  const roleStyle = ROLE_CONFIG[primaryRole] || ROLE_CONFIG.employee

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation */}
      <button 
        onClick={() => navigate('/users')}
        className="group inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-semibold"
      >
        <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
        Back to User Directory
      </button>

      {/* Profile Hero Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className={`h-32 bg-gradient-to-r ${
          primaryRole === 'super' ? 'from-red-500 to-rose-600' : 
          primaryRole === 'admin' ? 'from-amber-400 to-orange-500' : 
          'from-blue-500 to-indigo-600'
        }`}></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-12">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl">
                <div className={`w-full h-full rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-inner ${
                  primaryRole === 'super' ? 'bg-red-500' : 
                  primaryRole === 'admin' ? 'bg-amber-500' : 
                  'bg-blue-600'
                }`}>
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </div>
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-headline">
                    {user.first_name} {user.last_name}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}>
                    {primaryRole}
                  </span>
                </div>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pb-2">
               {canManageThisUser() && (
                 <button 
                  onClick={() => navigate(`/users/${user.id}/edit`)}
                  className="px-6 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                 >
                   <span className="material-symbols-outlined">edit</span>
                   Edit Profile
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Account Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
               <span className="material-symbols-outlined text-blue-600">contact_page</span>
               <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Account Information</h3>
             </div>
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Legal Name</p>
                  <p className="font-bold text-slate-900 text-lg">{user.first_name} {user.last_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Email</p>
                  <p className="font-bold text-blue-600">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                  <p className="font-bold text-slate-900">{user.phone || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Entity</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-sm">apartment</span>
                    <p className="font-bold text-slate-900 underline underline-offset-4 decoration-slate-200">{entity?.name || 'Central Foxall Administration'}</p>
                  </div>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="px-8 py-5 border-b border-slate-50 flex items-center gap-2 bg-slate-50/50">
               <span className="material-symbols-outlined text-blue-600">security</span>
               <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">Access Permissions</h3>
             </div>
             <div className="p-8">
                <div className="flex flex-wrap gap-3 mb-8">
                  {user.roles.map(role => {
                    const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.employee;
                    return (
                      <div key={role} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-xs uppercase tracking-widest shadow-sm ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        <span className="material-symbols-outlined text-lg">{cfg.icon}</span>
                        {role}
                      </div>
                    );
                  })}
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <span className="material-symbols-outlined text-slate-400">info</span>
                  <div className="text-sm font-medium text-slate-600 leading-relaxed">
                    {primaryRole === 'super' ? 
                      'This user has unrestricted access to all platform modules, including global entity management, user privilege escalation, and full audit logs.' :
                     primaryRole === 'admin' ? 
                      'This user can manage all purchase orders, users, and configurations within their assigned entity subsidiary.' :
                      'This user has standard operational access to view and create purchase orders within their entity. Certain administrative actions are restricted.'}
                  </div>
                </div>
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
              <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6">Notification Channels</h3>
              <div className="space-y-4">
                 <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${user.email_enabled ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${user.email_enabled ? 'text-blue-600' : 'text-slate-400'}`}>mail</span>
                      <span className="font-bold text-slate-700 text-sm">Email Alerts</span>
                    </div>
                    <span className={`material-symbols-outlined text-lg ${user.email_enabled ? 'text-blue-600' : 'text-slate-300'}`}>
                      {user.email_enabled ? 'check_circle' : 'cancel'}
                    </span>
                 </div>
                 <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${user.wa_enabled ? 'bg-green-50/50 border-green-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${user.wa_enabled ? 'text-green-600' : 'text-slate-400'}`}>chat</span>
                      <span className="font-bold text-slate-700 text-sm">WhatsApp</span>
                    </div>
                    <span className={`material-symbols-outlined text-lg ${user.wa_enabled ? 'text-green-600' : 'text-slate-300'}`}>
                      {user.wa_enabled ? 'check_circle' : 'cancel'}
                    </span>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-3xl shadow-xl p-8 text-white">
              <h3 className="font-bold text-white/40 uppercase tracking-widest text-xs mb-6">Account Metadata</h3>
              <div className="space-y-6">
                 <div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Internal Reference</p>
                    <code className="text-blue-400 font-mono text-sm">UUID-USR-{user.id.toString().padStart(6, '0')}</code>
                 </div>
                 <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-sm font-bold">Active Platform Member</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
