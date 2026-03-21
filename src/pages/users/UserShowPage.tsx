import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Row, Col, Card, Badge, Button } from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { getUser } from '../../api/users'
import { getEntity } from '../../api/entities'
import type { UserResponse, EntityResponse } from '../../types/api'

export function UserShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { user: currentUser } = useAuth()

  const userId = id ? parseInt(id, 10) : null

  const [user, setUser] = useState<UserResponse | null>(null)
  const [entity, setEntity] = useState<EntityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth || !userId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const userData = await getUser(userId)
        setUser(userData)
        const entityData = await getEntity(userData.entity_id)
        setEntity(entityData)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load user'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [isAuth, userId])

  const getRoleBadgeVariant = (role: string): string => {
    switch (role) {
      case 'super': return 'danger'
      case 'admin': return 'warning'
      case 'employee': return 'info'
      default: return 'secondary'
    }
  }

  const getRoleIcon = (role: string): string => {
    switch (role) {
      case 'super': return '👑'
      case 'admin': return '🛡️'
      case 'employee': return '💼'
      default: return '👤'
    }
  }

  const canManageThisUser = (): boolean => {
    if (!user || !currentUser) return false
    if (currentUser.roles.includes('super')) return true
    if (currentUser.roles.includes('admin') && currentUser.entity_id === user.entity_id) return true
    return currentUser.id === user.id
  }

  if (!isAuth || isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <div>
        <AlertMessage variant="danger" message={error} />
        <Button variant="outline-secondary" onClick={() => navigate('/users')}>
          &larr; Back to Users
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <AlertMessage variant="warning" message="User not found" />
        <Button variant="outline-secondary" onClick={() => navigate('/users')}>
          &larr; Back to Users
        </Button>
      </div>
    )
  }

  const primaryRole = user.roles.includes('super') ? 'super'
    : user.roles.includes('admin') ? 'admin' : 'employee'

  const gradientColors: Record<string, string> = {
    super: 'linear-gradient(135deg, #fa896b 0%, #ffae1f 100%)',
    admin: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-secondary) 100%)',
    employee: 'linear-gradient(135deg, #13deb9 0%, #539bff 100%)',
  }

  const detailItemStyle: React.CSSProperties = { background: 'var(--bs-tertiary-bg)' }

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
          onClick={() => navigate('/users')}
        >
          <span style={{ fontSize: '1.25rem' }}>&larr;</span>
          <span className="text-muted">Back to Users</span>
        </Button>
      </div>

      {/* ===== Header Card ===== */}
      <Card className="border-0 shadow-sm mb-4" style={{ overflow: 'hidden' }}>
        <div
          className="d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{
            background: gradientColors[primaryRole] || gradientColors.employee,
            padding: '1.75rem 1.75rem',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold flex-shrink-0"
              style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.25)', fontSize: '1.4rem' }}
            >
              {user.first_name.charAt(0)}{user.last_name.charAt(0)}
            </div>
            <div className="text-white">
              <h2 className="mb-1 fw-semibold" style={{ fontSize: '1.5rem' }}>
                {user.first_name} {user.last_name}
              </h2>
              <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
                <Badge
                  bg="rgba(255,255,255,0.2)"
                  className="border border-white border-opacity-40 text-white"
                  style={{ fontSize: '0.75rem' }}
                >
                  {getRoleIcon(primaryRole)} {primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1)}
                </Badge>
                {user.email_enabled && (
                  <Badge bg="rgba(255,255,255,0.2)" className="border border-white border-opacity-40 text-white" style={{ fontSize: '0.75rem' }}>
                    ✉️ Email
                  </Badge>
                )}
                {user.wa_enabled && (
                  <Badge bg="rgba(255,255,255,0.2)" className="border border-white border-opacity-40 text-white" style={{ fontSize: '0.75rem' }}>
                    📱 WhatsApp
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {canManageThisUser() && (
            <Button
              variant="light"
              size="sm"
              className="d-flex align-items-center gap-1 fw-semibold"
              onClick={() => navigate(`/users/${user.id}/edit`)}
            >
              <span>✏️</span> Edit User
            </Button>
          )}
        </div>

        {/* User Details Grid */}
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-primary-bg-subtle)')}>👤</div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>First Name</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>{user.first_name}</div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-primary-bg-subtle)')}>👤</div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Last Name</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>{user.last_name}</div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-success-bg-subtle)')}>✉️</div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Email</div>
                  <div className="mt-1">
                    <a href={`mailto:${user.email}`} className="fw-semibold text-decoration-none">{user.email}</a>
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-info-bg-subtle)')}>📱</div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Phone</div>
                  <div className="fw-semibold mt-1" style={{ color: 'var(--bs-heading-color)' }}>
                    <a href={`tel:${user.phone}`} className="text-decoration-none" style={{ color: 'inherit' }}>{user.phone}</a>
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-warning-bg-subtle)')}>🏢</div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>Entity</div>
                  <div className="mt-1">
                    {entity ? (
                      <Button
                        variant="link"
                        className="fw-semibold p-0 text-decoration-none"
                        onClick={() => navigate(`/entities/${entity.id}`)}
                      >
                        {entity.name} <span style={{ fontSize: '0.75rem' }}>→</span>
                      </Button>
                    ) : (
                      <span className="text-muted fst-italic">Unknown</span>
                    )}
                  </div>
                </div>
              </div>
            </Col>

            <Col md={6} lg={4}>
              <div className="d-flex align-items-start gap-3 p-3 rounded-3" style={detailItemStyle}>
                <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle('var(--bs-secondary-bg-subtle)')}>#</div>
                <div>
                  <div className="text-muted fw-medium" style={labelStyle}>User ID</div>
                  <div className="mt-1">
                    <code style={{ background: 'var(--bs-tertiary-bg)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                      {user.id}
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
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="mb-2" style={{ fontSize: '2rem' }}>{getRoleIcon(primaryRole)}</div>
              <div className="fw-bold display-6" style={{ color: 'var(--bs-primary)' }}>{user.roles.length}</div>
              <div className="text-muted small fw-medium">Assigned Roles</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="mb-2" style={{ fontSize: '2rem' }}>✉️</div>
              <div className="fw-bold display-6" style={{ color: user.email_enabled ? 'var(--bs-success)' : 'var(--bs-secondary)' }}>
                {user.email_enabled ? 'On' : 'Off'}
              </div>
              <div className="text-muted small fw-medium">Email Notifications</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="mb-2" style={{ fontSize: '2rem' }}>📱</div>
              <div className="fw-bold display-6" style={{ color: user.wa_enabled ? 'var(--bs-success)' : 'var(--bs-secondary)' }}>
                {user.wa_enabled ? 'On' : 'Off'}
              </div>
              <div className="text-muted small fw-medium">WhatsApp Notifications</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={3}>
          <Card className="border-0 shadow-sm text-center h-100">
            <Card.Body className="py-4">
              <div className="mb-2" style={{ fontSize: '2rem' }}>🔔</div>
              <div className="fw-bold display-6" style={{ color: 'var(--bs-info)' }}>
                {[user.email_enabled, user.wa_enabled].filter(Boolean).length}/2
              </div>
              <div className="text-muted small fw-medium">Active Channels</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ===== Bottom Cards ===== */}
      <Row className="g-3">
        {/* Roles & Permissions */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="border-bottom" style={{ background: 'transparent', padding: '1rem 1.5rem' }}>
              <h5 className="mb-0 fw-semibold">🛡️ Roles &amp; Permissions</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-flex flex-wrap gap-2">
                {user.roles.map((role) => (
                  <Badge
                    key={role}
                    bg={getRoleBadgeVariant(role)}
                    className="px-3 py-2 d-flex align-items-center gap-1"
                    style={{ fontSize: '0.85rem' }}
                  >
                    {getRoleIcon(role)} {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Badge>
                ))}
              </div>
              <div className="mt-3">
                {primaryRole === 'super' && (
                  <p className="text-muted mb-0 small">
                    Super admins have full access to manage all users and entities across the system.
                  </p>
                )}
                {primaryRole === 'admin' && (
                  <p className="text-muted mb-0 small">
                    Admins can manage users within their own entity.
                  </p>
                )}
                {primaryRole === 'employee' && (
                  <p className="text-muted mb-0 small">
                    Employees can view and edit their own profile.
                  </p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Notification Preferences */}
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="border-bottom" style={{ background: 'transparent', padding: '1rem 1.5rem' }}>
              <h5 className="mb-0 fw-semibold">🔔 Notification Preferences</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                <Col xs={12} sm={6}>
                  <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle(user.email_enabled ? 'var(--bs-success-bg-subtle)' : 'var(--bs-secondary-bg-subtle)')}>✉️</div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>Email</div>
                      <div className="mt-1">
                        <Badge bg={user.email_enabled ? 'success' : 'secondary'} className="fw-medium">
                          {user.email_enabled ? '✓ Enabled' : '✗ Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={detailItemStyle}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={iconCircleStyle(user.wa_enabled ? 'var(--bs-success-bg-subtle)' : 'var(--bs-secondary-bg-subtle)')}>📱</div>
                    <div>
                      <div className="text-muted fw-medium" style={labelStyle}>WhatsApp</div>
                      <div className="mt-1">
                        <Badge bg={user.wa_enabled ? 'success' : 'secondary'} className="fw-medium">
                          {user.wa_enabled ? '✓ Enabled' : '✗ Disabled'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
