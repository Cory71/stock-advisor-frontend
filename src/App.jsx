// Top-level App component.
// Sets up the BrowserRouter, shared NavBar, and routes for all 6 pages.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import GradeDetail from './pages/GradeDetail';
import Watchlist from './pages/Watchlist';
import Compare from './pages/Compare';
import Login from './pages/Login';
import Signup from './pages/Signup';
import './App.css';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
