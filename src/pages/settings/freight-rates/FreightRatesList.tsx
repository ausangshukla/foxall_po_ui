import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { freightContractRatesApi } from '../../../api/freight-contract-rates'
import type { FreightContractRate } from '../../../types/api'
import { LoadingSpinner, AlertMessage } from '../../../components/common'

export default function FreightRatesList() {
  const navigate = useNavigate()
  const [rates, setRates] = useState<FreightContractRate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchRates = async () => {
    try {
      setLoading(true)
      const response = await freightContractRatesApi.list({
        'q[carrier_name_or_origin_port_or_destination_port_cont]': search
      })
      setRates(response || [])
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load freight rates')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      await freightContractRatesApi.export({
        'q[carrier_name_or_origin_port_or_destination_port_cont]': search
      })
    } catch (err: any) {
      setError(err.message || 'Failed to export freight rates')
    }
  }

  useEffect(() => {
    fetchRates()
  }, [search])

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this rate?')) return

    try {
      await freightContractRatesApi.delete(id)
      setRates(rates.filter(r => r.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete rate')
    }
  }

  if (loading && rates.length === 0) return <LoadingSpinner />

  return (
    <div className="space-y-0 max-w-[1600px] mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">Freight Contract Rates</h1>
          <p className="text-on-surface-variant font-light tracking-wide">Manage pre-negotiated carrier rates for automated booking.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-secondary-container text-on-secondary-container rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">file_download</span>
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/settings/freight-rates/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Add Rate</span>
          </button>
        </div>
      </section>

      {error && <div className="mb-8"><AlertMessage variant="danger" message={error} /></div>}

      <section className="glass-panel p-4 rounded-xl ambient-shadow mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border border-outline-variant/20">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
          <input
            type="text"
            placeholder="Search by carrier or port..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
          />
        </div>
      </section>

      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden border border-outline-variant/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/30">
                <th className="px-8 py-5 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Carrier</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Lane</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Mode</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Rate</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Validity</th>
                <th className="px-8 py-5 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {rates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-4xl mb-3 opacity-50 block">directions_boat</span>
                    No contract rates found.
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr 
                    key={rate.id}
                    className="hover:bg-surface-container-low transition-all duration-200 group cursor-pointer"
                    onClick={() => navigate(`/settings/freight-rates/${rate.id}/edit`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-xs font-bold text-on-primary-container">
                          {rate.carrier_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-on-surface">{rate.carrier_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-on-surface">{rate.origin_port}</span>
                        <span className="material-symbols-outlined text-sm text-outline-variant">arrow_forward</span>
                        <span className="font-medium text-sm text-on-surface">{rate.destination_port}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container uppercase tracking-wider">
                        {rate.transport_mode.replace('_', ' ')}
                      </span>
                      {rate.container_type && (
                        <span className="ml-2 text-xs font-medium text-on-surface-variant">{rate.container_type}</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-extrabold text-primary text-base">
                        {rate.currency} {Number(rate.rate_usd).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-medium text-on-surface-variant">
                        {rate.valid_from} <span className="text-outline-variant mx-1">to</span> {rate.valid_to}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/settings/freight-rates/${rate.id}/edit`) }}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                        <button 
                          onClick={(e) => handleDelete(rate.id, e)}
                          className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
