import { useState, useEffect, FormEvent } from 'react'
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
  const { canManageUsers, user: currentUser } = useAuth()

  const isEditing = !!id
  const userId = id ? parseInt(id, 10) : null

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
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            phone: userData.phone,
            password: '',
            entity_id: userData.entity_id.toString(),
            wa_enabled: userData.wa_enabled,
            email_enabled: userData.email_enabled,
            roles: userData.roles as UserRole[],
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

    if (!formData.first_name.trim()) errors.first_name = 'First name is required'
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required'
    } else if (formData.phone.length < 10) {
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
        await createUser(createData)
      }

      navigate('/users')
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
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-headline">
            {isEditing ? 'Modify User Account' : 'Register New User'}
          </h1>
          <p className="text-slate-500 font-medium">Configure identity and platform access permissions</p>
        </div>
        <button
          onClick={() => navigate('/users')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="e.g. John"
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.first_name ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
              />
              {validationErrors.first_name && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.first_name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="e.g. Doe"
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.last_name ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
              />
              {validationErrors.last_name && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.last_name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Account <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@foxall.com"
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.email ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
              />
              {validationErrors.email && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.phone ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
              />
              {validationErrors.phone && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.phone}</p>}
            </div>

            {!isEditing && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.password ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
                />
                {validationErrors.password && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.password}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Entity Association <span className="text-red-500">*</span></label>
              <select
                name="entity_id"
                value={formData.entity_id}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.entity_id ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
              >
                <option value="">Select Subsidiary Entity...</option>
                {entities.map(entity => (
                  <option key={entity.id} value={entity.id}>{entity.name}</option>
                ))}
              </select>
              {validationErrors.entity_id && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.entity_id}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <span className="material-symbols-outlined">manage_accounts</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Permissions & Access Control</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Roles <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {AVAILABLE_ROLES.map(role => {
                  const isSelected = formData.roles.includes(role.value);
                  return (
                    <label 
                      key={role.value} 
                      className={`relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all cursor-pointer group ${
                        isSelected 
                        ? 'bg-blue-50/50 border-blue-600 ring-4 ring-blue-600/5' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        onChange={e => handleRoleChange(role.value, e.target.checked)}
                      />
                      <span className={`material-symbols-outlined text-3xl mb-3 ${isSelected ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`}>
                        {role.icon}
                      </span>
                      <span className={`text-sm font-bold uppercase tracking-widest ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                        {role.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white">
                          <span className="material-symbols-outlined text-xs font-black">check</span>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
              {validationErrors.roles && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.roles}</p>}
            </div>

            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-50">
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
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/users')}
            disabled={isSaving}
            className="px-8 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-10 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined font-bold">save</span>
                {isEditing ? 'Update Profile' : 'Finalize & Register'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
