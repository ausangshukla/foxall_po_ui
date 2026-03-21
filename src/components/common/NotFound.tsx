import { Container, Alert, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <Container className="py-5 text-center">
      <Alert variant="warning">
        <Alert.Heading>Page Not Found</Alert.Heading>
        <p>
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
      </Alert>
      <Button as={Link} to="/" variant="primary">
        Go Home
      </Button>
    </Container>
  )
}
