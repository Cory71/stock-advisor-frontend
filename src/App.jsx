// Top-level App component.
// Sets up the BrowserRouter, shared NavBar, and routes for all 6 pages.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import GradeDetail from './pages/GradeDetail';
import Watchlist from './pages/Watchlist';
import Compare from './pages/Compare';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

// Pulled at build time from .env (VITE_GOOGLE_CLIENT_ID). If it's missing,
// the Google button on Login/Signup just won't render — email/password still works.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function App() {
  return (
    <BrowserRouter>
      {/* GoogleOAuthProvider exposes the Google Identity Services SDK to the whole tree.
          Outermost so any page can render a <GoogleLogin /> button. */}
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {/* ThemeProvider wraps everything so any component (NavBar, pages) can use the theme. */}
        <ThemeProvider>
          {/* AuthProvider lives inside the Router so pages can both consume auth and navigate. */}
          <AuthProvider>
            {/* NavBar lives outside <Routes> so it shows on every page */}
            <NavBar />

            {/* Main page content. Bootstrap's "container" + padding keeps it tidy. */}
            <main className="container py-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/grade/:ticker" element={<GradeDetail />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/compare" element={<Compare />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Routes>
            </main>

            <Footer />
          </AuthProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </BrowserRouter>
  );
}

export default App;
