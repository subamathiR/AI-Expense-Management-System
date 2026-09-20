/**
 * Policy Module — Policy compliance checks and rule interpretations
 */
document.addEventListener('DOMContentLoaded', async () => {
  const policyListContainer = document.getElementById('policies-list');

  if (policyListContainer) {
    try {
      const res = await API.getPolicies();
      const policies = res.data || [];

      if (policies.length === 0) {
        policyListContainer.innerHTML = `<p class="text-muted">No policies configured.</p>`;
        return;
      }

      policyListContainer.innerHTML = policies.map(p => `
        <div class="card" style="margin-bottom: 1rem;">
          <div class="card-header">
            <h4>${formatText(p.name)}</h4>
            <span class="badge ${p.active ? 'badge-approved' : 'badge-draft'}">${p.active ? 'Active' : 'Disabled'}</span>
          </div>
          <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">Category: <strong>${p.category}</strong></p>
          <p style="font-size: 0.875rem; color: var(--text-muted);">${p.description || 'Limit: ' + formatCurrency(p.limit)}</p>
        </div>
      `).join('');
    } catch (err) {
      policyListContainer.innerHTML = `<p style="color: var(--danger);">Failed to load company policies.</p>`;
    }
  }
});
