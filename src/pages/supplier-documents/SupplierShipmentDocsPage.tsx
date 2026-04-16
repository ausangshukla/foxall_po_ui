import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  getSupplierDocumentsData,
  submitSupplierDocuments,
  type SupplierDocumentsDataResponse
} from '../../api/supplier-documents'

export function SupplierShipmentDocsPage() {
  const { poId } = useParams<{ poId: string }>()
  const [searchParams] = useSearchParams()

  const token = searchParams.get('token') || ''
  const actionKey = searchParams.get('action_key') || 'mark_ready_to_ship'
  const poIdNum = poId ? parseInt(poId, 10) : null

  const [data, setData] = useState<SupplierDocumentsDataResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [commercialInvoice, setCommercialInvoice] = useState<File | null>(null)
  const [packingList, setPackingList] = useState<File | null>(null)
  const [dangerousGoods, setDangerousGoods] = useState<File | null>(null)
  const [certOfOrigin, setCertOfOrigin] = useState<File | null>(null)
  const [miscDocs, setMiscDocs] = useState<File[]>([])
  const [comment, setComment] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<{ message: string; newState: string } | null>(null)

  useEffect(() => {
    if (!poIdNum || !token) {
      setLoadError('Invalid link — missing order ID or token.')
      setIsLoading(false)
      return
    }

    getSupplierDocumentsData(poIdNum, token, actionKey)
      .then((response) => {
        setData(response)
      })
      .catch((err: Error) => {
        setLoadError(err.message || 'Failed to load order details.')
      })
      .finally(() => setIsLoading(false))
  }, [poIdNum, token, actionKey])

  const handleFileChange = (setter: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0])
    }
  }

  const handleMiscFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMiscDocs(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!poIdNum || !data) return

    if (!commercialInvoice || !packingList) {
      setSubmitError('Commercial Invoice and Packing List are required.')
      return
    }

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const result = await submitSupplierDocuments(poIdNum, {
        token,
        action_key: actionKey,
        comment: comment.trim() || undefined,
        commercial_invoice: commercialInvoice,
        packing_list: packingList,
        dangerous_goods_declaration: dangerousGoods || undefined,
        certificate_of_origin: certOfOrigin || undefined,
        misc_shipment_documents: miscDocs.length > 0 ? miscDocs : undefined,
      })
      setSubmitSuccess({ message: result.message, newState: result.new_state })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed. Please try again.'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="glass-panel ambient-shadow rounded-xl p-10 text-center">
          <div className="w-10 h-10 border-4 border-surface-container-high border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant text-sm font-medium">Loading details…</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="glass-panel ambient-shadow rounded-xl p-10 max-w-md w-full border-t-4 border-error">
          <h1 className="text-xl font-extrabold tracking-tight text-error mb-3">Link Error</h1>
          <p className="text-on-surface text-sm mb-4">{loadError}</p>
        </div>
      </div>
    )
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="glass-panel ambient-shadow rounded-xl p-10 max-w-md w-full text-center border-t-4 border-primary">
          <span className="material-symbols-outlined text-5xl mb-4 block text-primary">check_circle</span>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface mb-2">Documents Submitted</h1>
          <p className="text-on-surface-variant text-sm mb-4">{submitSuccess.message}</p>
          <p className="text-xs text-on-surface-variant">You may close this window.</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const po = data.purchase_order
  const isCorrection = po.current_state === 'ready_correction_requested'

  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm border-b border-slate-200/50">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <span className="text-2xl font-extrabold tracking-tighter text-primary font-headline">Logistics Portal</span>
          <span className="text-sm font-semibold text-on-surface-variant">Shipment Document Upload</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <header className="rounded-xl mb-10 p-8 bg-gradient-to-br from-primary-container via-surface to-surface-container-low shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-surface-container-lowest text-primary text-[10px] font-extrabold tracking-widest rounded-full uppercase">
              {isCorrection ? 'Correction Requested' : 'Ready to Ship'}
            </span>
            <span className="text-on-surface-variant font-light tracking-widest text-sm">{po.po_number}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-on-primary-fixed mb-2">PO #{po.po_number}</h1>
          <p className="text-on-surface-variant font-light">
            Please upload the required shipment documents for {po.buyer_entity_name}.
          </p>
        </header>

        {isCorrection && po.correction_notes && (
          <div className="mb-8 p-6 rounded-xl bg-tertiary-container text-on-tertiary-container border border-tertiary/20">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">feedback</span>
              Buyer Correction Notes:
            </h3>
            <p className="text-sm italic">"{po.correction_notes}"</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-6">Required Documents</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Commercial Invoice *</label>
                <input type="file" onChange={handleFileChange(setCommercialInvoice)} className="text-sm" required />
                <p className="text-[10px] text-on-surface-variant/70">Official invoice showing items, quantities, and values.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Packing List *</label>
                <input type="file" onChange={handleFileChange(setPackingList)} className="text-sm" required />
                <p className="text-[10px] text-on-surface-variant/70">Showing boxes, contents, weights, and dimensions.</p>
              </div>
            </div>
          </section>

          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <h2 className="text-on-primary-container font-extrabold tracking-tight text-lg mb-6">Optional Documents</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Dangerous Goods Declaration</label>
                <input type="file" onChange={handleFileChange(setDangerousGoods)} className="text-sm" />
                <p className="text-[10px] text-on-surface-variant/70">Required if cargo contains batteries, chemicals, etc.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Certificate of Origin</label>
                <input type="file" onChange={handleFileChange(setCertOfOrigin)} className="text-sm" />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Miscellaneous Documents</label>
              <input type="file" multiple onChange={handleMiscFilesChange} className="text-sm" />
              <p className="text-[10px] text-on-surface-variant/70">Any other relevant files (photos, spec sheets, etc.)</p>
            </div>
          </section>

          <section className="glass-panel ambient-shadow rounded-xl p-8 border border-outline-variant/20">
            <label className="block text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest mb-2">Comments</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any notes for the buyer…"
              className="w-full px-3 py-2.5 bg-surface border border-outline-variant rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </section>

          {submitError && (
            <div className="px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 font-bold rounded-xl shadow-lg bg-primary text-on-primary hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined">upload</span>
            )}
            {isSubmitting ? 'Submitting…' : 'Submit Shipment Documents'}
          </button>
        </form>
      </div>
    </div>
  )
}
