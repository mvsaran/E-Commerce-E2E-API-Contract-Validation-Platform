/**
 * Shared API Client — api.js
 * 
 * Centralised HTTP client used by every page.
 * Automatically injects the stored auth token into every request.
 * All errors are surfaced as thrown Error objects.
 */

const API_BASE = '';   // Same-origin: backend serves frontend on the same port

/**
 * Core fetch wrapper.
 * @param {string} method   HTTP verb
 * @param {string} url      Endpoint path (e.g. '/api/products')
 * @param {object} [body]   Optional request body (will be JSON-serialised)
 * @returns {Promise<any>}  Parsed JSON response
 */
async function fetchJSON(method, url, body = null) {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
  };

  // Inject auth token when available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${url}`, options);

  // Handle 401 — clear token and redirect to login (unless trying to login)
  if (response.status === 401 && !url.includes('/api/auth/login')) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
    return;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || data?.message || `HTTP Error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

// ── Convenience wrappers ──────────────────────────────────────────

const api = {
  get:    (url)         => fetchJSON('GET',    url),
  post:   (url, body)   => fetchJSON('POST',   url, body),
  put:    (url, body)   => fetchJSON('PUT',    url, body),
  delete: (url)         => fetchJSON('DELETE', url),
};

// ── Auth helpers ──────────────────────────────────────────────────

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
}

function isAuthenticated() {
  return !!localStorage.getItem('authToken');
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// ── Toast notifications ───────────────────────────────────────────

function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || icons.info}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Cart count badge helper ───────────────────────────────────────

async function updateCartBadge() {
  if (!isAuthenticated()) return;
  try {
    const data = await api.get('/api/cart');
    const count = (data.items || []).reduce((sum, i) => sum + i.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  } catch { /* silent */ }
}
