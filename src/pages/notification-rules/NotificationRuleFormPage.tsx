import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createNotificationRule, updateNotificationRule, getNotificationRule } from '../../api/notification-rules'
import { listEntities } from '../../api/entities'
import { listPoStates } from '../../api/po-states'
import type {
  NotificationRuleCreateRequest,
  NotificationRuleUpdateRequest,
  EntityResponse,
  PoStateResponse,
  NotificationPartyRole,
  NotificationChannel,
} from '../../types/api'

interface FormData {
  entity_id: number | ''
  po_state_id: number | ''
  party_role: NotificationPartyRole
  channels: NotificationChannel[]
  template_id: string
  subject_template: string
  is_active: boolean
  delay_minutes: number
  additional_params: string // JSON string for editing
}

const initialFormData: FormData = {
  entity_id: '',
  po_state_id: '',
  party_role: 'seller',
  channels: ['email'],
  template_id: '',
  subject_template: '',
  is_active: true,
  delay_minutes: 0,
  additional_params: '{}',
}

const ROLE_LABELS: Record<string, string> = {
  seller: 'Seller',
  logistics: 'Logistics',
  buyer: 'Buyer',
  internal_manager: 'Internal Man',
}

const PARTY_ROLES: NotificationPartyRole[] = ['seller', 'logistics', 'buyer', 'internal_manager']
const CHANNELS: NotificationChannel[] = ['email', 'whatsapp', 'sms']

