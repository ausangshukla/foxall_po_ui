# Coding Patterns & Best Practices Guide

Quick reference for working with the Foxall PO UI codebase. Follow existing patterns in `src/` rather than inventing new ones.

---

## Project Structure

```
src/
├── api/           # API clients - see `src/api/client.ts` for base pattern
├── components/    # Reusable UI components
│   ├── common/    # AlertMessage, LoadingSpinner, NotFound, Forbidden
│   └── Layout/    # Layout, Navbar
├── config/        # API_ROUTES, STORAGE_KEYS
├── contexts/      # AuthContext with role helpers
├── lib/           # storage, jwt utilities
├── pages/         # Page components organized by domain
├── router/        # Route definitions
└── types/         # TypeScript types + error classes
```

**Key Principle**: Co-locate related files. Each folder has an `index.ts` for barrel exports.

---

## Creating New Screens

### 1. List Page

**Reference implementations:**
- `src/pages/users/UserListPage.tsx`
- `src/pages/entities/EntityListPage.tsx`

**Key patterns:**
```typescript
// Use auth hook - redirects to login if not authenticated
const isAuth = useRequireAuth()

// Permission check after loading
if (!canManageUsers()) return <AlertMessage variant="danger" message="Access denied" />

// Early return for loading state
if (!isAuth || isLoading) return <LoadingSpinner />

// Error display pattern
{error && <AlertMessage variant="danger" message={error} />}
```

### 2. Form Page (Create/Edit)

**Reference implementations:**
- `src/pages/users/UserFormPage.tsx`
- `src/pages/entities/EntityFormPage.tsx`

**Key patterns:**
```typescript
// Detect edit mode from URL param
const isEditing = !!id
const entityId = id ? parseInt(id, 10) : null

// Start loading if editing (need to fetch existing data)
const [isLoading, setIsLoading] = useState(isEditing)

// Separate saving state for submit button
const [isSaving, setIsSaving] = useState(false)

// Validation errors keyed by field name
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

// Use React-Bootstrap Form.Control.Feedback for validation
<Form.Control isInvalid={!!validationErrors.name} />
<Form.Control.Feedback type="invalid">{validationErrors.name}</Form.Control.Feedback>
```

### 3. Show/Detail Page

**Reference implementation:**
- `src/pages/users/UserShowPage.tsx`

**Key patterns:**
```typescript
// Handle all states explicitly
if (!isAuth || isLoading) return <LoadingSpinner />
if (error) return <AlertMessage variant="danger" message={error} />
if (!entity) return <AlertMessage variant="warning" message="Not found" />

// Always include back navigation
<Button onClick={() => navigate('/entities')}>Back to List</Button>
```

---

## API Layer

### Base Client

**See:** `src/api/client.ts`

```typescript
import { api } from '../api/client'

const data = await api.get<Type>('/endpoint')
const created = await api.post<Type>('/endpoint', payload)
const updated = await api.put<Type>('/endpoint', payload)
await api.delete('/endpoint')
```

### Domain API Modules

**See:** `src/api/users.ts`, `src/api/entities.ts`, `src/api/auth.ts`

Create domain-specific modules that wrap the base client:
```typescript
// src/api/widgets.ts
import { API_ROUTES } from '../config'
import { api } from './client'
import type { WidgetResponse, CreateWidgetRequest } from '../types/api'

export async function listWidgets(): Promise<WidgetResponse[]> {
  return api.get<WidgetResponse[]>(API_ROUTES.WIDGETS)
}

export async function getWidget(id: number): Promise<WidgetResponse> {
  return api.get<WidgetResponse>(API_ROUTES.WIDGET(id))
}
```

### API Routes Config

**See:** `src/config/index.ts`

Add new routes following the pattern:
```typescript
export const API_ROUTES = {
  WIDGETS: '/api/widgets',
  WIDGET: (id: number) => `/api/widgets/${id}`,
} as const
```

---

## Error Handling

### Error Classes

**See:** `src/types/api.ts`

Use typed errors already defined:
- `AuthError` - Session expired, token invalid
- `ForbiddenError` - Permission denied (403)
- `ValidationError` - Form validation failed
- `LoginError` - Invalid credentials
- `ApiError` - Generic API errors with code

