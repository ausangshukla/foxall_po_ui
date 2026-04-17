import { useState, useEffect } from 'react'
import { freightBookingsApi } from '../../api/freight-bookings'
import type { BookingDraftResponse } from '../../api/freight-bookings'
import type { FreightBooking, FreightBookingRate } from '../../types/api'
import { LoadingSpinner, AlertMessage } from '../common'

interface FreightBookingWizardProps {
  poId: number
  onClose: () => void
  onSuccess: (booking: FreightBooking) => void
}

export default function FreightBookingWizard({ poId, onClose, onSuccess }: FreightBookingWizardProps) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<BookingDraftResponse | null>(null)
  const [rates, setRates] = useState<FreightBookingRate[]>([])
  const [fetchingRates, setFetchingRates] = useState(false)
  
  const [formData, setFormData] = useState({
    transport_mode: '',
    container_type: '',
    origin_port: '',
    destination_port: '',
    etd: '',
    eta: '',
    notes: ''
  })

  const [selectedRateId, setSelectedRateId] = useState<number | null>(null)

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const response = await freightBookingsApi.getDraft(poId)
        setDraft(response)
        setFormData(prev => ({
          ...prev,
          transport_mode: response.recommendation.transport_mode,
          container_type: response.recommendation.container_type || '',
          origin_port: response.purchase_order.origin_city_port || ''
        }))
      } catch (err: any) {
        setError(err.message || 'Failed to load booking draft')
      } finally {
        setLoading(false)
      }
    }
    fetchDraft()
  }, [poId])

  const handleGetRates = async () => {
    setFetchingRates(true)
    setError(null)
    try {
      const response = await freightBookingsApi.getRates(poId, {
        transport_mode: formData.transport_mode,
        container_type: formData.container_type,
        destination_port: formData.destination_port
      })
      setRates(response)
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rates')
    } finally {
      setFetchingRates(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const selectedRate = rates.find(r => r.id === selectedRateId)
      const bookingData: Partial<FreightBooking> = {
        ...formData,
        booking_source: 'rate_shopping',
        agreed_rate_usd: selectedRate?.rate_usd,
        total_cost_usd: selectedRate?.total_cost_usd,
        carrier_name: selectedRate?.carrier_name
      }
      const response = await freightBookingsApi.create(poId, bookingData)
      // The backend now returns the full PO object on success
      onSuccess(response as any)
    } catch (err: any) {
      setError(err.message || 'Failed to create booking')
      setLoading(false)
    }
  }

  if (loading && step === 0) return <div className="p-12 text-center"><LoadingSpinner /></div>

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest w-full max-w-4xl rounded-3xl editorial-shadow border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-8 py-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-on-primary-fixed font-headline">Book Freight</h2>
            <div className="flex items-center gap-2 mt-1">
              {[0, 1, 2, 3].map((s) => (
                <div 
                  key={s} 
                  className={`h-1.5 w-8 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary' : 'bg-outline-variant/30'}`}
                />
              ))}
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-2">Step {step + 1} of 4</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && <div className="mb-6"><AlertMessage variant="danger" message={error} /></div>}

          {step === 0 && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-primary-container/20 p-6 rounded-2xl border border-primary/10 flex gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
                <div>
                  <h3 className="font-bold text-on-primary-container">AI Recommendation</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{draft?.recommendation.rationale}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'ocean_fcl', name: 'Ocean FCL', icon: 'directions_boat', desc: 'Full Container Load' },
                  { id: 'ocean_lcl', name: 'Ocean LCL', icon: 'sailing', desc: 'Less than Container Load' },
                  { id: 'air', name: 'Air Freight', icon: 'flight', desc: 'Fastest delivery' },
                  { id: 'road', name: 'Road Freight', icon: 'local_shipping', desc: 'Regional trucking' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setFormData({ ...formData, transport_mode: mode.id })}
                    className={`p-6 rounded-2xl border-2 text-left transition-all group ${
                      formData.transport_mode === mode.id 
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                        : 'border-outline-variant/30 hover:border-primary/50 bg-surface-container-lowest'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`material-symbols-outlined text-3xl ${formData.transport_mode === mode.id ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {mode.icon}
                      </span>
                      {draft?.recommendation.transport_mode === mode.id && (
                        <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Recommended</span>
                      )}
                    </div>
                    <h4 className="font-bold text-lg mt-4 text-on-surface">{mode.name}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Origin Port</label>
                  <input 
                    type="text" 
                    value={formData.origin_port}
                    onChange={(e) => setFormData({ ...formData, origin_port: e.target.value.toUpperCase() })}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium"
                    placeholder="e.g. CNSHA"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Destination Port</label>
                  <input 
                    type="text" 
                    value={formData.destination_port}
                    onChange={(e) => setFormData({ ...formData, destination_port: e.target.value.toUpperCase() })}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium"
                    placeholder="e.g. DEHAM"
                  />
                </div>
                {formData.transport_mode === 'ocean_fcl' && (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Container Type</label>
                    <select 
                      value={formData.container_type}
                      onChange={(e) => setFormData({ ...formData, container_type: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium"
                    >
                      <option value="20GP">20' General Purpose</option>
                      <option value="40GP">40' General Purpose</option>
                      <option value="40HC">40' High Cube</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">inventory_2</span>
                  Cargo Summary (from PO)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Total CBM</span>
                    <span className="font-bold">{draft?.purchase_order.total_cbm} m³</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">Gross Weight</span>
                    <span className="font-bold">{draft?.purchase_order.total_gross_weight} kg</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              {rates.length === 0 ? (
                <div className="text-center py-12 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/30">
                  <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">search_off</span>
                  <h3 className="text-xl font-bold text-on-surface">No live rates found</h3>
                  <p className="text-on-surface-variant mt-2 max-w-md mx-auto">
                    We couldn't find any live rates for this lane. You can enter a rate manually or contact your forwarder.
                  </p>
                  <button 
                    onClick={() => setStep(3)}
                    className="mt-6 px-8 py-3 bg-primary text-on-primary rounded-xl font-bold ambient-shadow"
                  >
                    Enter Manually
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rates.map((rate) => (
                    <button
                      key={rate.id}
                      onClick={() => setSelectedRateId(rate.id)}
                      className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                        selectedRateId === rate.id 
                          ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                          : 'border-outline-variant/30 hover:border-primary/50 bg-surface-container-lowest'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary font-bold">
                          {rate.carrier_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-on-surface">{rate.carrier_name}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-on-surface-variant">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">schedule</span>
                              {rate.transit_days} days transit
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">event</span>
                              Departs {rate.departure_date}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-primary">USD {Number(rate.total_cost_usd).toLocaleString()}</div>
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mt-1">All-in Rate</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20">
                <h3 className="text-xl font-bold text-on-surface mb-6">Booking Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Carrier</span>
                    <p className="font-bold text-lg">{rates.find(r => r.id === selectedRateId)?.carrier_name || 'Manual Entry'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Route</span>
                    <p className="font-bold text-lg">{formData.origin_port} → {formData.destination_port}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Transport Mode</span>
                    <p className="font-bold text-lg uppercase">{formData.transport_mode.replace('_', ' ')} {formData.container_type}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Total Cost</span>
                    <p className="font-bold text-lg text-primary">USD {Number(rates.find(r => r.id === selectedRateId)?.total_cost_usd || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Additional Notes for Carrier</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-4 transition-all font-medium resize-none"
                  rows={4}
                  placeholder="e.g. Special handling requirements, preferred vessel..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-outline-variant/20 bg-surface-container-low flex justify-between items-center">
          <button
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-0"
          >
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            {step < 2 ? (
              <button
                onClick={() => step === 0 ? setStep(1) : handleGetRates()}
                disabled={fetchingRates || (step === 1 && (!formData.origin_port || !formData.destination_port))}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-primary editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                {fetchingRates ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : null}
                {step === 0 ? 'Next' : 'Get Rates'}
              </button>
            ) : step === 2 ? (
              <button
                onClick={() => setStep(3)}
                disabled={!selectedRateId && rates.length > 0}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-primary editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-2.5 rounded-xl text-sm font-bold text-on-primary bg-gradient-to-br from-primary to-primary-fixed-dim editorial-shadow hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">send</span>}
                Submit to Carrier
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  )
}
