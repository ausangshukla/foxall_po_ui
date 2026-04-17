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

  const removeMiscFile = (index: number) => {
    setMiscDocs(prev => prev.filter((_, i) => i !== index))
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

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="relative overflow-hidden rounded-2xl mb-10 p-8 md:p-12 bg-gradient-to-br from-primary-container via-surface to-surface-container-low shadow-sm border border-outline-variant/10">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-surface-container-lowest text-primary text-[10px] font-extrabold tracking-widest rounded-full uppercase border border-primary/10">
                {isCorrection ? 'Correction Requested' : 'Ready to Ship'}
              </span>
              <span className="text-on-surface-variant font-mono tracking-wider text-xs bg-surface-container/50 px-2 py-1 rounded">
                {po.po_number}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-primary-fixed mb-3">
              Upload Shipment Documents
            </h1>
            <p className="text-on-surface-variant font-medium text-lg max-w-2xl leading-relaxed">
              Please provide the final shipping documentation for <span className="text-primary font-bold">{po.buyer_entity_name}</span> to process your shipment.
            </p>
          </div>
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />
        </header>

        {isCorrection && po.correction_notes && (
          <div className="mb-10 p-6 rounded-2xl bg-tertiary-container/30 text-on-tertiary-container border border-tertiary/20 backdrop-blur-sm flex items-start gap-4">
            <span className="material-symbols-outlined text-tertiary text-2xl mt-0.5" data-weight="fill">feedback</span>
            <div>
              <h3 className="font-bold text-lg mb-1">Correction Notes</h3>
              <p className="text-sm font-medium italic leading-relaxed opacity-90">"{po.correction_notes}"</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <section className="glass-panel ambient-shadow rounded-2xl p-8 md:p-10 border border-outline-variant/20 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">verified_user</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-xl">Required Documents</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Commercial Invoice */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1 flex items-center gap-2">
                  Commercial Invoice <span className="text-error">*</span>
                </label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleFileChange(setCommercialInvoice)} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    required 
                  />
                  <div className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    commercialInvoice 
                      ? 'border-primary bg-primary-container/10 shadow-inner' 
                      : 'border-outline-variant/30 bg-surface-container-lowest/50 group-hover:border-primary/50 group-hover:bg-primary-container/5'
                  }`}>
                    <span className={`material-symbols-outlined text-4xl transition-transform duration-300 group-hover:scale-110 ${commercialInvoice ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {commercialInvoice ? 'description' : 'upload_file'}
                    </span>
                    <div className="text-center">
                      <p className={`text-sm font-bold truncate max-w-[200px] ${commercialInvoice ? 'text-primary' : 'text-on-surface'}`}>
                        {commercialInvoice ? commercialInvoice.name : 'Select Invoice'}
                      </p>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter mt-1">
                        PDF, JPG, PNG up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant/70 leading-relaxed italic ml-1">
                  Official invoice showing items, quantities, and values.
                </p>
              </div>

              {/* Packing List */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1 flex items-center gap-2">
                  Packing List <span className="text-error">*</span>
                </label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleFileChange(setPackingList)} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    required 
                  />
                  <div className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    packingList 
                      ? 'border-primary bg-primary-container/10 shadow-inner' 
                      : 'border-outline-variant/30 bg-surface-container-lowest/50 group-hover:border-primary/50 group-hover:bg-primary-container/5'
                  }`}>
                    <span className={`material-symbols-outlined text-4xl transition-transform duration-300 group-hover:scale-110 ${packingList ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {packingList ? 'description' : 'inventory'}
                    </span>
                    <div className="text-center">
                      <p className={`text-sm font-bold truncate max-w-[200px] ${packingList ? 'text-primary' : 'text-on-surface'}`}>
                        {packingList ? packingList.name : 'Select Packing List'}
                      </p>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter mt-1">
                        PDF, JPG, PNG up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant/70 leading-relaxed italic ml-1">
                  Showing boxes, contents, weights, and dimensions.
                </p>
              </div>
            </div>
          </section>

          <section className="glass-panel ambient-shadow rounded-2xl p-8 md:p-10 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-primary">add_circle</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-xl">Additional Documents</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* DG Declaration */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Dangerous Goods Dec.</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleFileChange(setDangerousGoods)} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    dangerousGoods 
                      ? 'border-primary bg-primary-container/10' 
                      : 'border-outline-variant/30 bg-surface-container-lowest/50 group-hover:border-primary/50 group-hover:bg-primary-container/5'
                  }`}>
                    <span className={`material-symbols-outlined text-4xl ${dangerousGoods ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {dangerousGoods ? 'warning' : 'upload_file'}
                    </span>
                    <div className="text-center">
                      <p className={`text-sm font-bold truncate max-w-[200px] ${dangerousGoods ? 'text-primary' : 'text-on-surface'}`}>
                        {dangerousGoods ? dangerousGoods.name : 'Upload DG Declaration'}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-on-surface-variant/70 leading-relaxed italic ml-1">
                  Required if cargo contains batteries, chemicals, etc.
                </p>
              </div>

              {/* Certificate of Origin */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Certificate of Origin</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleFileChange(setCertOfOrigin)} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  />
                  <div className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                    certOfOrigin 
                      ? 'border-primary bg-primary-container/10' 
                      : 'border-outline-variant/30 bg-surface-container-lowest/50 group-hover:border-primary/50 group-hover:bg-primary-container/5'
                  }`}>
                    <span className={`material-symbols-outlined text-4xl ${certOfOrigin ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                      {certOfOrigin ? 'public' : 'upload_file'}
                    </span>
                    <div className="text-center">
                      <p className={`text-sm font-bold truncate max-w-[200px] ${certOfOrigin ? 'text-primary' : 'text-on-surface'}`}>
                        {certOfOrigin ? certOfOrigin.name : 'Upload COO'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Misc Documents */}
            <div className="mt-10 space-y-4">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Other Miscellaneous Documents</label>
              <div className="relative group">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleMiscFilesChange} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${
                  miscDocs.length > 0 
                    ? 'border-primary bg-primary-container/10' 
                    : 'border-outline-variant/30 bg-surface-container-lowest/50 group-hover:border-primary/50 group-hover:bg-primary-container/5'
                }`}>
                  <span className={`material-symbols-outlined text-4xl ${miscDocs.length > 0 ? 'text-primary' : 'text-on-surface-variant/40'}`}>
                    {miscDocs.length > 0 ? 'folder_open' : 'library_add'}
                  </span>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${miscDocs.length > 0 ? 'text-primary' : 'text-on-surface'}`}>
                      {miscDocs.length > 0 ? `${miscDocs.length} files selected` : 'Drop files here or click to upload'}
                    </p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter mt-1">
                      Any other relevant files (photos, spec sheets, etc.)
                    </p>
                  </div>
                </div>
              </div>
              
              {miscDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 ml-1">
                  {miscDocs.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/30 animate-in zoom-in-95 duration-200">
                      <span className="material-symbols-outlined text-sm text-primary">description</span>
                      <span className="text-xs font-medium text-on-surface truncate max-w-[150px]">{file.name}</span>
                      <button 
                        type="button" 
                        onClick={() => removeMiscFile(idx)}
                        className="material-symbols-outlined text-sm text-on-surface-variant hover:text-error transition-colors"
                      >
                        close
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="glass-panel ambient-shadow rounded-2xl p-8 md:p-10 border border-outline-variant/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">chat</span>
              <h2 className="text-on-primary-container font-extrabold tracking-tight text-xl">Additional Comments</h2>
            </div>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add any internal notes or messages for the buyer regarding these documents…"
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-2xl text-sm resize-y focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
            />
          </section>

          {submitError && (
            <div className="px-6 py-4 rounded-2xl bg-error-container text-on-error-container text-sm font-bold flex items-center gap-3 animate-in shake duration-500 shadow-lg border border-error/20">
              <span className="material-symbols-outlined text-2xl">error_outline</span>
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 font-extrabold rounded-2xl shadow-xl shadow-primary/20 bg-primary text-on-primary hover:opacity-90 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3 text-lg"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-3 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-2xl">cloud_upload</span>
            )}
            {isSubmitting ? 'Processing Upload…' : 'Submit Shipment Documents'}
          </button>
        </form>
      </div>
    </div>
  )
}
