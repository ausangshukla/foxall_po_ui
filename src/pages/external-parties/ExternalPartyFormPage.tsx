import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createExternalParty, updateExternalParty, getExternalParty } from '../../api/external-parties'
import type { ExternalPartyCreateRequest, ExternalPartyType } from '../../types/api'

interface FormData {
  entity_id: number
  purchase_order_id: number
  party_type: ExternalPartyType
  name: string
  email: string
  phone: string
  whatsapp_country_code: string
  whatsapp_number: string
  company_name: string
  address: string
  prefers_whatsapp: boolean
  opt_out: boolean
}

const initialFormData: FormData = {
  entity_id: 0,
  purchase_order_id: 0,
  party_type: 'seller',
  name: '',
  email: '',
  phone: '',
  whatsapp_country_code: '',
  whatsapp_number: '',
  company_name: '',
  address: '',
  prefers_whatsapp: false,
  opt_out: false,
}

const PARTY_TYPES: { value: ExternalPartyType; label: string }[] = [
  { value: 'seller', label: 'Seller' },
  { value: 'logistics', label: 'Logistics Provider' },
  { value: 'carrier', label: 'Carrier' },
]

const COUNTRY_CODES = ['1', '44', '91', '61', '81', '86', '49', '33', '39', '34', '52', '55', '7', '82', '65']

export function ExternalPartyFormPage() {
  const { id, poId } = useParams<{ id: string; poId?: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { user } = useAuth()
  const isEditing = !!id
  const partyId = id ? parseInt(id, 10) : null
  const preSelectedPoId = poId ? parseInt(poId, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return
    const loadData = async () => {
      if (isEditing && partyId) {
        try {
          const data = await getExternalParty(partyId)
          setFormData({
            entity_id: data.entity_id,
            purchase_order_id: data.purchase_order_id,
            party_type: data.party_type,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            whatsapp_country_code: data.whatsapp_country_code || '',
            whatsapp_number: data.whatsapp_number || '',
            company_name: data.company_name || '',
            address: data.address || '',
            prefers_whatsapp: data.prefers_whatsapp,
            opt_out: data.opt_out,
          })
        } catch (err) {
          setError('Failed to load data')
        } finally { setIsLoading(false) }
      } else {
        setFormData(prev => ({ ...prev, entity_id: user?.entity_id || 0, purchase_order_id: preSelectedPoId || 0 }))
        setIsLoading(false)
      }
    }
    loadData()
  }, [isAuth, isEditing, partyId, preSelectedPoId, user])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!(formData.name || '').trim()) errors.name = 'Name is required'
    if (!formData.entity_id) errors.entity_id = 'Entity is required'
    if (!formData.purchase_order_id) errors.purchase_order_id = 'PO is required'
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSaving(true)
    try {
      const data = { ...formData }
      if (isEditing && partyId) await updateExternalParty(partyId, data)
      else await createExternalParty(data as ExternalPartyCreateRequest)
      navigate('/external-parties')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally { setIsSaving(false) }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
  }

  if (!isAuth || isLoading) return <LoadingSpinner />

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">{isEditing ? 'Edit' : 'Add'} External Party</h1>
      {error && <AlertMessage variant="danger" message={error} />}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold">Name *</label>
            <input name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" />
            {validationErrors.name && <p className="text-red-500 text-xs">{validationErrors.name}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Party Type *</label>
            <select name="party_type" value={formData.party_type} onChange={handleChange} className="w-full border rounded-lg px-4 py-2">
              {PARTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Company Name</label>
            <input name="company_name" value={formData.company_name} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Email</label>
            <input name="email" value={formData.email} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">Phone</label>
            <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" />
          </div>
          <div className="flex gap-4">
            <div className="space-y-1 flex-1">
              <label className="text-sm font-semibold">WhatsApp Country Code</label>
              <select name="whatsapp_country_code" value={formData.whatsapp_country_code} onChange={handleChange} className="w-full border rounded-lg px-4 py-2">
                <option value="">None</option>
                {COUNTRY_CODES.map(c => <option key={c} value={c}>+{c}</option>)}
              </select>
            </div>
            <div className="space-y-1 flex-2">
              <label className="text-sm font-semibold">WhatsApp Number</label>
              <input name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">Address</label>
          <textarea name="address" value={formData.address} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" rows={3} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold">Entity ID *</label>
            <input name="entity_id" type="number" value={formData.entity_id} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">PO ID *</label>
            <input name="purchase_order_id" type="number" value={formData.purchase_order_id} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2"><input type="checkbox" name="prefers_whatsapp" checked={formData.prefers_whatsapp} onChange={handleChange} /> Prefers WhatsApp</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="opt_out" checked={formData.opt_out} onChange={handleChange} /> Opt Out</label>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button type="button" onClick={() => navigate('/external-parties')} className="px-6 py-2 border rounded-lg font-bold">Cancel</button>
          <button disabled={isSaving} className="px-6 py-2 bg-primary text-white rounded-lg font-bold disabled:opacity-50">{isSaving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
