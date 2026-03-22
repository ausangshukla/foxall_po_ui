import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createEntity, updateEntity, getEntity } from '../../api/entities'
import type {
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
            name: entityData.name || '',
            url: entityData.url || '',
            entity_type: entityData.entity_type || 'company',
            address: entityData.address || '',
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

    if (!(formData.name || '').trim()) errors.name = 'Entity name is required'
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
    <div className="max-w-screen-xl mx-auto min-h-screen pt-12 pb-20 px-6">
      {/* Breadcrumbs and Header Section */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/entities')}>Entities</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{isEditing ? formData.name : 'New Entity'}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">Edit Configuration</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            {isEditing ? 'Configure Entity' : 'Register New Entity'}
          </h1>
          <p className="text-on-surface-variant font-light max-w-xl">
            Define organization structure and digital identity for subsidiaries or distribution nodes within the supply chain.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => navigate('/entities')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="entity-form"
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
                {isEditing ? 'Save Changes' : 'Register Entity'}
              </>
            )}
          </button>
        </div>
      </header>

      {error && <div className="mb-8 max-w-4xl mx-auto"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-8">
          <form id="entity-form" onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">corporate_fare</span>
                Core Entity Identity
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Official Name <span className="text-error">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Foxall Global Logistics"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.name ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                  {validationErrors.name && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Entity Category <span className="text-error">*</span></label>
                  <select
                    name="entity_type"
                    value={formData.entity_type}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.entity_type ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  >
                    {ENTITY_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                  {validationErrors.entity_type && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.entity_type}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Digital Presence (URL)</label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://logistics-hub.com"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.url ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Physical Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="HQ or Branch Facility Address"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface resize-none focus:ring-primary-container/40"
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Right Column: Contextual Info & Actions */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/40 editorial-shadow sticky top-8">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Entity Profile</h3>
            
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-surface-container-low rounded-2xl">
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Entity UUID</div>
                <div className="font-mono text-[11px] font-bold text-on-surface truncate">{isEditing ? `ENT-HUB-2024-${entityId?.toString().padStart(6, '0')}` : 'GENERATING...'}</div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                   <span className="text-on-surface-variant text-sm font-light">Status</span>
                   <span className="bg-primary-container/30 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                   <span className="text-on-surface-variant text-sm font-light">Compliance</span>
                   <span className="text-on-surface font-bold text-xs flex items-center gap-1">
                     <span className="material-symbols-outlined text-primary text-[14px]">verified</span>
                     Verified
                   </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                form="entity-form"
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
                    {isEditing ? 'Update Configuration' : 'Finalize & Register'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/entities')}
                className="w-full py-3 rounded-2xl bg-surface-container-high text-on-surface-variant font-bold text-sm hover:bg-error-container hover:text-on-error-container active:scale-[0.98] transition-all"
              >
                Discard Changes
              </button>
            </div>

            <div className="mt-8 p-4 bg-primary-container/20 rounded-2xl border border-primary-container/30">
              <p className="text-[11px] text-on-primary-container leading-relaxed font-medium">
                <span className="material-symbols-outlined text-[14px] align-middle mr-1" data-weight="fill">info</span>
                Entity modifications affect <span className="font-bold">user associations</span> and reporting hierarchies throughout the regional distribution system.
              </p>
            </div>
          </div>
          
          <div className="bg-on-secondary-fixed text-white/70 p-6 rounded-3xl editorial-shadow">
            <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4">Distribution Meta</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between">
                <span className="opacity-70">Type</span>
                <span className="text-white font-medium uppercase">{formData.entity_type}</span>
              </li>
              <li className="flex justify-between">
                <span className="opacity-70">Region</span>
                <span className="text-white font-medium">Global North</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
