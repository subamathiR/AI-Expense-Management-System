/**
 * Notifications Module — In-App Notifications
 */
document.addEventListener('DOMContentLoaded', () => {
  const markAllReadBtn = document.getElementById('mark-all-read-btn');
  const notificationsList = document.getElementById('notifications-list');

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      if (notificationsList) {
        const badges = notificationsList.querySelectorAll('.alert');
        badges.forEach(badge => {
          badge.style.opacity = '0.6';
        });
      }
      showToast('All notifications marked as read', 'info');
    });
  }
});
