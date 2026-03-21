import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="text-center py-5">
      <Container>
        <h1 className="display-4 fw-bold mb-4">Foxall PO</h1>
        <p className="lead text-muted mb-5">
          Purchase Order Management System
        </p>

        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-5">
                {isAuthenticated ? (
                  <>
                    <h3 className="mb-4">Welcome Back!</h3>
                    <p className="text-muted mb-4">
                      You are logged in. Access your dashboard to manage users and
                      entities.
                    </p>
                    <Button
                      as={Link}
                      to="/dashboard"
                      variant="primary"
                      size="lg"
                    >
                      Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="mb-4">Get Started</h3>
                    <p className="text-muted mb-4">
                      Please sign in to access the system.
                    </p>
                    <Button
                      as={Link}
                      to="/login"
                      variant="primary"
                      size="lg"
                    >
                      Sign In
                    </Button>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}
