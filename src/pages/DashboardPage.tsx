import { useEffect } from 'react'
import { Row, Col, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRequireAuth } from '../contexts/AuthContext'
import { LoadingSpinner } from '../components/common'

export function DashboardPage() {
  const isAuth = useRequireAuth()
  const { user, hasRole } = useAuth()

  if (!isAuth) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      <Row>
        <Col md={6} lg={4} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Welcome, {user?.first_name}!</Card.Title>
              <Card.Text className="text-muted">
                You are logged in as{' '}
                <span className="badge bg-primary">
                  {user?.roles.join(', ')}
                </span>
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {hasRole('super') && (
          <Col md={6} lg={4} className="mb-4">
            <Card className="border-primary">
              <Card.Body>
                <Card.Title className="text-primary">Super Admin</Card.Title>
                <Card.Text>
                  You have full access to manage all users and entities across the
                  system.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}

        {hasRole('admin') && (
          <Col md={6} lg={4} className="mb-4">
            <Card className="border-info">
              <Card.Body>
                <Card.Title className="text-info">Admin</Card.Title>
                <Card.Text>
                  You can manage users within your entity.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}

        {hasRole('employee') && (
          <Col md={6} lg={4} className="mb-4">
            <Card>
              <Card.Body>
                <Card.Title>Employee</Card.Title>
                <Card.Text>
                  You have access to view your profile information.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Links</h5>
            </Card.Header>
            <Card.Body>
              <ul className="list-unstyled mb-0">
                <li className="mb-2">
                  <a href="/profile" className="text-decoration-none">
                    → View/Edit Profile
                  </a>
                </li>
                {(hasRole('super') || hasRole('admin')) && (
                  <li>
                    <a href="/users" className="text-decoration-none">
                      → Manage Users
                    </a>
                  </li>
                )}
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
