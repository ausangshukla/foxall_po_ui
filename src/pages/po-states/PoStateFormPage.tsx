import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createPoState, updatePoState, getPoState } from '../../api/po-states'
import { listEntities } from '../../api/entities'
import type {
  PoStateCreateRequest,
  PoStateUpdateRequest,
  EntityResponse,
} from '../../types/api'

interface FormData {
  entity_id: number | ''
  name: string
  system_code: string
  category: 'open' | 'in_transit' | 'closed' | 'exception'
  magic_link_expiry_minutes: number | ''
  description: string
  position: number
  is_terminal: boolean
  is_default: boolean
}

const initialFormData: FormData = {
  entity_id: '',
  name: '',
  system_code: '',
  category: 'open',
  magic_link_expiry_minutes: '',
  description: '',
  position: 0,
  is_terminal: false,
  is_default: false,
}

const CATEGORIES = ['open', 'in_transit', 'closed', 'exception']

export function PoStateFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers, canManageAllUsers, user } = useAuth()

  const isEditing = !!id
  const stateId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      try {
        const entitiesData = await listEntities()
        setEntities(entitiesData)

        if (isEditing && stateId) {
          const stateData = await getPoState(stateId)
          setFormData({
            entity_id: stateData.entity_id,
            name: stateData.name,
            system_code: stateData.system_code,
            category: stateData.category,
            magic_link_expiry_minutes: stateData.magic_link_expiry_minutes || '',
            description: stateData.description || '',
            position: stateData.position,
            is_terminal: stateData.is_terminal,
            is_default: stateData.is_default,
          })
        } else if (user?.entity_id) {
          setFormData(prev => ({ ...prev, entity_id: user.entity_id }))
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        setError('Failed to load PO state data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, stateId])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.entity_id) errors.entity_id = 'Entity is required'
    if (!formData.name) errors.name = 'Name is required'
    if (!formData.system_code) errors.system_code = 'System code is required'
    if (!formData.category) errors.category = 'Category is required'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateForm()) return
    setIsSaving(true)

    try {
      const payload = {
        entity_id: formData.entity_id as number,
        name: formData.name,
        system_code: formData.system_code,
        category: formData.category,
        magic_link_expiry_minutes: formData.magic_link_expiry_minutes === '' ? null : formData.magic_link_expiry_minutes,
        description: formData.description || null,
        position: formData.position,
        is_terminal: formData.is_terminal,
        is_default: formData.is_default,
      }

      if (isEditing && stateId) {
        await updatePoState(stateId, payload as PoStateUpdateRequest)
      } else {
        await createPoState(payload as PoStateCreateRequest)
      }
      navigate('/po-states')
    } catch (err) {
      if (err instanceof Error && err.name === 'AuthError') {
        throw err
      }
      setError(err instanceof Error ? err.message : 'Failed to save PO state')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let finalValue: any = value
    if (type === 'checkbox') finalValue = (e.target as HTMLInputElement).checked
    else if (type === 'number') finalValue = parseInt(value, 10)
    else if (name === 'entity_id') finalValue = value === '' ? '' : parseInt(value, 10)
    else if (name === 'magic_link_expiry_minutes') finalValue = value === '' ? '' : parseInt(value, 10)

    setFormData(prev => ({ ...prev, [name]: finalValue }))
    if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }))
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="max-w-screen-xl mx-auto min-h-screen pt-12 pb-20 px-6">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/po-states')}>PO States</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{isEditing ? 'Edit State' : 'New State'}</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            {isEditing ? 'Configure State' : 'Create PO State'}
          </h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/po-states')} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancel</button>
          <button type="submit" form="state-form" disabled={isSaving} className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-fixed-dim editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2">
            {isSaving ? 'Saving...' : 'Save State'}
          </button>
        </div>
      </header>

      {error && <div className="mb-8 max-w-4xl mx-auto"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <form id="state-form" onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">analytics</span>Core Logic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="entity_id" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Entity <span className="text-error">*</span></label>
                  <select 
                    id="entity_id" 
                    name="entity_id" 
                    value={formData.entity_id} 
                    onChange={handleChange} 
                    disabled={!canManageAllUsers()}
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.entity_id ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'} ${!canManageAllUsers() ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Entity</option>
                    {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Display Name <span className="text-error">*</span></label>
                  <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="system_code" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">System Code <span className="text-error">*</span></label>
                  <input id="system_code" type="text" name="system_code" value={formData.system_code} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="category" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Category <span className="text-error">*</span></label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 appearance-none">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').charAt(0).toUpperCase() + c.replace('_', ' ').slice(1)}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="position" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Order Position</label>
                  <input id="position" type="number" name="position" value={formData.position} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                </div>
              </div>
            </section>
            
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">star</span>Advanced Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="magic_link_expiry_minutes" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Magic Link Expiry (Min)</label>
                  <input id="magic_link_expiry_minutes" type="number" name="magic_link_expiry_minutes" value={formData.magic_link_expiry_minutes} onChange={handleChange} placeholder="NULL = No link" className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3" />
                </div>
                <div className="flex flex-col justify-center gap-4 pt-6">
                  <div className="flex items-center gap-3">
                    <input id="is_terminal" type="checkbox" name="is_terminal" checked={formData.is_terminal} onChange={handleChange} className="w-5 h-5" />
                    <label htmlFor="is_terminal" className="text-sm font-bold text-on-surface cursor-pointer">Is Terminal State</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input id="is_default" type="checkbox" name="is_default" checked={formData.is_default} onChange={handleChange} className="w-5 h-5" />
                    <label htmlFor="is_default" className="text-sm font-bold text-on-surface cursor-pointer">Is Default State</label>
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="description" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Description</label>
                  <textarea id="description" name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 resize-none" />
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  )
}
