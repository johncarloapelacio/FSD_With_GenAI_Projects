import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiFetch, apiUrl, cacheUser } from '../api';
function ProtectedRoute({ children }) {
  const location = useLocation();
  const [status, setStatus] = useState('checking');
  useEffect(() => {
    let active = true;
    const changed = () => { if (!sessionStorage.getItem("user")) setStatus("signed-out"); };
    window.addEventListener("auth-change", changed);
    apiFetch(apiUrl('/auth/session')).then(async response => {
      if (!active) return;
      if (!response.ok) { setStatus(response.status === 401 ? 'signed-out' : 'error'); return; }
      const data = await response.json();
      if (active) { cacheUser(data.user); setStatus('ready'); }
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; window.removeEventListener("auth-change", changed); };
  }, [location.pathname]);
  if (status === 'checking') return <p role="status">Checking session...</p>;
  if (status === 'error') return <p role="alert">Could not verify your session. Please refresh to try again.</p>;
  if (status === 'signed-out') return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}
export default ProtectedRoute;
