import { useState, useEffect, FormEvent } from 'react'
import { useAuth, useRequireAuth } from '../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../components/common'
import { updateUser } from '../api/users'
import { listEntities } from '../api/entities'
import type { EntityResponse, UpdateUserRequest } from '../types/api'

export function ProfilePage() {
  const isAuth = useRequireAuth()
  const { user, refreshUser } = useAuth()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    wa_enabled: false,
    email_enabled: false,
  })
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      try {
        const entitiesData = await listEntities()
        setEntities(entitiesData)

        if (user) {
          setFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            wa_enabled: user.wa_enabled,
            email_enabled: user.email_enabled,
          })
        }
      } catch {
        setError('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      const updateData: UpdateUserRequest = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        wa_enabled: formData.wa_enabled,
        email_enabled: formData.email_enabled,
      }

      await updateUser(user.id, updateData)
      await refreshUser()
      setSuccessMessage('Profile updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const entityName = entities.find(e => e.id === user?.entity_id)?.name || 'Central Administration'

  if (!isAuth || isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-headline">My Profile</h1>
          <p className="mt-1 text-slate-500 font-medium">Manage your account identity and notification preferences</p>
        </div>
      </div>

      {successMessage && <AlertMessage variant="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {error && <AlertMessage variant="danger" message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">person_edit</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Account</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer group hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.wa_enabled ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-400'}`}>
                       <span className="material-symbols-outlined text-[20px]">chat</span>
                     </div>
                     <div className="text-sm font-bold text-slate-700">WhatsApp Notifications</div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="wa_enabled"
                      className="sr-only peer"
                      checked={formData.wa_enabled}
                      onChange={handleChange}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl cursor-pointer group hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.email_enabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                       <span className="material-symbols-outlined text-[20px]">mail</span>
                     </div>
                     <div className="text-sm font-bold text-slate-700">Email Notifications</div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="email_enabled"
                      className="sr-only peer"
                      checked={formData.email_enabled}
                      onChange={handleChange}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined font-bold">save</span>
                      Update Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 z-0 opacity-50"></div>
              <div className="relative z-10">
                <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-6">Account Overview</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entity Affiliation</p>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-sm">apartment</span>
                      <p className="font-bold text-slate-900">{entityName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Roles</p>
                    <div className="flex flex-wrap gap-2">
                       {user?.roles.map(role => (
                         <span key={role} className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600 tracking-widest">
                           {role}
                         </span>
                       ))}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unique Identifier</p>
                    <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">UUID-USR-{user?.id.toString().padStart(6, '0')}</code>
                  </div>
                </div>
              </div>
           </div>

           <div className="bg-slate-900 rounded-3xl shadow-xl p-8 text-white">
              <h3 className="font-bold text-white/40 uppercase tracking-widest text-xs mb-6">Account Security</h3>
              <p className="text-sm text-white/60 font-medium mb-6">To change your password or security settings, please contact your systems administrator.</p>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                 <span className="material-symbols-outlined text-blue-400">verified</span>
                 <span className="text-xs font-bold uppercase tracking-wider">Multi-Factor Authenticated</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
