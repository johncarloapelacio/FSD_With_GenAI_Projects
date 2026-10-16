const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const apiUrl = path => `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
export async function apiFetch(url, options = {}) {
  let expected = '';
  try { expected = JSON.parse(sessionStorage.getItem('user'))?.id || ''; } catch { sessionStorage.removeItem('user'); }
  const response = await fetch(url, { ...options, credentials: 'include', headers: { 'X-Requested-With': 'portfolio-app', ...(expected ? { 'X-Expected-Account': expected } : {}), ...options.headers } });
  const changed = response.status === 409 && (await response.clone().json().catch(() => ({}))).code === 'ACCOUNT_CHANGED';
  if (response.status === 401 || changed) {
    sessionStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    if (changed) window.dispatchEvent(new Event('account-changed'));
  }
  return response;
}
export function cacheUser(user) { sessionStorage.setItem('user', JSON.stringify(user)); window.dispatchEvent(new Event('auth-change')); }
export async function signOut() {
  const response = await apiFetch(apiUrl('/auth/logout'), { method: 'POST' });
  if (!response.ok && response.status !== 401) throw new Error('Could not sign out');
  sessionStorage.removeItem('user');
  for (const key of ['bookingData', 'completeBooking', 'pendingBookingDraft']) sessionStorage.removeItem(key);
  window.dispatchEvent(new Event('auth-change'));
}
