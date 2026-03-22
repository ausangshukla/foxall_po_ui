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
  const { canManageUsers, user: currentUser } = useAuth()

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

    const idToDelete = deletingId

    try {
      setIsLoading(true)
      await deleteUser(idToDelete)
      setUsers((prev) => prev.filter((u) => u.id !== idToDelete))
      setShowDeleteConfirm(false)
      setDeletingId(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeClasses = (role: string): string => {
    switch (role) {
      case 'super': return 'bg-error-container/20 text-error'
      case 'admin': return 'bg-tertiary-container text-on-tertiary-container'
      case 'employee': return 'bg-primary-container text-on-primary-container'
      default: return 'bg-surface-container-highest text-on-surface-variant'
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
    if (sortKey !== key) return <span className="material-symbols-outlined text-outline text-xs ml-1">unfold_more</span>
    return <span className="material-symbols-outlined text-primary text-xs ml-1">{sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}</span>
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers() && !currentUser) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div className="space-y-0 max-w-screen-2xl mx-auto px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Editorial Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-primary-container mb-2 font-headline">User Management</h1>
          <p className="text-on-surface-variant font-light tracking-wide">Manage platform users, roles and their access permissions.</p>
        </div>
        <div className="flex gap-4">
          {canManageUsers() && (
            <button
              onClick={() => navigate('/users/new')}
              data-test-id="user-create"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-bold ambient-shadow hover:scale-[1.02] transition-transform"
            >
              <span className="material-symbols-outlined">person_add</span>
              <span>Add User</span>
            </button>
          )}
        </div>
      </section>

      {/* Summary Metrics: Glass Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-primary-container/30 text-primary rounded-xl material-symbols-outlined">group</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Total Users</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">{users.length}</h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-tertiary-container/30 text-tertiary rounded-xl material-symbols-outlined">admin_panel_settings</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Admins</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">
              {users.filter(u => u.roles.includes('super') || u.roles.includes('admin')).length}
            </h3>
          </div>
        </div>
        <div className="glass-panel p-8 rounded-xl ambient-shadow flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <span className="p-3 bg-secondary-container/30 text-secondary rounded-xl material-symbols-outlined">domain</span>
          </div>
          <div>
            <p className="text-on-surface-variant text-sm font-light uppercase tracking-widest mb-1">Active Entities</p>
            <h3 className="text-3xl font-extrabold text-on-primary-container">{entities.size}</h3>
          </div>
        </div>
      </section>

      {error && <div className="mb-6"><AlertMessage variant="danger" message={error} onClose={() => setError(null)} /></div>}

      {/* Filters & Data Table Container */}
      <section className="glass-panel rounded-2xl ambient-shadow overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 bg-surface-container-low flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-none">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
              <input
                className="pl-12 pr-4 py-3 bg-surface-container-lowest rounded-lg border-none ring-1 ring-outline-variant/20 focus:ring-primary-container w-full lg:w-96 font-light text-sm"
                placeholder="Search by name or email..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-on-surface-variant font-light">
            <span>Showing {filteredUsers.length} platform users</span>
          </div>
        </div>

        {/* Modern Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => toggleSort('first_name')}
                >
                  <div className="flex items-center gap-1">Name {getSortIndicator('first_name')}</div>
                </th>
                <th 
                  className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant cursor-pointer group"
                  onClick={() => toggleSort('email')}
                >
                  <div className="flex items-center gap-1">Account {getSortIndicator('email')}</div>
                </th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">Entity</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">Permissions</th>
                <th className="px-8 py-5 text-xs font-extrabold uppercase tracking-widest text-on-surface-variant text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-4xl text-outline">group_off</span>
                      </div>
                      <h3 className="text-lg font-bold text-on-surface mb-1">No users found</h3>
                      <p className="text-on-surface-variant max-w-xs mx-auto mb-6 font-medium">
                        Try adjusting your search criteria or add a new user to the platform.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-surface-container-low transition-all duration-200 group cursor-pointer"
                    onClick={() => navigate(`/users/${u.id}`)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant">
                          {u.first_name.charAt(0)}{u.last_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-on-primary-container group-hover:text-primary transition-colors">{u.first_name} {u.last_name}</div>
                          <div className="text-[10px] font-extrabold text-outline uppercase tracking-wider">{u.phone || 'No Phone'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-medium text-on-surface">{u.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {u.email_enabled && <span className="w-1.5 h-1.5 rounded-full bg-primary" title="Email Enabled"></span>}
                        {u.wa_enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="WhatsApp Enabled"></span>}
                        <span className="text-[10px] font-extrabold text-outline uppercase tracking-widest">Verified</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-2 py-1 bg-surface-container-high rounded text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                        {entities.get(u.entity_id)?.name || 'Central Admin'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.roles.map((role) => (
                          <span 
                            key={role} 
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${getRoleBadgeClasses(role)}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                       <div className="flex items-center justify-end gap-1">
                          <button 
                            data-test-id={`user-edit-${u.id}`}
                            onClick={() => navigate(`/users/${u.id}/edit`)}
                            className="p-2 opacity-40 group-hover:opacity-100 hover:text-secondary transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button 
                            data-test-id={`user-delete-${u.id}`}
                            onClick={() => handleDelete(u.id)}
                            className="p-2 opacity-40 group-hover:opacity-100 hover:text-error transition-all"
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

        {/* Footer of Table */}
        <div className="p-8 border-t border-outline-variant/10 flex justify-center">
          <button className="text-sm font-bold text-primary hover:text-on-primary-container flex items-center gap-2 transition-colors">
            View Complete Activity Logs
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>

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