The API client (`src/api/client.ts`) automatically converts server error codes to these types.

### Component Error Handling

```typescript
const [error, setError] = useState<string | null>(null)

try {
  await apiCall()
} catch (err) {
  // Always extract message from Error
  const message = err instanceof Error ? err.message : 'Failed to perform action'
  setError(message)
}

// Display with AlertMessage component
{error && <AlertMessage variant="danger" message={error} />}
```

---

## Authentication & Authorization

### Auth Hook

**See:** `src/contexts/AuthContext.tsx`

```typescript
const { 
  user,                    // Current user or null
  isAuthenticated,         // Boolean
  login, logout,          // Auth actions
  hasRole, hasAnyRole,    // Role checking
  canManageUsers,         // Permission helpers
  canManageAllUsers 
} = useAuth()
```

### Protected Routes

```typescript
// Redirects to login if not authenticated
const isAuth = useRequireAuth()

// Use inside useEffect for conditional logic
useEffect(() => {
  if (!isAuth) return
  // fetch data...
}, [isAuth])
```

---

## Form Validation

### Pattern

**See:** `src/pages/users/UserFormPage.tsx` (validateForm function)

```typescript
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
```

### Clearing Validation on Input

```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  setFormData(prev => ({ ...prev, [name]: value }))
  
  // Clear validation error when user types
  if (validationErrors[name]) {
    setValidationErrors(prev => ({ ...prev, [name]: '' }))
  }
}
```

---

## Type Definitions

### API Types Location

**See:** `src/types/api.ts`

Add new types following existing patterns:
```typescript
// Response type (what API returns)
export interface WidgetResponse {
  id: number
  name: string
  created_at: string
}

// Create request (POST body)
export interface CreateWidgetRequest {
  name: string
}

// Update request (PUT body - all fields optional)
export interface UpdateWidgetRequest {
  name?: string
}
```

---

## Common Components

### Available in `src/components/common/`

| Component | Usage |
|-----------|-------|
| `LoadingSpinner` | Full-page loading state |
| `AlertMessage` | Error/success messages |
| `NotFound` | 404 page content |
| `Forbidden` | 403 access denied |

### Usage

```typescript
import { LoadingSpinner, AlertMessage } from '../components/common'

// Loading state
if (isLoading) return <LoadingSpinner />

// Error message
{error && <AlertMessage variant="danger" message={error} />}
```

---

## Adding New Routes

**See:** `src/router/index.tsx`

```typescript
<Route path="/widgets" element={<WidgetListPage />} />
<Route path="/widgets/new" element={<WidgetFormPage />} />
<Route path="/widgets/:id" element={<WidgetShowPage />} />
<Route path="/widgets/:id/edit" element={<WidgetFormPage />} />
```

**Export from pages index:** `src/pages/index.ts`
```typescript
export * from './widgets'
```

---

## Styling

### Using React-Bootstrap

This project uses React-Bootstrap v2 + Bootstrap 5.3. Reference:
- [React-Bootstrap docs](https://react-bootstrap.github.io/)

### Common Patterns

```typescript
// Card wrapper
<Card>
  <Card.Body>...</Card.Body>
</Card>

// Form layout with Row/Col
<Row>
  <Col md={6}>...</Col>
  <Col md={6}>...</Col>
</Row>

// Action buttons
<div className="d-flex gap-2">
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
</div>

// Table
<Table responsive hover>
  <thead>...</thead>
  <tbody>...</tbody>
</Table>
```

---

## Checklist for New Screens

- [ ] Create page component in appropriate `src/pages/` subdirectory
- [ ] Export from subdirectory `index.ts`
- [ ] Add API functions in `src/api/` following existing patterns
- [ ] Add types to `src/types/api.ts`
- [ ] Add routes to `src/router/index.tsx`
- [ ] Use `useRequireAuth()` for protected pages
- [ ] Use `LoadingSpinner` for loading states
- [ ] Use `AlertMessage` for errors
- [ ] Include back navigation on detail/form pages
- [ ] Add validation with clear error messages
- [ ] Use permission checks where applicable