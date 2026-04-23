import { Navigate, useLocation } from 'react-router-dom';

// Guard component that blocks access when no authenticated user is stored.
function ProtectedRoute({ children }) {
  const location = useLocation();
  let user = null;

  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
    }
  }

  if (!user) {
    // Preserve source route so the app can return after authentication.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
