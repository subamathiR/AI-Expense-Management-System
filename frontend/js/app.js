/* ===================================================================
   EXPENSEAI — CORE APPLICATION SHELL SCRIPT
   Builds Sidebar, Top Header, Profile Controls, Notifications, and Navigation
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAppShell();
});

function initAppShell() {
  const user = api.getUser();
  const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';

  // If not on login, register, or landing page, require authentication
  const publicPages = ['login.html', 'register.html', 'index.html', 'home.html', ''];
  if (!user && !publicPages.includes(currentPath)) {
    window.location.href = 'login.html';
    return;
  }

  // If container elements exist, render shell
  renderSidebar(user, currentPath);
  renderHeader(user, currentPath);
  loadNotificationCount();

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderSidebar(user, currentPath) {
  const sidebarEl = document.getElementById('app-sidebar');
  if (!sidebarEl) return;

  const role = user ? user.role : 'employee';

  const navItems = [
    { name: 'Home', icon: 'home', href: 'index.html' },
    { name: 'Dashboard', icon: 'layout-dashboard', href: 'dashboard.html' },
    { name: 'My Expenses', icon: 'receipt', href: 'expenses.html' },
    { name: 'Add Expense', icon: 'plus-circle', href: 'add-expense.html' },
    { name: 'Receipt Scanner', icon: 'scan-text', href: 'receipts.html', badge: 'AI OCR' },
    { name: 'Budgets', icon: 'pie-chart', href: 'budgets.html' },
    { name: 'Reports', icon: 'file-text', href: 'reports.html' },
    { name: 'Mileage', icon: 'map-pin', href: 'mileage.html' },
    { name: 'Approvals', icon: 'check-square', href: 'approvals.html', roles: ['manager', 'finance', 'admin'], badge: 'Review' },
    { name: 'AI Assistant', icon: 'bot', href: 'assistant.html', badge: 'Smart' },
    { name: 'Integrations', icon: 'blocks', href: 'integrations.html' },
    { name: 'Policy & Settings', icon: 'settings', href: 'settings.html' },
  ];

  // Filter items by role permissions
  const filteredNav = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });

  const navHtml = filteredNav
    .map((item) => {
      const isActive = currentPath === item.href;
      return `
        <li class="nav-item">
          <a href="${item.href}" class="nav-link ${isActive ? 'active' : ''}">
            <i data-lucide="${item.icon}"></i>
            <span>${item.name}</span>
            ${item.badge ? `<span class="nav-pill">${item.badge}</span>` : ''}
          </a>
        </li>
      `;
    })
    .join('');

  sidebarEl.innerHTML = `
    <div class="sidebar-header">
      <a href="dashboard.html" class="brand-logo-wrap">
        <div class="brand-logo-icon">
          <i data-lucide="sparkles"></i>
        </div>
        <div class="brand-logo-text">Expense<span>AI</span></div>
      </a>
      <button class="btn-icon mobile-only" onclick="toggleMobileSidebar()" style="display: none;">
        <i data-lucide="x"></i>
      </button>
    </div>

    <div class="sidebar-nav-wrap">
      <div class="nav-section-title">Navigation</div>
      <ul class="sidebar-nav-list">
        ${navHtml}
      </ul>
    </div>

    <div class="sidebar-footer">
      <div class="user-profile-badge">
        <div class="user-avatar">${user ? user.name.charAt(0) : 'U'}</div>
        <div class="user-meta-info" style="flex: 1;">
          <div class="user-name">${user ? user.name : 'Demo User'}</div>
          <div class="user-role-label">${user ? user.role : 'Employee'}</div>
        </div>
        <button onclick="handleLogout()" title="Sign Out" class="btn-icon" style="width: 32px; height: 32px; border: none; background: transparent;">
          <i data-lucide="log-out" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
        </button>
      </div>
    </div>
  `;
}

function renderHeader(user, currentPath) {
  const headerEl = document.getElementById('app-header');
  if (!headerEl) return;

  const pageTitles = {
    'index.html': 'Home',
    'home.html': 'Home',
    'dashboard.html': 'Dashboard Overview',
    'expenses.html': 'Expense Records',
    'add-expense.html': 'Record New Expense',
    'receipts.html': 'Receipt Scanner & AI OCR',
    'budgets.html': 'Budget Management & Tracking',
    'reports.html': 'Expense Reports & Exports',
    'approvals.html': 'Approval & Reimbursement Queue',
    'mileage.html': 'Business Mileage Tracking',
    'assistant.html': 'AI Financial Assistant',
    'integrations.html': 'Accounting & AI Integrations',
    'settings.html': 'Policy Configuration & Settings',
  };

  const title = pageTitles[currentPath] || 'ExpenseAI';

  headerEl.innerHTML = `
    <div class="header-left">
      <button class="btn-icon mobile-menu-btn" onclick="toggleMobileSidebar()" style="display: none;">
        <i data-lucide="menu"></i>
      </button>
      <div>
        <h1 class="header-page-title">${title}</h1>
        <div class="header-breadcrumbs">
          <a href="index.html" style="color: inherit; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="home" style="width: 12px; height: 12px;"></i>
            <span>Home</span>
          </a>
          <i data-lucide="chevron-right" style="width: 12px; height: 12px;"></i>
          <span>${title}</span>
        </div>
      </div>
    </div>

    <div class="header-right">
      <div class="search-input-wrapper">
        <i data-lucide="search" class="search-icon" style="width: 16px; height: 16px;"></i>
        <input type="text" class="form-control" placeholder="Search merchant, ID, tag..." id="global-search-input">
      </div>

      <div style="position: relative;">
        <button class="btn-icon" onclick="toggleNotificationDropdown()" id="notif-btn" title="Notifications">
          <i data-lucide="bell"></i>
          <span id="notif-unread-badge" style="display: none; position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: #EF4444; border-radius: 50%;"></span>
        </button>
        <div id="notif-dropdown" class="card" style="display: none; position: absolute; right: 0; top: 48px; width: 340px; z-index: 1000; box-shadow: var(--shadow-xl);">
          <div class="card-header" style="padding: 12px 16px;">
            <div style="font-weight: 700; font-size: 13px;">Notifications</div>
            <a href="#" onclick="markAllNotificationsRead(event)" style="font-size: 11px; color: var(--brand-primary);">Mark read</a>
          </div>
          <div id="notif-list" style="max-height: 280px; overflow-y: auto; padding: 8px;">
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">No new alerts.</div>
          </div>
        </div>
      </div>

      <a href="add-expense.html" class="btn btn-primary btn-sm">
        <i data-lucide="plus"></i>
        <span>Add Expense</span>
      </a>

      <!-- Quick Role Pill -->
      <span class="accent-pill" style="font-size: 11px; text-transform: uppercase;">
        ${user ? user.role : 'Employee'}
      </span>
    </div>
  `;
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) sidebar.classList.toggle('mobile-open');
}

function handleLogout() {
  api.clearAuth();
  showToast('Signed out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 400);
}

async function loadNotificationCount() {
  try {
    const data = await api.get('/notifications');
    if (data && data.unreadCount > 0) {
      const badge = document.getElementById('notif-unread-badge');
      if (badge) badge.style.display = 'block';

      const notifList = document.getElementById('notif-list');
      if (notifList && data.data.length > 0) {
        notifList.innerHTML = data.data.slice(0, 5).map(n => `
          <div style="padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); font-size: 12px;">
            <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${n.title}</div>
            <div style="color: var(--text-secondary); line-height: 1.4;">${n.message}</div>
          </div>
        `).join('');
      }
    }
  } catch (err) {
    // Non-blocking
  }
}

function toggleNotificationDropdown() {
  const dd = document.getElementById('notif-dropdown');
  if (dd) {
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  }
}

async function markAllNotificationsRead(e) {
  e.preventDefault();
  try {
    await api.put('/notifications/read-all');
    const badge = document.getElementById('notif-unread-badge');
    if (badge) badge.style.display = 'none';
    const notifList = document.getElementById('notif-list');
    if (notifList) notifList.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 12px;">All notifications marked as read.</div>';
  } catch (err) {
    // Non-blocking
  }
}