export function NotificationRuleFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers, canManageAllUsers, user } = useAuth()

  const isEditing = !!id
  const ruleId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [poStates, setPoStates] = useState<PoStateResponse[]>([])
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
        setPoStates(statesData)

        if (isEditing && ruleId) {
          const ruleData = await getNotificationRule(ruleId)
          setFormData({
            entity_id: ruleData.entity_id,
            po_state_id: ruleData.po_state_id,
            party_role: ruleData.party_role,
            channels: ruleData.channels || ['email'],
            template_id: ruleData.template_id || '',
            subject_template: ruleData.subject_template || '',
            is_active: ruleData.is_active,
            delay_minutes: ruleData.delay_minutes,
            additional_params: JSON.stringify(ruleData.additional_params || {}, null, 2),
          })
        } else if (user?.entity_id) {
          setFormData(prev => ({ ...prev, entity_id: user.entity_id }))
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') {
          throw err
        }
        setError('Failed to load required data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, ruleId])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.entity_id) errors.entity_id = 'Entity is required'
    if (!formData.po_state_id) errors.po_state_id = 'Trigger state is required'
    if (!formData.party_role) errors.party_role = 'Recipient role is required'
    if (!formData.channels.length) errors.channels = 'At least one channel is required'
    
    try {
      JSON.parse(formData.additional_params)
    } catch (e) {
      errors.additional_params = 'Invalid JSON format'
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
      const payload = {
        entity_id: formData.entity_id as number,
        po_state_id: formData.po_state_id as number,
        party_role: formData.party_role,
        channels: formData.channels,
        template_id: formData.template_id || null,
        subject_template: formData.subject_template || null,
        is_active: formData.is_active,
        delay_minutes: formData.delay_minutes,
        additional_params: JSON.parse(formData.additional_params),
      }

      if (isEditing && ruleId) {
        await updateNotificationRule(ruleId, payload as NotificationRuleUpdateRequest)
      } else {
        await createNotificationRule(payload as NotificationRuleCreateRequest)
      }

      navigate('/notification-rules')
    } catch (err) {
      if (err instanceof Error && err.name === 'AuthError') {
        throw err
      }
      setError(err instanceof Error ? err.message : 'Failed to save notification rule')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChannelToggle = (channel: NotificationChannel) => {
    setFormData(prev => {
      const already = prev.channels.includes(channel)
      const updated = already ? prev.channels.filter(c => c !== channel) : [...prev.channels, channel]
      return { ...prev, channels: updated }
    })
    if (validationErrors.channels) {
      setValidationErrors(prev => ({ ...prev, channels: '' }))
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    let finalValue: any = value
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked
    } else if (type === 'number') {
      finalValue = parseInt(value, 10)
    } else if (name === 'entity_id' || name === 'po_state_id') {
      finalValue = value === '' ? '' : parseInt(value, 10)
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="max-w-screen-xl mx-auto min-h-screen pt-12 pb-20 px-6">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/notification-rules')}>Notification Rules</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{isEditing ? 'Edit Rule' : 'New Rule'}</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            {isEditing ? 'Configure Rule' : 'Create Notification Rule'}
          </h1>
          <p className="text-on-surface-variant font-light max-w-xl">
            Automate your supply chain communications by defining who gets notified and how when POs change state.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => navigate('/notification-rules')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="rule-form"
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
                {isEditing ? 'Save Changes' : 'Create Rule'}
              </>
            )}
          </button>
        </div>
      </header>

      {error && <div className="mb-8 max-w-4xl mx-auto"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <form id="rule-form" onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">settings</span>
                Rule Logic
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5">
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
                    {entities.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  {validationErrors.entity_id && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.entity_id}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="po_state_id" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Trigger State <span className="text-error">*</span></label>
                  <select
                    id="po_state_id"
                    name="po_state_id"
                    value={formData.po_state_id}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.po_state_id ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  >
                    <option value="">Select State</option>
                    {poStates.filter(s => s.entity_id === formData.entity_id || !formData.entity_id).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.system_code})</option>
                    ))}
                  </select>
                  {validationErrors.po_state_id && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.po_state_id}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="party_role" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Recipient Role <span className="text-error">*</span></label>
                  <select
                    id="party_role"
                    name="party_role"
                    value={formData.party_role}
                    onChange={handleChange}
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none ${validationErrors.party_role ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  >
                    {PARTY_ROLES.map(role => (
                      <option key={role} value={role}>{ROLE_LABELS[role] || role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Channels <span className="text-error">*</span></label>
                  <div className={`flex gap-4 flex-wrap px-4 py-3 bg-surface-container-low rounded-xl ${validationErrors.channels ? 'ring-2 ring-error/20' : ''}`}>
                    {CHANNELS.map(ch => (
                      <label key={ch} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.channels.includes(ch)}
                          onChange={() => handleChannelToggle(ch)}
                          className="w-4 h-4 rounded border-none bg-surface-container-high text-primary focus:ring-offset-0 focus:ring-primary transition-all cursor-pointer"
                        />
                        <span className="text-sm font-medium capitalize">{ch}</span>
                      </label>
                    ))}
                  </div>
                  {validationErrors.channels && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.channels}</p>}
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">description</span>
                Template Configuration
              </h2>
              
              <div className="grid grid-cols-1 gap-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="template_id" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Template Identifier</label>
                  <input
                    id="template_id"
                    type="text"
                    name="template_id"
                    value={formData.template_id}
                    onChange={handleChange}
                    placeholder="e.g. po_approved_seller or WhatsApp Template ID"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                  />
                  <p className="text-[10px] text-on-surface-variant ml-1 font-medium">Bird template name for WhatsApp/SMS, or Rails mailer template for Email.</p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject_template" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Subject Template (Email Only)</label>
                  <input
                    id="subject_template"
                    type="text"
                    name="subject_template"
                    value={formData.subject_template}
                    onChange={handleChange}
                    placeholder="e.g. PO {{po_number}} has been approved"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="delay_minutes" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Delay (Minutes)</label>
                    <input
                      id="delay_minutes"
                      type="number"
                      name="delay_minutes"
                      value={formData.delay_minutes}
                      onChange={handleChange}
                      min="0"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 pt-6">
                    <input
                      id="is_active"
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-5 h-5 rounded-md border-none bg-surface-container-high text-primary focus:ring-offset-0 focus:ring-primary transition-all cursor-pointer"
                    />
                    <label htmlFor="is_active" className="text-sm font-bold text-on-surface cursor-pointer">Rule is Active</label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="additional_params" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Additional Parameters (JSON)</label>
                  <textarea
                    id="additional_params"
                    name="additional_params"
                    rows={5}
                    value={formData.additional_params}
                    onChange={handleChange}
                    placeholder="{}"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-mono text-xs text-on-surface resize-none ${validationErrors.additional_params ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                  {validationErrors.additional_params && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.additional_params}</p>}
                </div>
              </div>
            </section>
          </form>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/40 editorial-shadow sticky top-8">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Rule Overview</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                 <span className="text-on-surface-variant text-sm font-light">Status</span>
                 <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${formData.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container-high text-outline'}`}>
                   {formData.is_active ? 'Active' : 'Paused'}
                 </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                 <span className="text-on-surface-variant text-sm font-light">Channel</span>
                 <span className="text-on-surface font-bold text-xs uppercase tracking-widest">{formData.channels.join(' + ') || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10">
                 <span className="text-on-surface-variant text-sm font-light">Recipient</span>
                 <span className="text-on-surface font-bold text-xs capitalize">{ROLE_LABELS[formData.party_role] || formData.party_role.replace('_', ' ')}</span>
              </div>
            </div>

            <button
              type="submit"
              form="rule-form"
              disabled={isSaving}
              className="w-full py-4 rounded-2xl bg-gradient-to-br from-primary to-primary-fixed-dim text-on-primary font-bold text-center editorial-shadow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-3"
            >
              {isSaving ? 'Saving...' : (isEditing ? 'Update Rule' : 'Create Rule')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/notification-rules')}
              className="w-full py-3 rounded-2xl bg-surface-container-high text-on-surface-variant font-bold text-sm hover:bg-error-container hover:text-on-error-container active:scale-[0.98] transition-all"
            >
              Cancel
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
