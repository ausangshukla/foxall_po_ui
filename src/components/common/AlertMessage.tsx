import { Alert } from 'react-bootstrap'

interface AlertMessageProps {
  variant?: 'success' | 'danger' | 'warning' | 'info'
  message: string
  onClose?: () => void
}

export function AlertMessage({
  variant = 'info',
  message,
  onClose,
}: AlertMessageProps) {
  return (
    <Alert variant={variant} onClose={onClose} dismissible={!!onClose}>
      {message}
    </Alert>
  )
}
