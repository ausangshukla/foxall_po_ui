import { useState, useEffect, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Card,
  Form,
  Button,
  Row,
  Col,
  Spinner,
} from 'react-bootstrap'
import { useAuth, useRequireAuth } from '../../contexts/AuthContext'
import { LoadingSpinner, AlertMessage } from '../../components/common'
import { createEntity, updateEntity, getEntity } from '../../api/entities'
import type {
  EntityResponse,
  EntityCreateRequest,
  EntityUpdateRequest,
} from '../../types/api'

interface FormData {
  name: string
  url: string
  entity_type: string
  address: string
}

const initialFormData: FormData = {
  name: '',
  url: '',
  entity_type: 'company',
  address: '',
}

const ENTITY_TYPES = ['company', 'branch', 'department', 'warehouse', 'store', 'other']

export function EntityFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()

  const isEditing = !!id
  const entityId = id ? parseInt(id, 10) : null

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isAuth) return

    const loadData = async () => {
      if (isEditing && entityId) {
        try {
          const entityData = await getEntity(entityId)
          setFormData({
            name: entityData.name,
            url: entityData.url,
            entity_type: entityData.entity_type,
            address: entityData.address,
          })
        } catch {
          setError('Failed to load entity')
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isAuth, isEditing, entityId])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.entity_type) errors.entity_type = 'Entity type is required'
    if (formData.url && !/^https?:\/\/.+/.test(formData.url)) {
      errors.url = 'URL must start with http:// or https://'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) return

    setIsSaving(true)

    try {
      if (isEditing && entityId) {
        const updateData: EntityUpdateRequest = {
          name: formData.name,
          url: formData.url,
          entity_type: formData.entity_type,
          address: formData.address,
        }
        await updateEntity(entityId, updateData)
      } else {
        const createData: EntityCreateRequest = {
          name: formData.name,
          url: formData.url,
          entity_type: formData.entity_type,
          address: formData.address,
        }
        await createEntity(createData)
      }

      navigate('/entities')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save entity')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (!isAuth || isLoading) return <LoadingSpinner />
  if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

  return (
    <div>
      <h1 className="mb-4">{isEditing ? 'Edit Entity' : 'Add Entity'}</h1>

      {error && <AlertMessage variant="danger" message={error} />}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Entity Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.name}
                    placeholder="e.g. Foxall Technologies"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.name}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Entity Type *</Form.Label>
                  <Form.Select
                    name="entity_type"
                    value={formData.entity_type}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.entity_type}
                  >
                    {ENTITY_TYPES.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.entity_type}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Website URL</Form.Label>
                  <Form.Control
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    isInvalid={!!validationErrors.url}
                    placeholder="https://example.com"
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors.url}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Must start with http:// or https://
                  </Form.Text>
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={1}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Business St, City, State"
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
                  isEditing ? 'Update Entity' : 'Create Entity'
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/entities')}
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
