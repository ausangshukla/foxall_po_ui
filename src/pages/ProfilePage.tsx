import { useState, useEffect, FormEvent } from 'react'
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../components/common'
import { updateUser } from '../api/users'
import { listEntities } from '../api/entities'
import type { EntityResponse, UpdateUserRequest } from '../types/api'

export function ProfilePage() {
  const isAuth = useRequireAuth()
  const { user, refreshUser } = useAuth()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    wa_enabled: false,
    email_enabled: false,
  })
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      try {
        const entitiesData = await listEntities()
        setEntities(entitiesData)

        if (user) {
          setFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone: user.phone,
            wa_enabled: user.wa_enabled,
            email_enabled: user.email_enabled,
          })
        }
      } catch {
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setSuccessMessage(null)
    setIsSaving(true)

    try {
      const updateData: UpdateUserRequest = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        wa_enabled: formData.wa_enabled,
        email_enabled: formData.email_enabled,
      }

      await updateUser(user.id, updateData)
      await refreshUser()
      setSuccessMessage('Profile updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const entityName = entities.find(e => e.id === user?.entity_id)?.name || 'Unknown'

  if (!isAuth || isLoading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="mb-4">My Profile</h1>

      {successMessage && (
        <AlertMessage variant="success" message={successMessage} />
      )}
      {error && <AlertMessage variant="danger" message={error} />}

      <Row>
        <Col md={8}>
          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="wa_enabled"
                        name="wa_enabled"
                        label="WhatsApp Notifications Enabled"
                        checked={formData.wa_enabled}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="switch"
                        id="email_enabled"
                        name="email_enabled"
                        label="Email Notifications Enabled"
                        checked={formData.email_enabled}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button variant="primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Update Profile'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="bg-light">
            <Card.Body>
              <h5 className="mb-3">Account Information</h5>

              <p className="mb-2">
                <strong>ID:</strong> #{user?.id}
              </p>

              <p className="mb-2">
                <strong>Entity:</strong> {entityName}
              </p>

              <p className="mb-0">
                <strong>Roles:</strong>{' '}
                {user?.roles.map(role => (
                  <span key={role} className="badge bg-primary me-1">
                    {role}
                  </span>
                ))}
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
