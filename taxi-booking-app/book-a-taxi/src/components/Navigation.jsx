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
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    syncUserFromStorage();

    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = () => syncUserFromStorage();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
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

        <div className="hamburger" onClick={toggleMenu}>
          <span className={`bar ${menuOpen ? 'bar-open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'bar-open' : ''}`}></span>
          <span className={`bar ${menuOpen ? 'bar-open' : ''}`}></span>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
