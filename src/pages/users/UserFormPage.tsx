import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createUser, updateUser, getUser } from '../../api/users'
import { listEntities } from '../../api/entities'
import type {
  EntityResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
} from '../../types/api'

const AVAILABLE_ROLES: { value: UserRole; label: string; icon: string; color: string }[] = [
  { value: 'employee', label: 'Employee', icon: 'badge', color: 'blue' },
  { value: 'admin', label: 'Administrator', icon: 'manage_accounts', color: 'amber' },
  { value: 'super', label: 'Super Admin', icon: 'verified_user', color: 'red' },
]

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  entity_id: string
  wa_enabled: boolean
  email_enabled: boolean
  roles: UserRole[]
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  entity_id: '',
  wa_enabled: true,
  email_enabled: true,
  roles: ['employee'],
}

export function UserFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers, user: currentUser, refreshUser } = useAuth()

  const isProfileEdit = window.location.pathname === '/profile/edit'
  const isEditing = !!id || isProfileEdit
  const userId = id ? parseInt(id, 10) : currentUser?.id
  const isSelf = userId === currentUser?.id

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      try {
        const entitiesData = await listEntities()
        setEntities(entitiesData)

        if (isEditing && userId) {
          const userData = await getUser(userId)
          setFormData({
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            password: '',
            entity_id: (userData.entity_id || '').toString(),
            wa_enabled: !!userData.wa_enabled,
            email_enabled: !!userData.email_enabled,
            roles: (userData.roles as UserRole[]) || [],
          })
        } else if (currentUser?.entity_id) {
          setFormData(prev => ({
            ...prev,
            entity_id: currentUser.entity_id.toString(),
          }))
        }
      } catch {
        setError('Failed to load user data or entities list')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, userId, currentUser])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!(formData.first_name || '').trim()) errors.first_name = 'First name is required'
    if (!(formData.last_name || '').trim()) errors.last_name = 'Last name is required'
    if (!(formData.email || '').trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!(formData.phone || '').trim()) {
      errors.phone = 'Phone is required'
    } else if ((formData.phone || '').length < 10) {
      errors.phone = 'Phone must be at least 10 characters'
    }
    if (!isEditing && !formData.password) {
      errors.password = 'Password is required'
    } else if (!isEditing && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (!formData.entity_id) errors.entity_id = 'Entity association is required'
    if (formData.roles.length === 0) errors.roles = 'At least one role must be assigned'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsSaving(true)

    try {
      if (isEditing && userId) {
        const updateData: UpdateUserRequest = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          entity_id: parseInt(formData.entity_id, 10),
          wa_enabled: formData.wa_enabled,
          email_enabled: formData.email_enabled,
          roles: formData.roles,
        }
        await updateUser(userId, updateData)
        if (isSelf) {
          await refreshUser()
        }
        navigate(isProfileEdit ? '/profile' : `/users/${userId}`)
      } else {
        const createData: CreateUserRequest = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          entity_id: parseInt(formData.entity_id, 10),
          wa_enabled: formData.wa_enabled,
          email_enabled: formData.email_enabled,
          roles: formData.roles,
        }
        const newUser = await createUser(createData)
        navigate(`/users/${newUser.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role),
    }))
    if (validationErrors.roles) {
      setValidationErrors(prev => ({ ...prev, roles: '' }))
    }
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers() && !isSelf) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="max-w-screen-xl mx-auto min-h-screen pt-12 pb-20 px-6">
      {/* Breadcrumbs and Header Section */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            {isProfileEdit ? (
              <>
                <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/profile')}>My Profile</span>
              </>
            ) : (
              <>
                <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/users')}>Users</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span>{isEditing ? `${formData.first_name} ${formData.last_name}` : 'New User'}</span>
              </>
            )}
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">{isProfileEdit ? 'Edit Profile' : 'Edit Account'}</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            {isProfileEdit ? 'My Profile Settings' : isEditing ? 'Modify User Account' : 'Register New User'}
          </h1>
          <p className="text-on-surface-variant font-light max-w-xl">
            {isProfileEdit 
              ? 'Update your personal details, contact information and communication preferences.'
              : 'Configure identity, subsidiary associations, and platform access permissions for the logistics network.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => navigate(isProfileEdit ? '/profile' : '/users')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="user-form"
            disabled={isSaving}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-fixed-dim editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isProfileEdit ? 'Save Changes' : isEditing ? 'Update User' : 'Register User'}
              </>
            )}
          </button>
        </div>
      </header>

      {error && <div className="mb-8 max-w-4xl mx-auto"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-8">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="first_name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">First Name <span className="text-error">*</span></label>
                  <input
                    id="first_name"
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="e.g. John"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.first_name ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                  {validationErrors.first_name && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.first_name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="last_name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Last Name <span className="text-error">*</span></label>
                  <input
                    id="last_name"
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="e.g. Doe"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.last_name ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                  {validationErrors.last_name && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.last_name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Email Account <span className="text-error">*</span></label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john.doe@logistics.com"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.email ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                  {validationErrors.email && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Phone Number <span className="text-error">*</span></label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.phone ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                  {validationErrors.phone && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.phone}</p>}
                </div>

                {!isEditing && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label htmlFor="password" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Secure Password <span className="text-error">*</span></label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.password ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                    />
                    {validationErrors.password && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.password}</p>}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-secondary-fixed mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">manage_accounts</span>
                Permissions & Access Control
              </h2>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Assigned Roles <span className="text-error">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {AVAILABLE_ROLES
                      .filter(role => role.value !== 'super')
                      .map(role => {
                        const isSelected = formData.roles.includes(role.value);
                        const isDisabled = isSelf && !currentUser?.roles.includes('super') && !currentUser?.roles.includes('admin');
                        return (
                          <label 
                            key={role.value} 
                            className={`relative flex flex-col items-center p-6 rounded-2xl border transition-all cursor-pointer group ${
                              isSelected 
                              ? 'bg-surface-container-lowest border-primary ring-4 ring-primary-container/20 shadow-sm' 
                              : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant/60'
                            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={e => !isDisabled && handleRoleChange(role.value, e.target.checked)}
                              disabled={isDisabled}
                            />
                            <span className={`material-symbols-outlined text-3xl mb-3 ${isSelected ? 'text-primary' : 'text-on-surface-variant opacity-40 group-hover:opacity-100'}`}>
                              {role.icon}
                            </span>
                            <span className={`text-[11px] font-bold uppercase tracking-widest text-center ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                              {role.label}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-on-primary">
                                <span className="material-symbols-outlined text-[14px] font-black">check</span>
                              </div>
                            )}
                          </label>
                        );
                      })}
                  </div>
                  {validationErrors.roles && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.roles}</p>}
                </div>

                <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-outline-variant/10">
                  <label className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl cursor-pointer group hover:bg-surface-container-high transition-all border border-outline-variant/10 hover:border-primary/20">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.wa_enabled ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant/40'}`}>
                         <span className="material-symbols-outlined text-[24px]">chat</span>
                       </div>
                       <div>
                         <div className="text-sm font-bold text-on-surface">WhatsApp</div>
                         <div className="text-[10px] text-on-surface-variant font-medium">Push notifications</div>
                       </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="wa_enabled"
                        className="sr-only peer"
                        checked={formData.wa_enabled}
                        onChange={handleChange}
                      />
                      <div className="w-14 h-7 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-outline-variant/30 after:border after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between p-5 bg-surface-container-lowest rounded-2xl cursor-pointer group hover:bg-surface-container-high transition-all border border-outline-variant/10 hover:border-primary/20">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${formData.email_enabled ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant/40'}`}>
                         <span className="material-symbols-outlined text-[24px]">mail</span>
                       </div>
                       <div>
                         <div className="text-sm font-bold text-on-surface">Email</div>
                         <div className="text-[10px] text-on-surface-variant font-medium">Digital correspondence</div>
                       </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="email_enabled"
                        className="sr-only peer"
                        checked={formData.email_enabled}
                        onChange={handleChange}
                      />
                      <div className="w-14 h-7 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-outline-variant/30 after:border after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </div>
                  </label>
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Right Column: Contextual Info & Actions */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/40 editorial-shadow sticky top-8">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Account Settings</h3>
            
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <label htmlFor="entity_id" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Entity Association <span className="text-error">*</span></label>
                <select
                  id="entity_id"
                  name="entity_id"
                  value={formData.entity_id}
                  onChange={handleChange}
                  disabled={isSelf && !currentUser?.roles.includes('super') && !currentUser?.roles.includes('admin')}
                  className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.entity_id ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'} ${isSelf && !currentUser?.roles.includes('super') && !currentUser?.roles.includes('admin') ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Subsidiary Entity...</option>
                  {entities.map(entity => (
                    <option key={entity.id} value={entity.id}>{entity.name}</option>
                  ))}
                </select>
                {validationErrors.entity_id && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.entity_id}</p>}
              </div>

              <div className="pt-4 space-y-3">
                <div className="p-4 bg-surface-container-low rounded-2xl">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Account ID</div>
                  <div className="font-mono text-sm font-bold text-on-surface">{isEditing ? `USR-2024-${userId?.toString().padStart(4, '0')}` : 'PENDING'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                data-test-id="user-save"
                type="submit"
                form="user-form"
                disabled={isSaving}
                className="w-full py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-fixed-dim text-on-primary font-bold text-center editorial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <span className="material-symbols-outlined">verified</span>
                    {isProfileEdit ? 'Save Changes' : isEditing ? 'Update Profile' : 'Finalize & Register'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(isProfileEdit ? '/profile' : '/users')}
                className="w-full py-3 rounded-2xl bg-surface-container-high text-on-surface-variant font-bold text-sm hover:bg-error-container hover:text-on-error-container active:scale-[0.98] transition-all"
              >
                Cancel Changes
              </button>
            </div>

            <div className="mt-8 p-4 bg-primary-container/20 rounded-2xl border border-primary-container/30">
              <p className="text-[11px] text-on-primary-container leading-relaxed font-medium">
                <span className="material-symbols-outlined text-[14px] align-middle mr-1" data-weight="fill">security</span>
                Access level changes trigger an <span className="font-bold">audit log</span> entry and security notification to the primary entity admin.
              </p>
            </div>
          </div>
          
          <div className="bg-on-secondary-fixed text-white/70 p-6 rounded-3xl editorial-shadow">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4">User Metadata</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between">
                <span className="opacity-70">Created By</span>
                <span className="text-white font-medium">System</span>
              </li>
              <li className="flex justify-between">
                <span className="opacity-70">Platform Status</span>
                <span className="text-emerald-400 font-bold uppercase text-[10px]">Active</span>
              </li>
              <li className="flex justify-between">
                <span className="opacity-70">Last Login</span>
                <span className="text-white font-medium">{isEditing ? '2 hours ago' : 'Never'}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
