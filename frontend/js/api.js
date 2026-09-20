/**
 * Native Fetch API HTTP Client
 */
const API_BASE_URL = (window.location.origin && window.location.origin.startsWith('http'))
  ? `${window.location.origin}/api`
  : 'http://localhost:5001/api';

async function apiRequest(endpoint, method = 'GET', data = null, isFormData = false) {
  const token = localStorage.getItem('token');

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData && data) {
    headers['Content-Type'] = 'application/json';
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = isFormData ? data : JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = '../login.html';
      }
    }

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'API request failed');
    }
    return resData;
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// API Services
const API = {
  // Auth
  login: (data) => apiRequest('/auth/login', 'POST', data),
  register: (data) => apiRequest('/auth/register', 'POST', data),
  getMe: () => apiRequest('/auth/me', 'GET'),

  // Expenses
  getStats: () => apiRequest('/expenses/stats', 'GET'),
  getExpenses: (params = '') => apiRequest(`/expenses${params ? '?' + params : ''}`, 'GET'),
  getExpense: (id) => apiRequest(`/expenses/${id}`, 'GET'),
  createExpense: (data) => apiRequest('/expenses', 'POST', data),
  updateExpense: (id, data) => apiRequest(`/expenses/${id}`, 'PUT', data),
  deleteExpense: (id) => apiRequest(`/expenses/${id}`, 'DELETE'),
  submitExpense: (id) => apiRequest(`/expenses/${id}/submit`, 'POST'),

  // Receipts & OCR
  uploadReceipt: (formData) => apiRequest('/receipts/upload', 'POST', formData, true),
  processOCR: (id) => apiRequest(`/receipts/${id}/scan`, 'POST'),

  // Policies & Budgets
  getPolicies: () => apiRequest('/policies', 'GET'),
  getBudgets: () => apiRequest('/budgets/usage', 'GET'),

  // Reports
  getReports: () => apiRequest('/reports', 'GET'),
  createReport: (data) => apiRequest('/reports', 'POST', data),
  submitReport: (id) => apiRequest(`/reports/${id}/submit`, 'POST'),

  // Approvals
  getApprovals: (params = '') => apiRequest(`/approvals${params ? '?' + params : ''}`, 'GET'),
  approveClaim: (id, comment) => apiRequest(`/approvals/${id}/approve`, 'POST', { comment }),
  rejectClaim: (id, comment) => apiRequest(`/approvals/${id}/reject`, 'POST', { comment }),

  // Admin
  getUsers: () => apiRequest('/users', 'GET'),
  updateUserRole: (id, role) => apiRequest(`/users/${id}/role`, 'PUT', { role }),
};
