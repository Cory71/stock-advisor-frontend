// Shared top navigation bar.
// Shows different links depending on whether a user is logged in (via AuthContext).
//
// Signed in, everything personal sits in one menu under the user's name:
// dark mode, account settings and log out. Logged out there's no account menu,
// so the dark-mode toggle stays inline in the bar.

import { Navbar, Nav, NavDropdown, Container, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './NavBar.css';

// The dark-mode switch, used both in the account menu and in the logged-out bar.
function ThemeSwitch({ id, className }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <Form.Check
      type="switch"
      id={id}
      label="Dark mode"
      checked={theme === 'dark'}
      onChange={toggleTheme}
      className={className}
    />
  );
}

function NavBar() {
  const { user, logout } = useAuth();
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
              {/* Main pages, on the left */}
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/">Home</Nav.Link>
                <Nav.Link as={Link} to="/watchlist">Watchlist</Nav.Link>
                <Nav.Link as={Link} to="/compare">Compare</Nav.Link>
              </Nav>

              {/* Account menu, on the right. On phones it opens in place inside
                  the collapsed menu, under a divider (see NavBar.css). */}
              <Nav className="nav-account">
                <NavDropdown
                  title={user.displayName || user.email}
                  id="account-menu"
                  align="end"
                >
                  {/* A switch rather than a link, so it sits in the menu as plain
                      content and flipping it doesn't close the menu. */}
                  <div className="px-3 py-1">
                    <ThemeSwitch id="theme-toggle-menu" />
                  </div>
                  <NavDropdown.Divider />
                  <NavDropdown.Item as={Link} to="/account">Account settings</NavDropdown.Item>
                  <NavDropdown.Item as="button" onClick={handleLogout}>Log out</NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            /* Logged out: theme toggle + auth links. Right + centered on
               desktop; left-aligned on mobile. */
            <Nav className="ms-auto align-items-lg-center">
              <ThemeSwitch id="theme-toggle" className="text-light me-3" />
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
