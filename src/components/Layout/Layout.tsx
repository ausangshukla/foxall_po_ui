import { Container } from 'react-bootstrap'
import { AppNavbar } from './Navbar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-vh-100 bg-light">
      <AppNavbar />
      <Container fluid>{children}</Container>
    </div>
  )
}
