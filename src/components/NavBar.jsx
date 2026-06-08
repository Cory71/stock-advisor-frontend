// Shared top navigation bar.
// Shows different links depending on whether a user is logged in (via AuthContext).

import { Navbar, Nav, Container, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './NavBar.css';

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
            // Responsive ordering: on desktop the bar reads
            //   [Home Watchlist Compare] ........ [Welcome  Dark  Log out]
            // On mobile (collapsed column) the order-lg-* classes drop away, so
            // it stacks in DOM order: greeting header, page links, divider,
            // then settings + sign out (see NavBar.css).
            <>
              {/* Greeting — a small header on top for mobile; sits on the right on desktop */}
              <Navbar.Text className="nav-greeting order-lg-2">
                Welcome, {user.displayName || user.email}
              </Navbar.Text>

              {/* Main pages */}
              <Nav className="nav-links me-lg-auto order-lg-first">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                <Nav.Link as={Link} to="/watchlist">Watchlist</Nav.Link>
                <Nav.Link as={Link} to="/compare">Compare</Nav.Link>
              </Nav>

              {/* Settings + sign out */}
              <Nav className="nav-controls order-lg-3 align-items-lg-center">
                <Form.Check
                  type="switch"
                  id="theme-toggle"
                  label="Dark"
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                  className="text-light me-3"
                />
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
            /* Logged out: theme toggle + auth links. Right + centered on
               desktop; left-aligned on mobile. */
            <Nav className="ms-auto align-items-lg-center">
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
