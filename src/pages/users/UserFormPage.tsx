import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Alert,
  Spinner,
} from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createUser, updateUser, getUser } from '../../api/users'
import { listEntities } from '../../api/entities'
import type {
  UserResponse,
  EntityResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserRole,
} from '../../types/api'

const AVAILABLE_ROLES: UserRole[] = ['employee', 'admin', 'super']

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  entity_id: string
  wa_enabled: boolean
  email_enabled: boolean
  roles: UserRole[]
}

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
  entity_id: '',
  wa_enabled: true,
  email_enabled: true,
  roles: ['employee'],
}

export function UserFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers, user: currentUser } = useAuth()

  const isEditing = !!id
  const userId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [entities, setEntities] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      try {
        const entitiesData = await listEntities()
        setEntities(entitiesData)

        if (isEditing && userId) {
          const userData = await getUser(userId)
          setFormData({
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            phone: userData.phone,
            password: '',
            entity_id: userData.entity_id.toString(),
            wa_enabled: userData.wa_enabled,
            email_enabled: userData.email_enabled,
            roles: userData.roles as UserRole[],
          })
        } else if (currentUser?.entity_id) {
          setFormData(prev => ({
            ...prev,
            entity_id: currentUser.entity_id.toString(),
          }))
        }
      } catch {
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, userId, currentUser])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.first_name.trim()) errors.first_name = 'First name is required'
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required'
    } else if (formData.phone.length < 10) {
      errors.phone = 'Phone must be at least 10 characters'
    }
    if (!isEditing && !formData.password) {
      errors.password = 'Password is required'
    } else if (!isEditing && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }
    if (!formData.entity_id) errors.entity_id = 'Entity is required'
    if (formData.roles.length === 0) errors.roles = 'At least one role is required'

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsSaving(true)

    try {
      if (isEditing && userId) {
        const updateData: UpdateUserRequest = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          entity_id: parseInt(formData.entity_id, 10),
          wa_enabled: formData.wa_enabled,
          email_enabled: formData.email_enabled,
          roles: formData.roles,
        }
        await updateUser(userId, updateData)
      } else {
        const createData: CreateUserRequest = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          entity_id: parseInt(formData.entity_id, 10),
          wa_enabled: formData.wa_enabled,
          email_enabled: formData.email_enabled,
          roles: formData.roles,
        }
        await createUser(createData)
      }

      navigate('/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role),
    }))
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div>
      <h1 className="mb-4">{isEditing ? 'Edit User' : 'Add User'}</h1>

      {error && <AlertMessage variant="danger" message={error} />}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.first_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.first_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.last_name}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.last_name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone *</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.phone}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.phone}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            {!isEditing && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Password *</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.password}
                      placeholder="Min 8 characters"
                    />
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.password}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Entity *</Form.Label>
                  <Form.Select
                    name="entity_id"
                    value={formData.entity_id}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.entity_id}
                  >
                    <option value="">Select Entity</option>
                    {entities.map(entity => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.entity_id}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roles *</Form.Label>
                  <div>
                    {AVAILABLE_ROLES.map(role => (
                      <Form.Check
                        key={role}
                        inline
                        type="checkbox"
                        id={`role-${role}`}
                        label={role}
                        checked={formData.roles.includes(role)}
                        onChange={e => handleRoleChange(role, e.target.checked)}
                      />
                    ))}
                  </div>
                  {validationErrors.roles && (
                    <Form.Text className="text-danger">
                      {validationErrors.roles}
                    </Form.Text>
                  )}
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

            <div className="d-flex gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  isEditing ? 'Update User' : 'Create User'
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/users')}
                disabled={isSaving}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
