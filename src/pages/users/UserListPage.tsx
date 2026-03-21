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
} from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteUser(id)
      setUsers(users.filter((u) => u.id !== id))
    } catch {
      setError('Failed to delete user')
    } finally {
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

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.first_name.toLowerCase().includes(searchLower) ||
      user.last_name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  // Check if user can manage specific user
  const canManageUser = (user: UserResponse): boolean => {
    if (canManageAllUsers()) return true
    if (canManageUsers() && currentUser?.entity_id === user.entity_id) return true
    return currentUser?.id === user.id
  }

  if (!isAuth || isLoading) {
    return <LoadingSpinner />
  }

  if (!canManageUsers() && !currentUser) {
    return <AlertMessage variant="danger" message="Access denied" />
  }

  return (
    <div>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Users</h1>
        </Col>
        <Col xs="auto">
          {canManageUsers() && (
            <Button variant="primary" onClick={() => navigate('/users/new')}>
              Add User
            </Button>
          )}
        </Col>
      </Row>

      {error && <AlertMessage variant="danger" message={error} />}

      <Card className="mb-4">
        <Card.Body>
          <InputGroup>
            <Form.Control
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {filteredUsers.length === 0 ? (
            <p className="text-muted text-center my-4">No users found</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Entity</th>
                  <th>Roles</th>
                  <th>Notifications</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      {user.first_name} {user.last_name}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.phone}</td>
                    <td>{entities.get(user.entity_id)?.name || 'Unknown'}</td>
                    <td>
                      {user.roles.map((role) => (
                        <Badge
                          key={role}
                          bg={getRoleBadgeVariant(role)}
                          className="me-1"
                        >
                          {role}
                        </Badge>
                      ))}
                    </td>
                    <td>
                      {user.email_enabled && (
                        <Badge bg="success" className="me-1">
                          Email
                        </Badge>
                      )}
                      {user.wa_enabled && (
                        <Badge bg="success">WhatsApp</Badge>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/users/${user.id}/edit`)}
                        disabled={!canManageUser(user)}
                      >
                        Edit
                      </Button>
                      {canManageUsers() && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id || !canManageUser(user)}
                        >
                          {deletingId === user.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
