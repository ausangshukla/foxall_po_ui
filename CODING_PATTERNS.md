# Coding Patterns & Best Practices Guide

This document outlines the patterns, conventions, and best practices used in the Foxall PO UI codebase for future AI assistance.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [API Layer Patterns](#api-layer-patterns)
3. [Error Handling Patterns](#error-handling-patterns)
4. [Screen/Page Patterns](#screenpage-patterns)
5. [Form Handling Patterns](#form-handling-patterns)
6. [Authentication Patterns](#authentication-patterns)
7. [Loading & Empty States](#loading--empty-states)
8. [Type Definitions](#type-definitions)
9. [Component Patterns](#component-patterns)
10. [Styling Patterns](#styling-patterns)

---

## Project Structure

```
src/
├── api/              # API client and endpoint functions
├── components/       # Reusable UI components
│   ├── common/       # Shared components (LoadingSpinner, AlertMessage, etc.)
│   └── Layout/       # Layout components (Navbar, Layout)
├── config/           # Configuration (API URLs, routes, storage keys)
├── contexts/         # React contexts (AuthContext)
├── lib/              # Utility functions (storage, jwt)
├── pages/            # Page components
│   ├── users/        # User-related pages
│   ├── entities/     # Entity-related pages
│   └── *.tsx         # Top-level pages
├── router/           # React Router configuration
├── types/            # TypeScript type definitions
└── main.tsx          # Application entry point
```

### Key Principles

- **Co-location**: Keep related files together (e.g., `pages/users/` contains all user-related pages)
- **Index exports**: Each folder has an `index.ts` that re-exports public members
- **Barrel imports**: Import from folders using index files: `import { UserListPage } from './pages'`

---

## API Layer Patterns

### 1. API Client Pattern (`src/api/client.ts`)

**Centralized HTTP client with error handling:**

```typescript
// apiRequest is the base function - use api.get/post/put/delete for convenience
import { api } from './client'

// GET request
const users = await api.get<UserResponse[]>('/api/users')

// POST request
const newUser = await api.post<UserResponse>('/api/users', userData)

// PUT request
const updated = await api.put<UserResponse>(`/api/users/${id}`, userData)

// DELETE request
await api.delete(`/api/users/${id}`)
```

### 2. Domain-Specific API Modules

**Create separate files for each domain:**

```typescript
// src/api/users.ts
import { API_ROUTES } from '../config'
import { api } from './client'
import type { UserResponse, CreateUserRequest } from '../types/api'

export async function listUsers(): Promise<UserResponse[]> {
  return api.get<UserResponse[]>(API_ROUTES.USERS)
}

export async function getUser(id: number): Promise<UserResponse> {
  return api.get<UserResponse>(API_ROUTES.USER(id))
}

export async function createUser(data: CreateUserRequest): Promise<UserResponse> {
  return api.post<UserResponse>(API_ROUTES.USERS, data)
}
```

### 3. API Routes Configuration

**Centralize all API endpoints in `src/config/index.ts`:**

```typescript
export const API_ROUTES = {
  // Auth
  LOGIN: '/api/auth/login',
  
  // Users
  USERS: '/api/users',
  USER: (id: number) => `/api/users/${id}`,
  
  // Entities
  ENTITIES: '/api/entities',
  ENTITY: (id: number) => `/api/entities/${id}`,
} as const
```

---

## Error Handling Patterns

### 1. Custom Error Classes (`src/types/api.ts`)

**Use typed errors for different scenarios:**

```typescript
// Base API error
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Specific error types
export class AuthError extends Error {
  constructor(message: string = 'Session expired') {
    super(message)
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ValidationError extends Error {
  constructor(message: string = 'Validation failed') {
    super(message)
    this.name = 'ValidationError'
  }
}

export class LoginError extends Error {
  constructor(message: string = 'Invalid credentials') {
    super(message)
    this.name = 'LoginError'
  }
}
```

### 2. Error Handling in API Client

**The API client automatically maps error codes to error types:**

```typescript
// In apiRequest function, errors are automatically converted:
switch (code) {
  case 'UNAUTHORIZED':
    throw new AuthError(message)
  case 'FORBIDDEN':
    throw new ForbiddenError(message)
  case 'LOGIN_FAILED':
    throw new LoginError(message)
  case 'VALIDATION_ERROR':
    throw new ValidationError(message)
  default:
    throw new ApiError(code, message)
}
```

### 3. Error Handling in Components

**Pattern for handling errors in pages:**

```typescript
const [error, setError] = useState<string | null>(null)

try {
  await someApiCall()
} catch (err) {
  // Always extract message from Error objects
  const message = err instanceof Error ? err.message : 'Failed to perform action'
  setError(message)
  console.error('Action failed:', err)
} finally {
  setIsLoading(false)
}

// Display error
{error && <AlertMessage variant="danger" message={error} />}
```

### 4. Specific Error Type Checking

**When you need different handling for different error types:**

```typescript
try {
  await login({ email, password })
} catch (err) {
  if (err instanceof LoginError) {
    setError('Invalid email or password')
  } else if (err instanceof ValidationError) {
    setError(err.message)
  } else {
    setError('An unexpected error occurred')
  }
}
```

---

## Screen/Page Patterns

### 1. Standard Page Structure

**Every list page follows this structure:**

```typescript
export function EntityListPage() {
  // 1. Auth check
  const isAuth = useRequireAuth()
  const navigate = useNavigate()
  const { canManageUsers } = useAuth()
  
  // 2. State management
  const [items, setItems] = useState<EntityResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // 3. Data fetching
  useEffect(() => {
    if (!isAuth) return
    
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await listEntities()
        setItems(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [isAuth])
  
  // 4. Loading state
  if (!isAuth || isLoading) return <LoadingSpinner />
  
  // 5. Permission check
  if (!canManageUsers()) {
    return <AlertMessage variant="danger" message="Access denied" />
  }
  
  // 6. Render
  return (
    <div>
      {/* Header with actions */}
      <Row className="mb-4 align-items-center">
        <Col><h1>Page Title</h1></Col>
        <Col xs="auto">
          <Button onClick={() => navigate('/route/new')}>Add New</Button>
        </Col>
      </Row>
      
      {/* Error display */}
      {error && <AlertMessage variant="danger" message={error} />}
      
      {/* Content */}
      <Card>...</Card>
    </div>
  )
}
```

### 2. Show Page Pattern

**Detail pages follow this pattern:**

```typescript
export function EntityShowPage() {
  const { id } = useParams<{ id: string }>()
  const isAuth = useRequireAuth()
  
  const [entity, setEntity] = useState<EntityResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!isAuth || !id) return
    
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await getEntity(parseInt(id, 10))
        setEntity(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [isAuth, id])
  
  if (!isAuth || isLoading) return <LoadingSpinner />
  
  if (error) {
    return (
      <div>
        <AlertMessage variant="danger" message={error} />
        <Button onClick={() => navigate('/entities')}>Back to List</Button>
      </div>
    )
  }
  
  if (!entity) {
    return (
      <div>
        <AlertMessage variant="warning" message="Not found" />
        <Button onClick={() => navigate('/entities')}>Back to List</Button>
      </div>
    )
  }
  
  // Render entity details...
}
```

### 3. Back Navigation Pattern

**Always include back navigation on detail/form pages:**

```typescript
// Simple back button
<Button variant="outline-secondary" onClick={() => navigate('/users')}>
  &larr; Back to Users
</Button>

// Styled back navigation
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
```

---

## Form Handling Patterns

### 1. Form Page Structure

**Standard form page template:**

```typescript
export function EntityFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isAuth = useRequireAuth()
  const { canManageUsers } = useAuth()
  
  // Determine mode
  const isEditing = !!id
  const entityId = id ? parseInt(id, 10) : null
  
  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(isEditing) // Start loading if editing
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Load existing data if editing
  useEffect(() => {
    if (!isAuth) return
    
    const loadData = async () => {
      if (isEditing && entityId) {
        try {
          const data = await getEntity(entityId)
          setFormData({
            name: data.name,
            // ...map fields
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
  
  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  // Submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    setIsSaving(true)
    
    try {
      if (isEditing && entityId) {
        const updateData: UpdateRequest = { /* map fields */ }
        await updateEntity(entityId, updateData)
      } else {
        const createData: CreateRequest = { /* map fields */ }
        await createEntity(createData)
      }
      
      navigate('/entities')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Change handler with validation clearing
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear validation error when user types
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
            <Form.Group className="mb-3">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!validationErrors.name}
              />
              <Form.Control.Feedback type="invalid">
                {validationErrors.name}
              </Form.Control.Feedback>
            </Form.Group>
            
            <div className="d-flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <><Spinner size="sm" className="me-2" />Saving...</>
                ) : (
                  isEditing ? 'Update' : 'Create'
                )}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/entities')}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}
```

### 2. Form Validation Patterns

**Email validation:**
```typescript
if (!formData.email.trim()) {
  errors.email = 'Email is required'
} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
  errors.email = 'Invalid email format'
}
```

**Password validation:**
```typescript
if (!isEditing && !formData.password) {
  errors.password = 'Password is required'
} else if (!isEditing && formData.password.length < 8) {
  errors.password = 'Password must be at least 8 characters'
}
```

**URL validation:**
```typescript
if (formData.url && !/^https?:\/\/.+/.test(formData.url)) {
  errors.url = 'URL must start with http:// or https://'
}
```

### 3. Select/Dropdown Fields

```typescript
<Form.Select
  name="entity_type"
  value={formData.entity_type}
  onChange={handleChange}
  isInvalid={!!validationErrors.entity_type}
>
