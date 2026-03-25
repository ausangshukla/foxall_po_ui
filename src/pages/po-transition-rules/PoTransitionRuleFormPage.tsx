import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createPoTransitionRule, updatePoTransitionRule, getPoTransitionRule } from '../../api/po-transition-rules'
import { listPoStates } from '../../api/po-states'
import { listEntities } from '../../api/entities'
import type {
  PoTransitionRuleCreateRequest,
  PoTransitionRuleUpdateRequest,
  PoStateResponse,
  EntityResponse,
} from '../../types/api'

interface FormData {
  entity_id: number | ''
  from_state_id: number | '' | null
  to_state_id: number | ''
  allowed_role: string
  requires_comment: boolean
  requires_attachment: boolean
  auto_transition: boolean
  is_magic_link_enabled: boolean
}

const initialFormData: FormData = {
  entity_id: '',
  from_state_id: '',
  to_state_id: '',
  allowed_role: '',
  requires_comment: false,
  requires_attachment: false,
  auto_transition: false,
  is_magic_link_enabled: false,
}

const ROLES = ['super', 'admin', 'internal_manager', 'internal_user', 'seller', 'logistics', 'carrier']

export function PoTransitionRuleFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers, canManageAllUsers, user } = useAuth()

  const isEditing = !!id
  const ruleId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [states, setStates] = useState<PoStateResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      try {
        const [entitiesData, statesData] = await Promise.all([
          listEntities(),
          listPoStates(),
        ])
        setEntities(entitiesData)
        setStates(statesData)

        if (isEditing && ruleId) {
          const ruleData = await getPoTransitionRule(ruleId)
          setFormData({
            entity_id: ruleData.entity_id,
            from_state_id: ruleData.from_state_id,
            to_state_id: ruleData.to_state_id,
            allowed_role: ruleData.allowed_role,
            requires_comment: ruleData.requires_comment,
            requires_attachment: ruleData.requires_attachment,
            auto_transition: ruleData.auto_transition,
            is_magic_link_enabled: ruleData.is_magic_link_enabled,
          })
        } else if (user?.entity_id) {
          setFormData(prev => ({ ...prev, entity_id: user.entity_id }))
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        setError('Failed to load transition rule data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, ruleId])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.entity_id) errors.entity_id = 'Entity is required'
    if (!formData.to_state_id) errors.to_state_id = 'To state is required'
    if (!formData.allowed_role) errors.allowed_role = 'Allowed role is required'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!validateForm()) return
    setIsSaving(true)

    try {
      const payload: PoTransitionRuleCreateRequest = {
        entity_id: formData.entity_id as number,
        from_state_id: formData.from_state_id === '' ? null : formData.from_state_id,
        to_state_id: formData.to_state_id as number,
        allowed_role: formData.allowed_role,
        requires_comment: formData.requires_comment,
        requires_attachment: formData.requires_attachment,
        auto_transition: formData.auto_transition,
        is_magic_link_enabled: formData.is_magic_link_enabled,
      }

      if (isEditing && ruleId) {
        await updatePoTransitionRule(ruleId, payload as PoTransitionRuleUpdateRequest)
      } else {
        await createPoTransitionRule(payload)
      }
      navigate('/po-transition-rules')
    } catch (err) {
      if (err instanceof Error && err.name === 'AuthError') {
        throw err
      }
      setError(err instanceof Error ? err.message : 'Failed to save transition rule')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    let finalValue: any = value
    if (type === 'checkbox') finalValue = (e.target as HTMLInputElement).checked
    else if (name === 'entity_id') finalValue = value === '' ? '' : parseInt(value, 10)
    else if (name === 'from_state_id') finalValue = value === '' ? '' : parseInt(value, 10)
    else if (name === 'to_state_id') finalValue = value === '' ? '' : parseInt(value, 10)

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
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/po-transition-rules')}>Transition Rules</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{isEditing ? 'Edit Rule' : 'New Rule'}</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            {isEditing ? 'Configure Rule' : 'Create Transition Rule'}
          </h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/po-transition-rules')} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancel</button>
          <button type="submit" form="rule-form" disabled={isSaving} className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-fixed-dim editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2">
            {isSaving ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </header>

      {error && <div className="mb-8 max-w-4xl mx-auto"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <form id="rule-form" onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">route</span>Transition Logic</h2>
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
                  <label htmlFor="from_state_id" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">From State (Start)</label>
                  <select id="from_state_id" name="from_state_id" value={formData.from_state_id === null ? '' : formData.from_state_id} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 appearance-none">
                    <option value="">Any State (Initial)</option>
                    {states.filter(s => s.entity_id === formData.entity_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="to_state_id" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">To State (Target) <span className="text-error">*</span></label>
                  <select id="to_state_id" name="to_state_id" value={formData.to_state_id} onChange={handleChange} className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 appearance-none ${validationErrors.to_state_id ? 'ring-2 ring-error/20' : ''}`}>
                    <option value="">Select Target State</option>
                    {states.filter(s => s.entity_id === formData.entity_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="allowed_role" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Allowed Role <span className="text-error">*</span></label>
                  <select id="allowed_role" name="allowed_role" value={formData.allowed_role} onChange={handleChange} className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 appearance-none ${validationErrors.allowed_role ? 'ring-2 ring-error/20' : ''}`}>
                    <option value="">Select Role</option>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ').charAt(0).toUpperCase() + r.replace('_', ' ').slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </section>
            
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">security</span>Requirements & Triggers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="flex flex-col gap-6">
                   <div className="flex items-center gap-3">
                    <input id="requires_comment" type="checkbox" name="requires_comment" checked={formData.requires_comment} onChange={handleChange} className="w-5 h-5 rounded" />
                    <label htmlFor="requires_comment" className="text-sm font-bold text-on-surface cursor-pointer flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary text-lg">chat_bubble</span>
                       Requires Comment
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input id="requires_attachment" type="checkbox" name="requires_attachment" checked={formData.requires_attachment} onChange={handleChange} className="w-5 h-5 rounded" />
                    <label htmlFor="requires_attachment" className="text-sm font-bold text-on-surface cursor-pointer flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary text-lg">attach_file</span>
                       Requires Attachment
                    </label>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <input id="auto_transition" type="checkbox" name="auto_transition" checked={formData.auto_transition} onChange={handleChange} className="w-5 h-5 rounded" />
                    <label htmlFor="auto_transition" className="text-sm font-bold text-on-surface cursor-pointer flex items-center gap-2">
                       <span className="material-symbols-outlined text-tertiary text-lg">smart_toy</span>
                       Auto Transition (System Trigger)
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input id="is_magic_link_enabled" type="checkbox" name="is_magic_link_enabled" checked={formData.is_magic_link_enabled} onChange={handleChange} className="w-5 h-5 rounded" />
                    <label htmlFor="is_magic_link_enabled" className="text-sm font-bold text-on-surface cursor-pointer flex items-center gap-2">
                       <span className="material-symbols-outlined text-secondary text-lg">link</span>
                       Enable Magic Link (External Access)
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  )
}
