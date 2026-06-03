// Shared top navigation bar.
// Shows different links depending on whether a user is logged in (via AuthContext).

import { Navbar, Nav, Container, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function NavBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Clear the JWT + user, then send the visitor back to the login page.
  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        {/* Brand always links to Home */}
        <Navbar.Brand as={Link} to="/">StockGrader</Navbar.Brand>

        <Navbar.Toggle aria-controls="main-nav" />

        <Navbar.Collapse id="main-nav">
          {user ? (
            <>
              {/* Logged in: main pages on the left */}
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                <Nav.Link as={Link} to="/watchlist">Watchlist</Nav.Link>
                <Nav.Link as={Link} to="/compare">Compare</Nav.Link>
              </Nav>

              {/* Logged in: greeting + theme toggle + logout on the right */}
              <Nav className="align-items-center">
                <Form.Check
                  type="switch"
                  id="theme-toggle"
                  label="Dark"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  className="text-light me-3"
                />
                <Navbar.Text className="me-3">
                  Welcome, {user.displayName || user.email}
                </Navbar.Text>
                <Nav.Link
                  onClick={handleLogout}
                  role="button"
                  style={{ cursor: 'pointer' }}
                >
                  Log out
                </Nav.Link>
              </Nav>
            </>
          ) : (
            /* Logged out: theme toggle + auth links on the right */
            <Nav className="ms-auto align-items-center">
              <Form.Check
                type="switch"
                id="theme-toggle"
                label="Dark"
                checked={theme === 'dark'}
                onChange={toggleTheme}
                className="text-light me-3"
              />
              <Nav.Link as={Link} to="/login">Log in</Nav.Link>
              <Nav.Link as={Link} to="/signup">Sign up</Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
