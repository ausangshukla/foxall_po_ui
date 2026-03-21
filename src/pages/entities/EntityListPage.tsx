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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const toggleSort = (key: keyof EntityResponse) => {
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

  const handleDelete = (id: number) => {
    setDeletingId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (deletingId === null) return

    try {
      setIsLoading(true)
      await deleteEntity(deletingId)
      setEntities(entities.filter((e) => e.id !== deletingId))
      setShowDeleteConfirm(false)
    } catch {
      setError('Failed to delete entity')
    } finally {
      setIsLoading(false)
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

  const [sortKey, setSortKey] = useState<keyof EntityResponse>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Filter entities based on search
  const filteredEntities = entities.filter((entity) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      entity.name.toLowerCase().includes(searchLower) ||
      entity.entity_type.toLowerCase().includes(searchLower) ||
      entity.address.toLowerCase().includes(searchLower)
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

  const getSortIndicator = (key: keyof EntityResponse) => {
    if (sortKey !== key) return <i className="ti ti-selector text-muted opacity-25 ms-1" style={{ fontSize: '0.8rem' }}></i>
    return <i className={`ti ti-chevron-${sortDir === 'asc' ? 'up' : 'down'} sort-active ms-1`} style={{ fontSize: '0.8rem' }}></i>
  }

  if (!isAuth || isLoading) {
    return <LoadingSpinner />
  }

  if (!canManageUsers()) {
    return <AlertMessage variant="danger" message="Access denied" />
  }

  return (
    <div className="pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">Entities</h1>
          <p className="text-muted small mb-0">Manage organizations, branches, and departments</p>
        </div>
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2"
          onClick={() => navigate('/entities/new')}
        >
          <i className="ti ti-plus"></i> Add Entity
        </Button>
      </div>

      {error && <AlertMessage variant="danger" message={error} />}

      <Card className="mb-4 shadow-sm border-0">
        <Card.Body className="p-4">
          <Form.Label className="fw-semibold text-muted small mb-2">Search Entities</Form.Label>
          <InputGroup>
            <InputGroup.Text className="bg-white border-end-0 text-muted">
              <i className="ti ti-search"></i>
            </InputGroup.Text>
            <Form.Control
              className="border-start-0 ps-0"
              placeholder="Search by name, type, or address..."
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
              Showing <span className="text-dark fw-bold">{filteredEntities.length}</span> entities
            </div>
          </div>

          {filteredEntities.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-4 mb-3 opacity-25">
                <i className="ti ti-building"></i>
              </div>
              <h5 className="text-dark fw-bold">No entities found</h5>
              <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                Try adjusting your search terms to find the entity you're looking for.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead>
                  <tr>
                    <th role="button" onClick={() => toggleSort('name')}>
                      Name {getSortIndicator('name')}
                    </th>
                    <th role="button" onClick={() => toggleSort('entity_type')}>
                      Type {getSortIndicator('entity_type')}
                    </th>
                    <th>URL</th>
                    <th role="button" onClick={() => toggleSort('address')}>
                      Address {getSortIndicator('address')}
                    </th>
                    <th>Users</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntities.map((entity) => (
                    <tr key={entity.id} onClick={() => navigate(`/entities/${entity.id}`)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="vendor-avatar">
                            <i className="ti ti-building-community" style={{ fontSize: '0.8rem' }}></i>
                          </div>
                          <div>
                            <div className="table-link">{entity.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge
                          bg={getTypeBadgeVariant(entity.entity_type)}
                          style={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSearchTerm(entity.entity_type)
                          }}
                        >
                          {entity.entity_type}
                        </Badge>
                      </td>
                      <td>
                        {entity.url ? (
                          <a
                            href={entity.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-decoration-none small d-flex align-items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <i className="ti ti-external-link"></i>
                            {entity.url.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        ) : (
                          <span className="text-muted small">—</span>
                        )}
                      </td>
                      <td>
                        <div className="small text-truncate" style={{ maxWidth: '200px' }}>
                          {entity.address || <span className="text-muted">—</span>}
                        </div>
                      </td>
                      <td>
                        <Badge bg="light" text="dark">
                          {userCounts.get(entity.id) || 0} users
                        </Badge>
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <Dropdown align="end">
                          <Dropdown.Toggle
                            variant="link"
                            className="text-muted p-0 border-0 shadow-none"
                            id={`entity-actions-${entity.id}`}
                          >
                            <i className="ti ti-dots-vertical" style={{ fontSize: '1.2rem' }}></i>
                          </Dropdown.Toggle>
                          <Dropdown.Menu className="shadow-sm border-0">
                            <Dropdown.Item onClick={() => navigate(`/entities/${entity.id}`)} className="d-flex align-items-center gap-2">
                              <i className="ti ti-eye"></i> View Details
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => navigate(`/entities/${entity.id}/edit`)} className="d-flex align-items-center gap-2">
                              <i className="ti ti-edit"></i> Edit Entity
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item
                              className="text-danger d-flex align-items-center gap-2"
                              onClick={() => handleDelete(entity.id)}
                              disabled={deletingId === entity.id}
                            >
                              <i className="ti ti-trash"></i> Delete
                            </Dropdown.Item>
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
        title="Confirm Entity Deletion"
        message={
          <>
            Are you sure you want to delete this entity?
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
