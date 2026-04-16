import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { freightContractRatesApi } from '../../../api/freight-contract-rates'
import { listExternalParties } from '../../../api/external-parties'
import type { FreightContractRate, ExternalPartyResponse } from '../../../types/api'
import { LoadingSpinner, AlertMessage } from '../../../components/common'

export default function FreightRateForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [carriers, setCarriers] = useState<ExternalPartyResponse[]>([])

  const [formData, setFormData] = useState<Partial<FreightContractRate>>({
    carrier_name: '',
    origin_port: '',
    destination_port: '',
    transport_mode: 'ocean_fcl',
    container_type: '',
    rate_usd: 0,
    currency: 'USD',
    valid_from: '',
    valid_to: '',
    notes: ''
  })

  useEffect(() => {
    const fetchCarriers = async () => {
      try {
        const response = await listExternalParties()
        setCarriers(response.filter(c => c.party_type === 'carrier'))
      } catch (err) {
        console.error('Failed to load carriers', err)
      }
    }

    const fetchRate = async () => {
      if (!id) return
      try {
        const rate = await freightContractRatesApi.get(Number(id))
        setFormData(rate)
      } catch (err: any) {
        setError(err.message || 'Failed to load rate')
      } finally {
        setLoading(false)
      }
    }

    fetchCarriers()
    fetchRate()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'rate_usd' ? parseFloat(value) || 0 : value 
    }))
  }

  const handleCarrierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const carrierId = e.target.value
    const carrier = carriers.find(c => c.id.toString() === carrierId)
    
    setFormData(prev => ({
      ...prev,
      carrier_entity_id: carrierId ? Number(carrierId) : undefined,
      carrier_name: carrier ? carrier.name : prev.carrier_name
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (isEdit) {
        await freightContractRatesApi.update(Number(id), formData)
      } else {
        await freightContractRatesApi.create(formData)
      }
      navigate('/settings/freight-rates')
    } catch (err: any) {
      setError(err.message || 'Failed to save rate')
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-10"><LoadingSpinner /></div>

  return (
    <div className="max-w-screen-xl mx-auto min-h-screen pt-12 pb-20 px-6">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant mb-3 tracking-[0.2em] uppercase">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/settings/freight-rates')}>Freight Rates</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>{isEdit ? formData.carrier_name : 'New Rate'}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary">Edit Configuration</span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-fixed mb-2 font-headline">
            {isEdit ? 'Configure Contract Rate' : 'Register New Contract Rate'}
          </h1>
          <p className="text-on-surface-variant font-light max-w-xl">
            Define pre-negotiated carrier rates for automated booking and rate shopping.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => navigate('/settings/freight-rates')}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="freight-rate-form"
            disabled={saving}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-fixed-dim editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            {saving ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isEdit ? 'Save Changes' : 'Register Rate'}
              </>
            )}
          </button>
        </div>
      </header>

      {error && <div className="mb-8 max-w-4xl mx-auto"><AlertMessage variant="danger" message={error} /></div>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <form id="freight-rate-form" onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20 animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">directions_boat</span>
                Carrier & Lane Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="carrier_entity_id" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Carrier Entity</label>
                  <select
                    id="carrier_entity_id"
                    name="carrier_entity_id"
                    value={formData.carrier_entity_id || ''}
                    onChange={handleCarrierChange}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                  >
                    <option value="">Select a carrier (optional)</option>
                    {carriers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="carrier_name" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Carrier Name <span className="text-error">*</span></label>
                  <input
                    id="carrier_name"
                    type="text"
                    name="carrier_name"
                    required
                    value={formData.carrier_name || ''}
                    onChange={handleChange}
                    placeholder="e.g. Maersk"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="origin_port" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Origin Port <span className="text-error">*</span></label>
                  <input
                    id="origin_port"
                    type="text"
                    name="origin_port"
                    required
                    value={formData.origin_port || ''}
                    onChange={handleChange}
                    placeholder="e.g. CNSHA"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40 uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="destination_port" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Destination Port <span className="text-error">*</span></label>
                  <input
                    id="destination_port"
                    type="text"
                    name="destination_port"
                    required
                    value={formData.destination_port || ''}
                    onChange={handleChange}
                    placeholder="e.g. DEHAM"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40 uppercase"
                  />
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20 animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">payments</span>
                Pricing & Mode
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="transport_mode" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Transport Mode <span className="text-error">*</span></label>
                  <select
                    id="transport_mode"
                    name="transport_mode"
                    required
                    value={formData.transport_mode || 'ocean_fcl'}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface appearance-none focus:ring-primary-container/40"
                  >
                    <option value="ocean_fcl">Ocean FCL</option>
                    <option value="ocean_lcl">Ocean LCL</option>
                    <option value="air">Air</option>
                    <option value="road">Road</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="container_type" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Container Type</label>
                  <input
                    id="container_type"
                    type="text"
                    name="container_type"
                    value={formData.container_type || ''}
                    onChange={handleChange}
                    placeholder="e.g. 40GP, 20GP"
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="rate_usd" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Rate <span className="text-error">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
                    <input
                      id="rate_usd"
                      type="number"
                      step="0.01"
                      name="rate_usd"
                      required
                      value={formData.rate_usd || ''}
                      onChange={handleChange}
                      className="w-full bg-surface-container-low border-none rounded-xl pl-8 pr-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="currency" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Currency <span className="text-error">*</span></label>
                  <input
                    id="currency"
                    type="text"
                    name="currency"
                    required
                    value={formData.currency || 'USD'}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40 uppercase"
                  />
                </div>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20 animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
              <h2 className="text-xl font-bold text-on-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event</span>
                Validity & Notes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <div className="space-y-1.5">
                  <label htmlFor="valid_from" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Valid From <span className="text-error">*</span></label>
                  <input
                    id="valid_from"
                    type="date"
                    name="valid_from"
                    required
                    value={formData.valid_from || ''}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="valid_to" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Valid To <span className="text-error">*</span></label>
                  <input
                    id="valid_to"
                    type="date"
                    name="valid_to"
                    required
                    value={formData.valid_to || ''}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="notes" className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={formData.notes || ''}
                    onChange={handleChange}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium text-on-surface focus:ring-primary-container/40 resize-none"
                  />
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-white/20 sticky top-24">
            <h3 className="text-lg font-bold text-on-primary-container mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              Configuration Guide
            </h3>
            <div className="space-y-4 text-sm text-on-surface-variant font-medium leading-relaxed">
              <p>
                Contract rates are automatically applied to purchase orders when the lane and transport mode match.
              </p>
              <div className="p-4 bg-surface-container-low rounded-xl border-l-4 border-primary">
                <p className="font-bold text-on-surface mb-1">Date Overlaps</p>
                <p className="text-xs">The system prevents overlapping date ranges for the same origin, destination, and transport mode to ensure accurate rate matching.</p>
              </div>
              <div className="p-4 bg-surface-container-low rounded-xl border-l-4 border-secondary">
                <p className="font-bold text-on-surface mb-1">UNLOCODE Standard</p>
                <p className="text-xs">Use standard 5-character UNLOCODEs for ports (e.g., CNSHA for Shanghai, DEHAM for Hamburg).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
