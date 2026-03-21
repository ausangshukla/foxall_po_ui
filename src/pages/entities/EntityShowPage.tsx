import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Row, Col, Card, Badge, Button, Table } from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getEntity } from '../../api/entities'
import { listUsers } from '../../api/users'
import type { EntityResponse, UserResponse } from '../../types/api'

export function EntityShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()

  const entityId = id ? parseInt(id, 10) : null

  const [entity, setEntity] = useState<EntityResponse | null>(null)
  const [users, setUsers] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth || !entityId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [entityData, usersData] = await Promise.all([
          getEntity(entityId),
          listUsers(),
        ])
        setEntity(entityData)
        setUsers(usersData.filter((u) => u.entity_id === entityId))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load entity'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth, entityId])

  const getTypeBadgeVariant = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'company': return 'primary'
      case 'branch': return 'info'
      case 'department': return 'success'
      case 'warehouse': return 'warning'
      case 'store': return 'secondary'
      default: return 'light'
    }
  }

  const getTypeIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'company': return '🏢'
      case 'branch': return '🏛️'
      case 'department': return '📂'
      case 'warehouse': return '🏭'
      case 'store': return '🛍️'
      default: return '📋'
    }
  }

  const getRoleBadgeVariant = (role: string): string => {
    switch (role) {
      case 'super': return 'danger'
      case 'admin': return 'warning'
      case 'employee': return 'info'
      default: return 'secondary'
    }
  }

  const adminCount = users.filter(
    (u) => u.roles.includes('admin') || u.roles.includes('super')
  ).length
  const employeeCount = users.filter(
    (u) => u.roles.includes('employee') && !u.roles.includes('admin') && !u.roles.includes('super')
  ).length
  const emailEnabledCount = users.filter((u) => u.email_enabled).length
  const waEnabledCount = users.filter((u) => u.wa_enabled).length

  if (!isAuth || isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div>
        <AlertMessage variant="danger" message={error} />
        <Button variant="outline-secondary" onClick={() => navigate('/entities')}>
          &larr; Back to Entities
        </Button>
      </div>
    )
  }

  if (!entity) {
    return (
      <div>
        <AlertMessage variant="warning" message="Entity not found" />
        <Button variant="outline-secondary" onClick={() => navigate('/entities')}>
          &larr; Back to Entities
        </Button>
      </div>
    )
  }

  const detailItemStyle: React.CSSProperties = {
    background: 'var(--bs-tertiary-bg)',
  }

  const iconCircleStyle = (bg: string): React.CSSProperties => ({
    width: '40px',
    height: '40px',
    background: bg,
    fontSize: '1.1rem',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div>
      {/* Back navigation */}
      <div className="mb-3">
        <Button
          variant="link"
          className="text-decoration-none p-0 d-inline-flex align-items-center gap-1"
          onClick={() => navigate('/entities')}
        >
          <span style={{ fontSize: '1.25rem' }}>&larr;</span>
          <span className="text-muted">Back to Entities</span>
        </Button>
      </div>

      {/* ===== Header Card ===== */}
      <Card className="border-0 shadow-sm mb-4" style={{ overflow: 'hidden' }}>
        <div
          className="d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{
            background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-secondary) 100%)',
            padding: '1.75rem 1.75rem',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.2)', fontSize: '1.75rem' }}
            >
              {getTypeIcon(entity.entity_type)}
            </div>
            <div className="text-white">
              <h2 className="mb-1 fw-semibold" style={{ fontSize: '1.5rem' }}>
                {entity.name}
              </h2>
              <Badge
                bg="rgba(255,255,255,0.2)"
                className="border border-white border-opacity-40 text-white"
                style={{ fontSize: '0.75rem' }}
              >
                {entity.entity_type.charAt(0).toUpperCase() + entity.entity_type.slice(1)}
              </Badge>
            </div>
          </div>

          {canManageUsers() && (
            <Button
              variant="light"
              size="sm"
              className="d-flex align-items-center gap-1 fw-semibold"
              onClick={() => navigate(`/entities/${entity.id}/edit`)}
            >
              <span>✏️</span> Edit Entity
            </Button>
          )}
        </div>

        {/* Entity Details Grid */}
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-primary-bg-subtle)')}>
                  📛
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Name</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>{entity.name}</div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-info-bg-subtle)')}>
                  🏷️
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Type</div>
                  <div className="mt-1">
                    <Badge bg={getTypeBadgeVariant(entity.entity_type)} className="px-3 py-2">
                      {entity.entity_type.charAt(0).toUpperCase() + entity.entity_type.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-success-bg-subtle)')}>
                  🌐
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="text-muted fw-medium" style={labelStyle}>Website</div>
                  <div className="mt-1">
                    {entity.url ? (
                      <a href={entity.url} target="_blank" rel="noopener noreferrer" className="fw-semibold text-decoration-none" style={{ wordBreak: 'break-all' }}>
                        {entity.url} <span style={{ fontSize: '0.75rem' }}>↗</span>
                      </a>
                    ) : (
                      <span className="text-muted fst-italic">Not set</span>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={8}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-warning-bg-subtle)')}>
                  📍
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Address</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    {entity.address || <span className="text-muted fst-italic">Not set</span>}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-secondary-bg-subtle)')}>
                  #
                </div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Entity ID</div>
                  <div className="mt-1">
                    <code style={{ background: 'var(--bs-tertiary-bg)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {entity.id}
                    </code>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* ===== Stats Cards ===== */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="mb-2" style={{ fontSize: '2rem' }}>👥</div>
              <div className="fw-bold display-6" style={{ color: 'var(--bs-primary)' }}>
                {users.length}
              </div>
              <div className="text-muted small fw-medium">Total Users</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="mb-2" style={{ fontSize: '2rem' }}>🛡️</div>
              <div className="fw-bold display-6" style={{ color: 'var(--bs-warning)' }}>
                {adminCount}
              </div>
              <div className="text-muted small fw-medium">Admins</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="mb-2" style={{ fontSize: '2rem' }}>💼</div>
              <div className="fw-bold display-6" style={{ color: 'var(--bs-success)' }}>
                {employeeCount}
              </div>
              <div className="text-muted small fw-medium">Employees</div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="mb-2" style={{ fontSize: '2rem' }}>🔔</div>
              <div className="fw-bold display-6" style={{ color: 'var(--bs-info)' }}>
                {emailEnabledCount + waEnabledCount}
              </div>
              <div className="text-muted small fw-medium">Active Notifications</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== Users Table ===== */}
      <Card className="border-0 shadow-sm">
        <Card.Header
          className="d-flex align-items-center justify-content-between border-bottom"
          style={{ background: 'transparent', padding: '1rem 1.5rem' }}
        >
          <div className="d-flex align-items-center gap-2">
            <h5 className="mb-0 fw-semibold">Users in this Entity</h5>
            <Badge bg="light" text="dark" className="fw-bold px-2 py-1">
              {users.length}
            </Badge>
          </div>
          {canManageUsers() && (
            <Button variant="primary" size="sm" onClick={() => navigate('/users/new')}>
              + Add User
            </Button>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
              <h6 className="text-muted">No users in this entity yet</h6>
              <p className="text-muted small">
                Users assigned to this entity will appear here.
              </p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead>
                <tr style={{ background: 'var(--bs-tertiary-bg)' }}>
                  <th className="fw-semibold text-muted ps-4" style={{ ...labelStyle, border: 'none' }}>User</th>
                  <th className="fw-semibold text-muted" style={{ ...labelStyle, border: 'none' }}>Contact</th>
                  <th className="fw-semibold text-muted" style={{ ...labelStyle, border: 'none' }}>Roles</th>
                  <th className="fw-semibold text-muted pe-4" style={{ ...labelStyle, border: 'none' }}>Notifications</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <td className="ps-4 py-3" style={{ borderTop: index === 0 ? 'none' : undefined }}>
                      <div className="d-flex align-items-center gap-3">
                        <div
                          className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                          style={{
                            width: '36px',
                            height: '36px',
                            background: `hsl(${(user.id * 67) % 360}, 65%, 85%)`,
                            color: 'var(--bs-heading-color)',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                          }}
                        >
                          {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ color: 'var(--bs-heading-color)', fontSize: '0.875rem' }}>
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div style={{ fontSize: '0.875rem' }}>
                        <div className="d-flex align-items-center gap-1 mb-1">
                          <span>✉️</span> <span>{user.email}</span>
                        </div>
                        <div className="d-flex align-items-center gap-1 text-muted">
                          <span>📱</span> <span>{user.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="d-flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <Badge key={role} bg={getRoleBadgeVariant(role)} className="fw-medium">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pe-4">
                      <div className="d-flex gap-1 flex-wrap">
                        <Badge bg={user.email_enabled ? 'success' : 'secondary'} className="fw-medium">
                          ✉️ Email
                        </Badge>
                        <Badge bg={user.wa_enabled ? 'success' : 'secondary'} className="fw-medium">
                          📱 WhatsApp
                        </Badge>
                      </div>
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
