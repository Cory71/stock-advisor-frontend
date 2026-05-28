// Shared top navigation bar.
// Login/Sign-up links on the right are placeholders until AuthContext is wired up.

import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NavBar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        {/* App logo / home link */}
        <Navbar.Brand as={Link} to="/">StockGrader</Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />

        <Navbar.Collapse id="main-nav">
          {/* Left side — main app pages */}
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/watchlist">Watchlist</Nav.Link>
            <Nav.Link as={Link} to="/compare">Compare</Nav.Link>
          </Nav>

          {/* Right side — auth links (placeholder until AuthContext is wired up) */}
          <Nav>
            <Nav.Link as={Link} to="/login">Log in</Nav.Link>
            <Nav.Link as={Link} to="/signup">Sign up</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
