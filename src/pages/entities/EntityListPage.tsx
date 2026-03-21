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
import { listEntities, deleteEntity } from '../../api/entities'
import { listUsers } from '../../api/users'
import type { EntityResponse, UserResponse } from '../../types/api'

export function EntityListPage() {
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()

  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [userCounts, setUserCounts] = useState<Map<number, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuth) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [entitiesData, usersData] = await Promise.all([
          listEntities(),
          listUsers(),
        ])
        setEntities(entitiesData)

        // Count users per entity
        const counts = new Map<number, number>()
        usersData.forEach((user: UserResponse) => {
          counts.set(user.entity_id, (counts.get(user.entity_id) || 0) + 1)
        })
        setUserCounts(counts)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load entities'
        console.error('Failed to load entities:', err)
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this entity?')) {
      return
    }

    setDeletingId(id)
    try {
      await deleteEntity(id)
      setEntities(entities.filter((e) => e.id !== id))
    } catch {
      setError('Failed to delete entity')
    } finally {
      setDeletingId(null)
    }
  }

  const getTypeBadgeVariant = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'company':
        return 'primary'
      case 'branch':
        return 'info'
      case 'department':
        return 'success'
      case 'warehouse':
        return 'warning'
      default:
        return 'secondary'
    }
  }

  // Filter entities based on search
  const filteredEntities = entities.filter((entity) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      entity.name.toLowerCase().includes(searchLower) ||
      entity.entity_type.toLowerCase().includes(searchLower) ||
      entity.address.toLowerCase().includes(searchLower)
    )
  })

  if (!isAuth || isLoading) {
    return <LoadingSpinner />
  }

  if (!canManageUsers()) {
    return <AlertMessage variant="danger" message="Access denied" />
  }

  return (
    <div>
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Entities</h1>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={() => navigate('/entities/new')}>
            Add Entity
          </Button>
        </Col>
      </Row>

      {error && <AlertMessage variant="danger" message={error} />}

      <Card className="mb-4">
        <Card.Body>
          <InputGroup>
            <Form.Control
              placeholder="Search by name, type, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {filteredEntities.length === 0 ? (
            <p className="text-muted text-center my-4">No entities found</p>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>URL</th>
                  <th>Address</th>
                  <th>Users</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntities.map((entity) => (
                  <tr key={entity.id}>
                    <td>
                      <strong>{entity.name}</strong>
                    </td>
                    <td>
                      <Badge bg={getTypeBadgeVariant(entity.entity_type)}>
                        {entity.entity_type}
                      </Badge>
                    </td>
                    <td>
                      {entity.url ? (
                        <a
                          href={entity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          {entity.url}
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>{entity.address || <span className="text-muted">—</span>}</td>
                    <td>
                      <Badge bg="light" text="dark" className="fw-semibold">
                        {userCounts.get(entity.id) || 0}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/entities/${entity.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-2"
                        onClick={() => navigate(`/entities/${entity.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(entity.id)}
                        disabled={deletingId === entity.id}
                      >
                        {deletingId === entity.id ? 'Deleting...' : 'Delete'}
                      </Button>
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
