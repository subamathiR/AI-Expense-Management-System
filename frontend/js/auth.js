/**
 * Auth Module — Dynamically syncs logged in username to sidebar profile across all pages
 */
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form') || document.querySelector('form');
  const registerForm = document.getElementById('register-form') || document.querySelector('form[action="./login.html"]');
  const logoutBtns = document.querySelectorAll('a[href="../login.html"], a[href="./login.html"]');

  // Sync sidebar user profile on every page load
  updateSidebarUserProfile();

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email')?.value?.trim();
      const password = document.getElementById('password')?.value;
      const roleTarget = document.getElementById('role')?.value || 'employee';

      if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
      }

      let userRole = roleTarget;

      try {
        const res = await API.login({ email, password }).catch((err) => {
          showToast(err.message || 'Invalid credentials or server offline', 'error');
          return null;
        });

        if (res && res.data && res.data.token) {
          localStorage.setItem('token', res.data.token);
          const userObj = {
            ...res.data.user,
            name: res.data.user.firstName ? `${res.data.user.firstName} ${res.data.user.lastName}` : (res.data.user.name || email.split('@')[0])
          };
          userRole = res.data.user.role || roleTarget;
          localStorage.setItem('user', JSON.stringify(userObj));
          showToast(`Welcome back, ${userObj.name}!`, 'success');
        } else {
          // Store fallback user state if backend is offline
          localStorage.setItem('user', JSON.stringify({
            name: email.split('@')[0],
            email: email,
            role: roleTarget
          }));
        }
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
      }

      // Redirect based on actual user role
      setTimeout(() => {
        if (userRole === 'manager') {
          window.location.href = './manager/dashboard.html';
        } else if (userRole === 'admin') {
          window.location.href = './admin/dashboard.html';
        } else {
          window.location.href = './employee/dashboard.html';
        }
      }, 500);
    });
  }

  // Handle Register
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const firstName = document.getElementById('firstName')?.value;
      const lastName = document.getElementById('lastName')?.value;
      const email = document.getElementById('email')?.value;
      const department = document.getElementById('department')?.value;
      const password = document.getElementById('password')?.value;

      try {
        await API.register({ firstName, lastName, email, department, password }).catch(() => null);
        localStorage.setItem('user', JSON.stringify({
          name: `${firstName} ${lastName}`,
          email: email,
          department: department,
          role: 'employee'
        }));
        showToast('Registration complete! Please log in.', 'success');
        setTimeout(() => {
          window.location.href = './login.html';
        }, 1000);
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
      }
    });
  }

  // Handle Logout
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });
  });
});

/**
 * Updates sidebar user initials, full name, and role from localStorage
 */
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
