import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createEntity, updateEntity, getEntity } from '../../api/entities'
import type {
  EntityResponse,
  EntityCreateRequest,
  EntityUpdateRequest,
} from '../../types/api'

interface FormData {
  name: string
  url: string
  entity_type: string
  address: string
}

const initialFormData: FormData = {
  name: '',
  url: '',
  entity_type: 'company',
  address: '',
}

const ENTITY_TYPES = ['company', 'branch', 'department', 'warehouse', 'store', 'other']

export function EntityFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()

  const isEditing = !!id
  const entityId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      if (isEditing && entityId) {
        try {
          const entityData = await getEntity(entityId)
          setFormData({
            name: entityData.name,
            url: entityData.url,
            entity_type: entityData.entity_type,
            address: entityData.address,
          })
        } catch {
          setError('Failed to load entity data')
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, entityId])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = 'Entity name is required'
    if (!formData.entity_type) errors.entity_type = 'Entity category is required'
    if (formData.url && !/^https?:\/\/.+/.test(formData.url)) {
      errors.url = 'URL must start with http:// or https://'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsSaving(true)

    try {
      if (isEditing && entityId) {
        const updateData: EntityUpdateRequest = {
          name: formData.name,
          url: formData.url,
          entity_type: formData.entity_type,
          address: formData.address,
        }
        await updateEntity(entityId, updateData)
      } else {
        const createData: EntityCreateRequest = {
          name: formData.name,
          url: formData.url,
          entity_type: formData.entity_type,
          address: formData.address,
        }
        await createEntity(createData)
      }

      navigate('/entities')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entity')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-headline">
            {isEditing ? 'Configure Entity' : 'Register New Entity'}
          </h1>
          <p className="text-slate-500 font-medium">Define organization structure and digital identity</p>
        </div>
        <button
          onClick={() => navigate('/entities')}
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
              <span className="material-symbols-outlined">corporate_fare</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Entity Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Entity Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Foxall Global Logistics"
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.name ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
              />
              {validationErrors.name && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Entity Category <span className="text-red-500">*</span></label>
              <select
                name="entity_type"
                value={formData.entity_type}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.entity_type ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
              >
                {ENTITY_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {validationErrors.entity_type && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.entity_type}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Digital Presence (URL)</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://foxall-logistics.com"
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 transition-all font-medium ${validationErrors.url ? 'ring-2 ring-red-500/20' : 'focus:ring-blue-500/20'}`}
              />
              <p className="text-[10px] font-bold text-slate-400 mt-1 ml-1 uppercase">Optional: Must include http:// or https://</p>
              {validationErrors.url && <p className="text-xs font-bold text-red-500 ml-1 mt-1">{validationErrors.url}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Physical Address</label>
              <textarea
                name="address"
                rows={1}
                value={formData.address}
                onChange={handleChange}
                placeholder="HQ or Branch Address"
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/entities')}
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
                {isEditing ? 'Save Changes' : 'Finalize & Register'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
