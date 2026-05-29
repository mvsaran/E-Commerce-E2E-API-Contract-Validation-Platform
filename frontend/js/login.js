/**
 * login.js
 * 
 * Handles the login form submission:
 *   1. Validates inputs locally
 *   2. POSTs credentials to POST /api/auth/login
 *   3. Stores the returned JWT token and user object in localStorage
 *   4. Redirects to products page on success
 *   5. Shows error message on failure
 * 
 * Integration point: POST /api/auth/login is captured by Playwright
 * and validated by Postman Application Test.
 */

// Redirect already-authenticated users to products
if (isAuthenticated()) {
  window.location.replace('/products.html');
}

const form       = document.getElementById('login-form');
const loginBtn   = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const errorText  = document.getElementById('error-text');
const emailErr   = document.getElementById('email-error');
const passErr    = document.getElementById('password-error');

/**
 * Shows the global error banner with a given message.
 * @param {string} message
 */
function showError(message) {
  errorText.textContent = message;
  loginError.classList.remove('hidden');
  loginError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
  loginError.classList.add('hidden');
}

/**
 * Client-side form validation before API call.
 * @returns {boolean} true if valid
 */
function validateForm(email, password) {
  let valid = true;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailErr.classList.remove('hidden');
    valid = false;
  } else {
    emailErr.classList.add('hidden');
  }

  if (!password || password.length < 4) {
    passErr.classList.remove('hidden');
    valid = false;
  } else {
    passErr.classList.add('hidden');
  }

  return valid;
}

/**
 * Main login handler — triggered on form submit.
 * Captures: POST /api/auth/login
 */
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideError();

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!validateForm(email, password)) return;

  // Set button loading state
  loginBtn.classList.add('loading');
  loginBtn.textContent = 'Signing in…';
  loginBtn.disabled = true;

  try {
    // ── API call: POST /api/auth/login ────────────────────────────
    const response = await api.post('/api/auth/login', { email, password });

    // Store auth token and user profile
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Brief success feedback before redirect
    showToast('Login successful! Redirecting…', 'success');
    setTimeout(() => {
      window.location.href = '/products.html';
    }, 500);

  } catch (err) {
    showError(err.message || 'Login failed. Please check your credentials.');
  } finally {
    loginBtn.classList.remove('loading');
    loginBtn.textContent = 'Sign In';
    loginBtn.disabled = false;
  }
});

// Clear errors when user starts typing
document.getElementById('email').addEventListener('input', () => {
  emailErr.classList.add('hidden');
  hideError();
});

document.getElementById('password').addEventListener('input', () => {
  passErr.classList.add('hidden');
  hideError();
});
