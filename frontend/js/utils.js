/**
 * Utility Helpers & UI State Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  updateSidebarUserProfile();
});

// Format Currency
function formatCurrency(amount, currency = 'INR') {
  const symbolMap = { INR: '₹', USD: '$', EUR: '€', GBP: '£', CAD: '$', JPY: '¥' };
  const symbol = symbolMap[currency] || '₹';
  return `${symbol}${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format Date
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Toast Notifications
function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast-container');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast-container alert alert-${type === 'error' ? 'danger' : type}`;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
  toast.style.minWidth = '280px';
  toast.innerText = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Sync Sidebar Profile Name & Initials
function updateSidebarUserProfile() {
  const userStr = localStorage.getItem('user');
  const profileContainer = document.querySelector('.user-profile');
  if (!profileContainer) return;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const name = user.name || (user.firstName ? `${user.firstName} ${user.lastName}` : user.email?.split('@')[0]) || 'User';
      const role = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Employee';
      const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

      const avatar = profileContainer.querySelector('.user-avatar');
      const nameEl = profileContainer.querySelector('p:nth-child(1)');
      const roleEl = profileContainer.querySelector('p:nth-child(2)');

      if (avatar) avatar.innerText = initials;
      if (nameEl) nameEl.innerText = name;
      if (roleEl) roleEl.innerText = role;
    } catch (e) {
      console.error('Error parsing stored user profile:', e);
    }
  }
}

// Render Loading State
function renderLoadingState(container, text = 'Loading data...') {
  if (!container) return;
  container.innerHTML = `
    <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
      <div style="font-size: 2rem; margin-bottom: 0.5rem; animation: spin 1s linear infinite;">⏳</div>
      <p style="font-size: 0.875rem;">${text}</p>
    </div>
  `;
}

// Render Empty State
function renderEmptyState(container, text = 'No records found.') {
  if (!container) return;
  container.innerHTML = `
    <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📁</div>
      <p style="font-size: 0.95rem; font-weight: 500;">${text}</p>
    </div>
  `;
}

// Render Error State
function renderErrorState(container, text = 'Failed to load data. Please try again.') {
  if (!container) return;
  container.innerHTML = `
    <div style="text-align: center; padding: 3rem 1rem; color: var(--danger);">
      <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">⚠️</div>
      <p style="font-size: 0.95rem; font-weight: 500;">${text}</p>
    </div>
  `;
}
