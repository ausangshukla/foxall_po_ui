import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import { listCustomFieldDefinitions, deleteCustomFieldDefinition } from '../../api/custom-fields'
import type { CustomFieldDefinition } from '../../types/api'

export function CustomFieldDefinitionListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()

  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (!isAuth) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await listCustomFieldDefinitions()
        setDefinitions(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load field definitions'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth])

  const handleDelete = (id: number) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (deletingId === null) return

    try {
      setIsLoading(true)
      await deleteCustomFieldDefinition(deletingId)
      setDefinitions(definitions.filter((d) => d.id !== deletingId))
      setShowDeleteConfirm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete definition')
    } finally {
      setIsLoading(false)
      setDeletingId(null)
    }
  }

  const filteredDefinitions = definitions.filter((def) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      def.field_label.toLowerCase().includes(searchLower) ||
      def.field_key.toLowerCase().includes(searchLower) ||
      def.resource_name.toLowerCase().includes(searchLower) ||
      (def.tag || '').toLowerCase().includes(searchLower)
    )
  })

  // Group definitions by resource_name
  const groupedDefinitions = filteredDefinitions.reduce((acc, def) => {
    if (!acc[def.resource_name]) {
      acc[def.resource_name] = []
    }
    acc[def.resource_name].push(def)
    return acc
  }, {} as Record<string, CustomFieldDefinition[]>)

  const resources = Object.keys(groupedDefinitions).sort()

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="space-y-0 max-w-[1600px] mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">Custom Field Definitions</h1>
          <p className="text-on-surface-variant font-light tracking-wide">Manage dynamic fields for your system resources.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/custom-field-definitions/new')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            <span>New Field</span>
          </button>
        </div>
      </section>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      <div className="glass-panel rounded-2xl ambient-shadow overflow-hidden mb-8">
        <div className="p-6 bg-surface-container-low flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input
                className="pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full lg:w-64 font-light text-sm"
                placeholder="Search definitions..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant font-light">
            <span>Showing {filteredDefinitions.length} fields across {resources.length} resources</span>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {resources.length === 0 ? (
          <div className="glass-panel rounded-2xl ambient-shadow p-20 text-center">
            <p className="text-on-surface-variant font-medium text-lg">No field definitions found</p>
          </div>
        ) : (
          resources.map((resource) => (
            <section key={resource} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4 ml-2">
                <span className="material-symbols-outlined text-primary">inventory_2</span>
                <h2 className="text-2xl font-extrabold tracking-tight text-on-primary-container font-headline">
                  {resource} Fields
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[10px] font-black uppercase tracking-widest">
                  {groupedDefinitions[resource].length}
                </span>
              </div>
              
              <div className="glass-panel rounded-2xl ambient-shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant w-1/4">Label</th>
                        <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant w-1/6">Key</th>
                        <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant w-1/6">Type</th>
                        <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant w-1/6">Tag</th>
                        <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-center w-1/12">Mandatory</th>
                        <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right w-1/6">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {groupedDefinitions[resource].map((def) => (
                        <tr key={def.id} className="hover:bg-surface-container-low transition-all duration-200 group">
                          <td className="px-8 py-6">
                            <span className="font-bold text-sm text-on-surface">{def.field_label}</span>
                          </td>
                          <td className="px-8 py-6">
                            <code className="text-xs bg-surface-container-highest px-2 py-1 rounded text-on-surface-variant font-mono">{def.field_key}</code>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-medium text-on-surface-variant uppercase text-[10px] tracking-widest">{def.field_type}</span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-medium text-on-surface-variant italic">{def.tag || '—'}</span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            {def.is_mandatory ? (
                              <span className="material-symbols-outlined text-error text-[20px]">check_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-outline-variant text-[20px]">cancel</span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => navigate(`/custom-field-definitions/${def.id}/edit`)}
                                className="p-2 opacity-40 group-hover:opacity-100 hover:text-secondary transition-all"
                              >
                                <span className="material-symbols-outlined text-xl">edit</span>
                              </button>
                              <button
                                onClick={() => handleDelete(def.id)}
                                className="p-2 opacity-40 group-hover:opacity-100 hover:text-error transition-all"
                              >
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))
        )}
      </div>

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Delete Custom Field Definition"
        message={`Are you sure you want to delete the field "${definitions.find(d => d.id === deletingId)?.field_label}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingId(null) }}
        confirmText="Delete Field"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />
    </div>
  )
}
