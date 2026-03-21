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

  const userId = id ? parseInt(id, 10) : currentUser?.id

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
  }, [isAuth, userId, currentUser?.id])

  const canManageThisUser = (): boolean => {
    if (!user || !currentUser) return false
    if (currentUser.roles.includes('super')) return true
    if (currentUser.roles.includes('admin') && currentUser.entity_id === user.entity_id) return true
    return currentUser.id === user.id
  }

  const isProfileView = window.location.pathname === '/profile'

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
    <div className="max-w-7xl mx-auto px-4 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section: Editorial Mint Gradient */}
      <header className="relative overflow-hidden rounded-xl mb-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end md:items-center bg-gradient-to-br from-primary-container via-surface to-surface-container-low">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-surface-container-lowest text-primary`}>
              {primaryRole}
            </span>
            <span className="text-on-surface-variant font-light tracking-widest text-sm">USR-{user.id.toString().padStart(4, '0')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-primary-fixed mb-2">
            {isProfileView ? 'My Profile' : `${user.first_name} ${user.last_name}`}
          </h1>
          <p className="text-on-surface-variant font-light tracking-wide max-w-md">
            {isProfileView ? 'Manage your account identity and notification preferences' : `${user.email} • Assigned to ${entity?.name || 'Central Administration'}`}
          </p>
        </div>
        <div className="relative z-10 mt-6 md:mt-0">
          {canManageThisUser() && (
            <button 
              onClick={() => navigate(isProfileView ? '/profile/edit' : `/users/${user.id}/edit`)}
              className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Modify Profile
            </button>
          )}
        </div>
        {/* Decorative Abstract Pattern */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </header>

      {/* Bento Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Column 1: Account Details & Permissions */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Account Information Glass Card */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-8">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Full Legal Name</p>
                <p className="font-bold text-on-surface text-lg">{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Contact Email</p>
                <p className="font-bold text-primary">{user.email}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Phone Number</p>
                <p className="font-bold text-on-surface">{user.phone || '—'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Assigned Entity</p>
                <p className="font-bold text-on-surface">{entity?.name || 'Central Foxall Administration'}</p>
              </div>
            </div>
          </section>

          {/* Access Permissions */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">security</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Access Permissions</h2>
            </div>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                {user.roles.map(role => {
                  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.employee;
                  return (
                    <div key={role} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[10px] uppercase tracking-widest shadow-sm ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <span className="material-symbols-outlined text-lg">{cfg.icon}</span>
                      {role}
                    </div>
                  );
                })}
              </div>
              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/10 flex items-start gap-4">
                <span className="material-symbols-outlined text-on-surface-variant">info</span>
                <div className="text-sm font-light text-on-surface-variant leading-relaxed">
                  {primaryRole === 'super' ? 
                    'This user has unrestricted access to all platform modules, including global entity management, user privilege escalation, and full audit logs.' :
                   primaryRole === 'admin' ? 
                    'This user can manage all purchase orders, users, and configurations within their assigned entity subsidiary.' :
                    'This user has standard operational access to view and create purchase orders within their entity. Certain administrative actions are restricted.'}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Column 2: Notifications & Metadata */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Notification Channels */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-8">Notification Channels</h2>
            <div className="space-y-4">
               <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${user.email_enabled ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-low border-outline-variant/10 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${user.email_enabled ? 'text-primary' : 'text-on-surface-variant'}`}>mail</span>
                    <span className="font-bold text-on-surface text-sm">Email Alerts</span>
                  </div>
                  <span className={`material-symbols-outlined text-lg ${user.email_enabled ? 'text-primary' : 'text-outline-variant'}`}>
                    {user.email_enabled ? 'check_circle' : 'cancel'}
                  </span>
               </div>
               <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${user.wa_enabled ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-low border-outline-variant/10 opacity-60'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${user.wa_enabled ? 'text-primary' : 'text-on-surface-variant'}`}>chat</span>
                    <span className="font-bold text-on-surface text-sm">WhatsApp</span>
                  </div>
                  <span className={`material-symbols-outlined text-lg ${user.wa_enabled ? 'text-primary' : 'text-outline-variant'}`}>
                    {user.wa_enabled ? 'check_circle' : 'cancel'}
                  </span>
               </div>
            </div>
          </section>

          {/* Account Metadata */}
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">analytics</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Account Metadata</h2>
            </div>
            <div className="space-y-6">
              <div className="p-4 bg-surface-container-low/50 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Internal Reference</p>
                <code className="text-primary font-mono text-xs">UUID-USR-{user.id.toString().padStart(6, '0')}</code>
              </div>
              <div className="p-4 bg-surface-container-low/50 rounded-lg">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">Platform Status</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                   <span className="text-sm font-bold text-on-surface">Active Platform Member</span>
                </div>
              </div>
            </div>
          </section>

          {/* Help Link */}
          <a className="group flex items-center justify-between p-6 glass-panel ambient-shadow rounded-xl border border-outline-variant/20 hover:bg-primary/5 transition-colors" href="#">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary">help_center</span>
              <span className="font-bold text-sm">Need Help with this User?</span>
            </div>
            <span className="material-symbols-outlined text-primary-container group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  )
}
