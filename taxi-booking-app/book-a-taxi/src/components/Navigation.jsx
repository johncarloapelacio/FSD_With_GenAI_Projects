import { apiFetch, apiUrl, signOut } from '../api';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const syncUserFromStorage = () => {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing user data:', error);
          sessionStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    const controller = new AbortController();
    syncUserFromStorage();
    apiFetch(apiUrl('/auth/session'), { signal: controller.signal }).then(async response => {
      if (response.ok) { const data = await response.json(); sessionStorage.setItem('user', JSON.stringify(data.user)); syncUserFromStorage(); }
    }).catch(() => {});

    const handleStorageChange = () => syncUserFromStorage();

    const accountChanged = () => { syncUserFromStorage(); navigate('/login', { replace: true }); };
    window.addEventListener('account-changed', accountChanged);
    window.addEventListener('auth-change', handleStorageChange);
    return () => { controller.abort(); window.removeEventListener('auth-change', handleStorageChange); window.removeEventListener('account-changed', accountChanged); };
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    try { await signOut(); } catch { window.alert('Could not sign out. Please try again.'); return; }
    setUser(null);
    setMenuOpen(false);
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/home" className="navbar-brand" onClick={closeMenu}>
          <span className="taxi-icon">🚕</span>
          <span className="brand-text">Book a Taxi</span>
        </Link>

        <div className={`nav-menu ${menuOpen ? 'nav-menu-open' : ''}`}>
          <ul className="nav-list">
            <li className="nav-item">
              <Link to="/home" className="nav-link" onClick={closeMenu}>Home</Link>
            </li>
            <li className="nav-item">
              <Link to="/services" className="nav-link" onClick={closeMenu}>Services</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link" onClick={closeMenu}>About</Link>
            </li>
            <li className="nav-item">
              <Link to="/contact" className="nav-link" onClick={closeMenu}>Contact</Link>
            </li>
            {user && (
              <li className="nav-item">
                <Link to="/account" className="nav-link" onClick={closeMenu}>Account</Link>
              </li>
            )}
          </ul>

          {user ? (
            <div className="nav-auth nav-auth-user">
              <div className="user-welcome">
                <span className="user-greeting">Welcome, {user.firstName || 'User'}!</span>
                <span className="user-email">{user.email}</span>
              </div>
              <button onClick={handleLogout} className="auth-button logout-button" type="button">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="auth-button" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/signup" className="auth-button nav-signup" onClick={closeMenu}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        <button type="button" className="hamburger" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={toggleMenu}>
          <span className={`bar ${menuOpen ? 'bar-open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'bar-open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'bar-open' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
}

export default Navigation;
