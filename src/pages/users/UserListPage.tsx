import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import { listUsers, deleteUser } from '../../api/users'
import { listEntities } from '../../api/entities'
import type { UserResponse, EntityResponse } from '../../types/api'

export function UserListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers, canManageAllUsers, user: currentUser } = useAuth()

  const [users, setUsers] = useState<UserResponse[]>([])
  const [entities, setEntities] = useState<Map<number, EntityResponse>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sortKey, setSortKey] = useState<keyof UserResponse>('first_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const toggleSort = (key: keyof UserResponse) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  useEffect(() => {
    if (!isAuth) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [usersData, entitiesData] = await Promise.all([
          listUsers(),
          listEntities(),
        ])
        setUsers(usersData)

        const entityMap = new Map<number, EntityResponse>()
        entitiesData.forEach((entity) => {
          entityMap.set(entity.id, entity)
        })
        setEntities(entityMap)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load users'
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
      await deleteUser(deletingId)
      setUsers(users.filter((u) => u.id !== deletingId))
      setShowDeleteConfirm(false)
    } catch {
      setError('Failed to delete user')
    } finally {
      setIsLoading(false)
      setDeletingId(null)
    }
  }

  const getRoleBadgeClasses = (role: string): string => {
    switch (role) {
      case 'super': return 'bg-red-50 text-red-700 border-red-100'
      case 'admin': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'employee': return 'bg-blue-50 text-blue-700 border-blue-100'
      default: return 'bg-slate-50 text-slate-700 border-slate-100'
    }
  }

  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  }).sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    return 0
  })

  const getSortIndicator = (key: keyof UserResponse) => {
    if (sortKey !== key) return <span className="material-symbols-outlined text-slate-300 text-xs ml-1">unfold_more</span>
    return <span className="material-symbols-outlined text-blue-600 text-xs ml-1">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers() && !currentUser) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-headline">Users</h1>
          <p className="mt-1 text-slate-500 font-medium">Manage platform users and their access permissions</p>
        </div>
        {canManageUsers() && (
          <button
            onClick={() => navigate('/users/new')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
          >
            <span className="material-symbols-outlined">person_add</span>
            Add New User
          </button>
        )}
      </div>

      {error && <AlertMessage variant="danger" message={error} onClose={() => setError(null)} />}

      {/* Search and Filters Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="max-w-md relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600">
            Showing <span className="text-blue-600 font-bold">{filteredUsers.length}</span> platform users
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">group_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No users found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Try adjusting your search criteria or add a new user to the platform.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort('first_name')}>
                    <div className="flex items-center">Name {getSortIndicator('first_name')}</div>
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort('email')}>
                    <div className="flex items-center">Account {getSortIndicator('email')}</div>
                  </th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Entity</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Permissions</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((u) => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                    onClick={() => navigate(`/users/${u.id}`)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-sm shadow-sm">
                          {u.first_name.charAt(0)}{u.last_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{u.first_name} {u.last_name}</div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-tight">{u.phone || 'No Phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-sm font-semibold text-slate-700">{u.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {u.email_enabled && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Email Enabled"></span>}
                        {u.wa_enabled && <span className="w-2 h-2 rounded-full bg-green-400" title="WhatsApp Enabled"></span>}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
                        {entities.get(u.entity_id)?.name || 'Central Admin'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.roles.map((role) => (
                          <span 
                            key={role} 
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getRoleBadgeClasses(role)}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/users/${u.id}/edit`)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                            title="Edit User"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete User"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Revoke Access"
        message={`Are you sure you want to delete this user? This will immediately revoke their access to the Foxall PO platform. This action cannot be reversed.`}
        onConfirm={confirmDelete}
        onCancel={() => { setShowDeleteConfirm(false); setDeletingId(null) }}
        confirmText="Confirm Deletion"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />
    </div>
  )
}
