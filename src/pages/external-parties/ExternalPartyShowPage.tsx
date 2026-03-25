import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getExternalParty } from '../../api/external-parties'
import type { ExternalPartyResponse, ExternalPartyType } from '../../types/api'

const PARTY_TYPE_CONFIG: Record<ExternalPartyType, { icon: string; bg: string; text: string; label: string }> = {
  seller: { icon: 'local_shipping', bg: 'bg-primary-container', text: 'text-on-primary-container', label: 'Seller' },
  logistics: { icon: 'inventory_2', bg: 'bg-secondary-container', text: 'text-on-secondary-container', label: 'Logistics' },
  carrier: { icon: 'flight', bg: 'bg-tertiary-container', text: 'text-on-tertiary-container', label: 'Carrier' },
}

export function ExternalPartyShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { user } = useAuth()
  const partyId = id ? parseInt(id, 10) : null

  const [party, setParty] = useState<ExternalPartyResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.roles.includes('admin') || user?.roles.includes('super')

  useEffect(() => {
    if (!isAuth || !partyId) return
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await getExternalParty(partyId)
        setParty(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AuthError') throw err
        setError(err instanceof Error ? err.message : 'Failed to load external party')
      } finally { setIsLoading(false) }
    }
    fetchData()
  }, [isAuth, partyId])

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!party) return <AlertMessage variant="warning" message={error || 'External party not found'} />

  const typeConfig = PARTY_TYPE_CONFIG[party.party_type] || PARTY_TYPE_CONFIG.seller
  const fullWhatsApp = party.whatsapp_country_code && party.whatsapp_number ? `+${party.whatsapp_country_code}${party.whatsapp_number}` : null
  const preferredContact = party.prefers_whatsapp && fullWhatsApp ? 'WhatsApp' : party.email ? 'Email' : party.phone ? 'Phone' : 'None'

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="relative overflow-hidden rounded-xl mb-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-end md:items-center bg-gradient-to-br from-primary-container via-surface to-surface-container-low">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${typeConfig.bg} ${typeConfig.text}`}>{typeConfig.label}</span>
            <span className="text-on-surface-variant font-light tracking-widest text-sm">EP-{party.id.toString().padStart(4, '0')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-primary-fixed mb-2">{party.name}</h1>
          {party.company_name && <p className="text-on-surface-variant font-light tracking-wide max-w-md">{party.company_name}</p>}
        </div>
        <div className="relative z-10 mt-6 md:mt-0 flex gap-3">
          {isAdmin && (
            <button onClick={() => navigate(`/external-parties/${party.id}/edit`)} className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">edit</span>Edit
            </button>
          )}
          <button onClick={() => navigate('/external-parties')} className="px-6 py-3 bg-surface-container text-on-surface font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>Back
          </button>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-12 h-12 rounded-xl ${typeConfig.bg} ${typeConfig.text} flex items-center justify-center`}>
                <span className="material-symbols-outlined text-2xl">{typeConfig.icon}</span>
              </div>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Contact Information</h2>
            </div>
            <div className="space-y-6">
              {party.email && <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Email</p><a href={`mailto:${party.email}`} className="font-bold text-primary hover:underline">{party.email}</a></div>}
              {party.phone && <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Phone</p><p className="font-bold text-on-surface">{party.phone}</p></div>}
              {fullWhatsApp && <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">WhatsApp</p><p className="font-bold text-on-surface">{fullWhatsApp}</p></div>}
              {party.company_name && <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Company</p><p className="font-bold text-on-surface">{party.company_name}</p></div>}
              <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Address</p><p className="font-light text-on-surface leading-relaxed">{party.address || 'No address provided.'}</p></div>
            </div>
          </section>

          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <h3 className="text-on-primary-container font-extrabold tracking-tight mb-6">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10"><span className="text-on-surface-variant text-sm font-light">Status</span><span className={`px-3 py-1 rounded-full text-xs font-bold ${party.opt_out ? 'bg-error-container/30 text-error' : 'bg-primary-container/30 text-primary'}`}>{party.opt_out ? 'Opted Out' : 'Active'}</span></div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10"><span className="text-on-surface-variant text-sm font-light">Prefers WhatsApp</span><span className={`font-bold ${party.prefers_whatsapp ? 'text-primary' : 'text-outline'}`}>{party.prefers_whatsapp ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between items-center py-2 border-b border-outline-variant/10"><span className="text-on-surface-variant text-sm font-light">Preferred Contact</span><span className="font-bold text-on-surface">{preferredContact}</span></div>
              {party.last_contacted_at && <div className="flex justify-between items-center py-2"><span className="text-on-surface-variant text-sm font-light">Last Contacted</span><span className="font-medium text-on-surface-variant text-xs">{new Date(party.last_contacted_at).toLocaleDateString()}</span></div>}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          <section className="glass-panel ambient-shadow rounded-xl border border-outline-variant/20 overflow-hidden">
            <div className="px-8 py-5 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="material-symbols-outlined text-primary">info</span><h2 className="text-on-primary-container font-extrabold tracking-tight text-lg">Details</h2></div>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Party Type</p><p className="font-bold text-on-surface capitalize">{party.party_type}</p></div>
                <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Entity ID</p><p className="font-bold text-on-surface">{party.entity_id}</p></div>
                <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Purchase Order ID</p><p className="font-bold text-on-surface">{party.purchase_order_id}</p></div>
                <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Created</p><p className="font-bold text-on-surface">{new Date(party.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-1">Last Updated</p><p className="font-bold text-on-surface">{new Date(party.updated_at).toLocaleDateString()}</p></div>
              </div>
              {party.preferences && Object.keys(party.preferences).length > 0 && (
                <div className="mt-8"><p className="text-on-surface-variant text-[10px] uppercase tracking-widest mb-3">Custom Preferences</p>
                  <div className="bg-surface-container-low rounded-xl p-4 font-mono text-xs">
                    {Object.entries(party.preferences).map(([key, value]) => <div key={key} className="flex gap-2"><span className="text-primary font-bold">{key}:</span><span>{JSON.stringify(value)}</span></div>)}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
