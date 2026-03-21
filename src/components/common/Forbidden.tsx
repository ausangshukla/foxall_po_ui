import { Container, Alert, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

export function Forbidden() {
  return (
    <Container className="py-5 text-center">
      <Alert variant="danger">
        <Alert.Heading>Access Denied</Alert.Heading>
        <p>
          You don&apos;t have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
      </Alert>
      <Button as={Link} to="/" variant="primary">
        Go Home
      </Button>
    </Container>
  )
}
