import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  Button,
  Badge,
  Card,
  Row,
  Col,
  Form,
  InputGroup,
  Dropdown,
} from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage, ConfirmationModal } from '../../components/common'
import { listUsers, deleteUser } from '../../api/users'
import { listEntities } from '../../api/entities'
import type { UserResponse, EntityResponse } from '../../types/api'

export function UserListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers, canManageAllUsers, user: currentUser } = useAuth()

  const canManageUser = (user: UserResponse): boolean => {
    if (canManageAllUsers()) return true
    if (!canManageUsers()) return false
    // Admin cannot manage super users
    return !user.roles.includes('super')
  }

  const toggleSort = (key: keyof UserResponse) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const [users, setUsers] = useState<UserResponse[]>([])
  const [entities, setEntities] = useState<Map<number, EntityResponse>>(new Map())
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
        const [usersData, entitiesData] = await Promise.all([
          listUsers(),
          listEntities(),
        ])
        setUsers(usersData)

        // Create entity lookup map
        const entityMap = new Map<number, EntityResponse>()
        entitiesData.forEach((entity) => {
          entityMap.set(entity.id, entity)
        })
        setEntities(entityMap)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load users'
        console.error('Failed to load users:', err)
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

  const getRoleBadgeVariant = (role: string): string => {
    switch (role) {
      case 'super':
        return 'danger'
      case 'admin':
        return 'warning'
      case 'employee':
        return 'info'
      default:
        return 'secondary'
    }
  }

  const [sortKey, setSortKey] = useState<keyof UserResponse>('first_name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Filter users based on search
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
    if (sortKey !== key) return <i className="ti ti-selector text-muted opacity-25 ms-1" style={{ fontSize: '0.8rem' }}></i>
    return <i className={`ti ti-chevron-${sortDir === 'asc' ? 'up' : 'down'} sort-active ms-1`} style={{ fontSize: '0.8rem' }}></i>
  }

  if (!isAuth || isLoading) {
    return <LoadingSpinner />
  }

  if (!canManageUsers() && !currentUser) {
    return <AlertMessage variant="danger" message="Access denied" />
  }

  return (
    <div className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">Users</h1>
          <p className="text-muted small mb-0">Manage platform users and their permissions</p>
        </div>
        {canManageUsers() && (
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={() => navigate('/users/new')}
          >
            <i className="ti ti-user-plus"></i> Add User
          </Button>
        )}
      </div>

      {error && <AlertMessage variant="danger" message={error} />}

      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-4">
          <Form.Label className="fw-semibold text-muted small mb-2">Search Users</Form.Label>
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <i className="ti ti-search"></i>
            </InputGroup.Text>
            <Form.Control
              className="border-start-0 ps-0"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <div className="p-3 px-4 border-bottom">
            <div className="results-info fw-medium">
              Showing <span className="text-dark fw-bold">{filteredUsers.length}</span> users
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-4 mb-3 opacity-25">
                <i className="ti ti-users"></i>
              </div>
              <h5 className="text-dark fw-bold">No users found</h5>
              <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                Try adjusting your search terms to find the user you're looking for.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th role="button" onClick={() => toggleSort('first_name')}>
                      Name {getSortIndicator('first_name')}
                    </th>
                    <th role="button" onClick={() => toggleSort('email')}>
                      Email {getSortIndicator('email')}
                    </th>
                    <th>Entity</th>
                    <th>Roles</th>
                    <th>Notifications</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} onClick={() => navigate(`/users/${user.id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="vendor-avatar">
                            <i className="ti ti-user" style={{ fontSize: '0.8rem' }}></i>
                          </div>
                          <div>
                            <div className="table-link">{user.first_name} {user.last_name}</div>
                            {user.phone && <div className="text-muted small">{user.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg="light" text="dark">
                          {entities.get(user.entity_id)?.name || 'Unknown'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge
                              key={role}
                              bg={getRoleBadgeVariant(role)}
                              style={{ cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSearchTerm(role)
                              }}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {user.email_enabled && (
                            <Badge bg="success" title="Email Notifications">
                              <i className="ti ti-mail" style={{ fontSize: '0.8rem' }}></i>
                            </Badge>
                          )}
                          {user.wa_enabled && (
                            <Badge bg="success" title="WhatsApp Notifications">
                              <i className="ti ti-brand-whatsapp" style={{ fontSize: '0.8rem' }}></i>
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <Dropdown align="end">
                          <Dropdown.Toggle
                            variant="link"
                            className="text-muted p-0 border-0 shadow-none"
                            id={`user-actions-${user.id}`}
                          >
                            <i className="ti ti-dots-vertical" style={{ fontSize: '1.2rem' }}></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0">
                            <Dropdown.Item onClick={() => navigate(`/users/${user.id}`)} className="d-flex align-items-center gap-2">
                              <i className="ti ti-user"></i> View Profile
                            </Dropdown.Item>
                            <Dropdown.Item
                              onClick={() => navigate(`/users/${user.id}/edit`)}
                              disabled={!canManageUser(user)}
                              className="d-flex align-items-center gap-2"
                            >
                              <i className="ti ti-edit"></i> Edit User
                            </Dropdown.Item>
                            {canManageUsers() && (
                              <>
                                <Dropdown.Divider />
                                <Dropdown.Item
                                  className="text-danger d-flex align-items-center gap-2"
                                  onClick={() => handleDelete(user.id)}
                                  disabled={deletingId === user.id || !canManageUser(user)}
                                >
                                  <i className="ti ti-trash"></i> Delete
                                </Dropdown.Item>
                              </>
                            )}
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <ConfirmationModal
        show={showDeleteConfirm}
        title="Confirm User Deletion"
        message={
          <>
            Are you sure you want to delete this user?
            <br />
            <strong>This action cannot be undone.</strong>
          </>
        }
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeletingId(null)
        }}
        confirmText="Delete"
        variant="danger"
        isLoading={isLoading && deletingId !== null}
      />
    </div>
  )
}
