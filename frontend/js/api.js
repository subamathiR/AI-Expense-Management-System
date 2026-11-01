/* ===================================================================
   EXPENSEAI — CENTRAL API CLIENT & UTILITIES
   Handles JWT tokens, base URL, error catching, and Toast alerts
   =================================================================== */

const API_BASE_URL = (() => {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // If opened via file://, VS Code Live Server (port 5500), Vite, or another dev port, point to backend on 5000
    if (!origin || origin === 'null' || origin.startsWith('file:') || (window.location.port && window.location.port !== '5000')) {
      return 'http://localhost:5000/api';
    }
  }
  return '/api';
})();


const api = {
  getToken() {
    return localStorage.getItem('expenseai_token');
  },

  setToken(token) {
    localStorage.setItem('expenseai_token', token);
  },

  getUser() {
    try {
      return JSON.parse(localStorage.getItem('expenseai_user') || 'null');
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    localStorage.setItem('expenseai_user', JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem('expenseai_token');
    localStorage.removeItem('expenseai_user');
  },

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const config = {
      method: options.method || 'GET',
      headers,
      ...(options.body ? { body: options.isFormData ? options.body : JSON.stringify(options.body) } : {}),
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        this.clearAuth();
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html') && !window.location.pathname.includes('home.html') && !window.location.pathname.includes('register.html')) {
          window.location.href = 'login.html?session=expired';
        }
        throw new Error('Session expired. Please sign in again.');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed.');
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err.message);
      throw err;
    }
  },

  get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
  post(endpoint, body, isFormData = false) { return this.request(endpoint, { method: 'POST', body, isFormData }); },
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },
};

/* --- TOAST NOTIFICATION SYSTEM --- */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';

  const icons = {
    success: '<i data-lucide="check-circle" style="color: #10B981;"></i>',
    error: '<i data-lucide="alert-circle" style="color: #EF4444;"></i>',
    warning: '<i data-lucide="alert-triangle" style="color: #F59E0B;"></i>',
    info: '<i data-lucide="info" style="color: var(--brand-primary);"></i>',
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div style="flex: 1; font-weight: 500;">${message}</div>
    <button style="background: none; border: none; cursor: pointer; color: var(--text-muted);" onclick="this.parentElement.remove()">
      <i data-lucide="x" style="width: 14px; height: 14px;"></i>
    </button>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Global Currency Formatter
function formatMoney(amount, currency = 'USD') {
  const val = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(val);
}

// Global Date Formatter
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

