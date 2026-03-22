import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import {
  createCustomFieldDefinition,
  updateCustomFieldDefinition,
  getCustomFieldDefinition,
} from '../../api/custom-fields'
import type {
  CustomFieldDefinitionCreateRequest,
  CustomFieldDefinitionUpdateRequest,
} from '../../types/api'

type FieldType = 'text' | 'number' | 'checkbox' | 'select'

interface FormData {
  resource_name: string
  field_key: string
  field_label: string
  field_type: FieldType
  hint: string
  possible_values: string
  is_mandatory: boolean
  tag: string
}

const initialFormData: FormData = {
  resource_name: 'PurchaseOrder',
  field_key: '',
  field_label: '',
  field_type: 'text',
  hint: '',
  possible_values: '',
  is_mandatory: false,
  tag: '',
}

const RESOURCE_OPTIONS = ['PurchaseOrder', 'User', 'Entity']
const FIELD_TYPES = ['text', 'number', 'checkbox', 'select']

export function CustomFieldDefinitionFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()

  const isEditing = !!id
  const definitionId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      if (isEditing && definitionId) {
        try {
          const data = await getCustomFieldDefinition(definitionId)
          const validFieldTypes: FieldType[] = ['text', 'number', 'checkbox', 'select']
          const fieldType = validFieldTypes.includes(data.field_type as FieldType) 
            ? data.field_type as FieldType 
            : 'text'
          setFormData({
            resource_name: data.resource_name || 'PurchaseOrder',
            field_key: data.field_key || '',
            field_label: data.field_label || '',
            field_type: fieldType,
            hint: data.hint || '',
            possible_values: Array.isArray(data.possible_values) 
              ? data.possible_values.join(', ') 
              : (data.possible_values as string) || '',
            is_mandatory: data.is_mandatory,
            tag: data.tag || '',
          })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load definition')
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, definitionId])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.resource_name.trim()) errors.resource_name = 'Resource name is required'
    if (!formData.field_key.trim()) errors.field_key = 'Field key is required'
    if (!formData.field_label.trim()) errors.field_label = 'Field label is required'
    if (!formData.field_type) errors.field_type = 'Field type is required'

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
        resource_name: formData.resource_name,
        field_key: formData.field_key,
        field_label: formData.field_label,
        field_type: formData.field_type,
        hint: formData.hint || null,
        possible_values: formData.field_type === 'select' ? formData.possible_values : null,
        is_mandatory: formData.is_mandatory,
        tag: formData.tag || null,
      }

      if (isEditing && definitionId) {
        await updateCustomFieldDefinition(definitionId, payload as CustomFieldDefinitionUpdateRequest)
      } else {
        await createCustomFieldDefinition(payload as CustomFieldDefinitionCreateRequest)
      }

      navigate('/custom-field-definitions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save definition')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }))

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="max-w-screen-xl mx-auto min-h-screen pt-12 pb-20 px-6">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/custom-field-definitions')}>Field Definitions</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">{isEditing ? 'Edit Field' : 'New Field'}</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            {isEditing ? 'Update Field' : 'Create Custom Field'}
          </h1>
          <p className="text-on-surface-variant font-light max-w-xl">
            Define attributes for your data models. These fields will be dynamically rendered across the application based on the resource and tag.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => navigate('/custom-field-definitions')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="definition-form"
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
                {isEditing ? 'Save Changes' : 'Register Field'}
              </>
            )}
          </button>
        </div>
      </header>

      {error && <div className="mb-8 max-w-4xl mx-auto"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <form id="definition-form" onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_attributes</span>
                Field Configuration
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Field Label <span className="text-error">*</span></label>
                  <input
                    type="text"
                    name="field_label"
                    value={formData.field_label}
                    onChange={handleChange}
                    placeholder="e.g. Estimated Delivery Date"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface ${validationErrors.field_label ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                  {validationErrors.field_label && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.field_label}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Field Key (API Reference) <span className="text-error">*</span></label>
                  <input
                    type="text"
                    name="field_key"
                    value={formData.field_key}
                    onChange={handleChange}
                    placeholder="e.g. est_delivery_date"
                    className={`w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface font-mono text-sm ${validationErrors.field_key ? 'ring-2 ring-error/20' : 'focus:ring-primary-container/40'}`}
                  />
                  {validationErrors.field_key && <p className="text-[10px] font-bold text-error ml-1 mt-1">{validationErrors.field_key}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Field Type <span className="text-error">*</span></label>
                  <select
                    name="field_type"
                    value={formData.field_type}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                  >
                    {FIELD_TYPES.map(opt => (
                      <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Target Resource <span className="text-error">*</span></label>
                  <select
                    name="resource_name"
                    value={formData.resource_name}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                  >
                    {RESOURCE_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Tag (Contextual filter)</label>
                  <input
                    type="text"
                    name="tag"
                    value={formData.tag}
                    onChange={handleChange}
                    placeholder="e.g. standard"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Hint / Tooltip</label>
                  <input
                    type="text"
                    name="hint"
                    value={formData.hint}
                    onChange={handleChange}
                    placeholder="Brief description for the user..."
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                  />
                </div>

                {formData.field_type === 'select' && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Possible Values (Comma separated)</label>
                    <textarea
                      name="possible_values"
                      rows={2}
                      value={formData.possible_values}
                      onChange={handleChange}
                      placeholder="Option 1, Option 2, Option 3"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface resize-none focus:ring-primary-container/40"
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl md:col-span-2">
                  <input
                    type="checkbox"
                    id="is_mandatory"
                    name="is_mandatory"
                    checked={formData.is_mandatory}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-outline-variant/30 text-primary focus:ring-primary-container/40 bg-white"
                  />
                  <label htmlFor="is_mandatory" className="text-sm font-bold text-on-surface-variant">Required Field (Mandatory)</label>
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  )
}
