'use strict';
document.addEventListener('DOMContentLoaded', () => {
  // Remove obsolete demo credentials; authentication now comes from an HttpOnly cookie.
  try { for (const key of ['accounts', 'activeAccount', 'dashKey']) localStorage.removeItem(key); } catch { /* storage may be disabled */ }
  const registerForm = document.getElementById('registerForm');
  const signinForm = document.getElementById('signinForm');
  const form = registerForm || signinForm;
  const message = document.createElement('p');
  message.setAttribute('role', 'status');
  message.setAttribute('aria-live', 'polite');
  message.className = 'auth-message';
  form.appendChild(message);
  form.addEventListener('reset', () => { message.textContent = ''; });
  document.getElementById('loginPageBtn')?.addEventListener('click', () => { window.location.href = 'signin.html'; });
  document.getElementById('registerBtn')?.addEventListener('click', () => { window.location.href = 'register.html'; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const emailInput = document.getElementById(registerForm ? 'newEmailId' : 'emailId');
    const passwordInput = document.getElementById(registerForm ? 'newPasswordId' : 'pwId');
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { message.textContent = 'Enter a valid email address.'; emailInput.focus(); return; }
    if (password.length < 8 || password.length > 128) { message.textContent = 'Use a password between 8 and 128 characters.'; passwordInput.focus(); return; }
    const submit = form.querySelector('[type=submit]');
    submit.disabled = true;
    message.textContent = registerForm ? 'Creating account…' : 'Signing in…';
    try {
      await window.foodApi(registerForm ? '/api/register' : '/api/login', { method: 'POST', body: { email, password } });
      if (registerForm) {
        form.reset(); message.textContent = 'Account created. Continue to Sign in.';
        document.getElementById('loginPageBtn').focus();
      } else { window.location.href = 'dashboard.html'; }
    } catch (error) { message.textContent = error.message; }
    finally { submit.disabled = false; }
  });
});
