/* ===================================================================
   EXPENSEAI — THIRD-PARTY INTEGRATIONS CONTROLLER SCRIPT
   =================================================================== */

let integrationsList = [];

document.addEventListener('DOMContentLoaded', () => {
  loadIntegrations();
});

async function loadIntegrations() {
  const container = document.getElementById('integrations-grid');
  if (!container) return;

  try {
    const res = await api.get('/integrations');
    integrationsList = res.data || [];

    container.innerHTML = integrationsList.map(int => {
      const isConnected = int.status === 'connected';
      const statusBadge =
        isConnected ? 'badge-approved' :
        int.status === 'configured' ? 'badge-requires-review' : 'badge-draft';

      return `
        <div class="card card-interactive">
          <div class="card-header">
            <div>
              <div class="card-title">${int.name}</div>
              <div class="card-subtitle">${int.category} • ${int.credentials.isSandbox ? 'Sandbox Mode' : 'Production'}</div>
            </div>
            <span class="badge ${statusBadge}">${int.status.toUpperCase()}</span>
          </div>

          <div class="card-body">
            <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5;">
              ${int.description}
            </p>

            <div style="background: var(--surface-card-subtle); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); font-size: 12px; margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span style="color: var(--text-muted);">Last Sync:</span>
                <span style="font-weight: 600;">${int.lastSyncTime ? formatDate(int.lastSyncTime) : 'Never'}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Sync Status:</span>
                <span style="color: var(--brand-primary); font-weight: 500;">${int.lastSyncStatus || 'Ready'}</span>
              </div>
            </div>

            <div class="flex justify-between items-center" style="border-top: 1px solid var(--border-subtle); padding-top: 12px;">
              <button class="btn btn-secondary btn-sm" onclick="openConfigModal('${int._id}')">
                <i data-lucide="settings"></i> Configure
              </button>

              <div class="flex gap-xs">
                <button class="btn btn-ghost btn-sm" onclick="testConnection('${int._id}')" title="Test Handshake">
                  <i data-lucide="activity"></i> Test Handshake
                </button>
                <button class="btn btn-primary btn-sm" onclick="triggerSync('${int._id}')" ${!isConnected ? 'disabled style="opacity: 0.6;"' : ''}>
                  <i data-lucide="refresh-cw"></i> Sync Now
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #DC2626; padding: 25px;">
        Failed to load integrations: ${err.message}
      </div>
    `;
  }
}

function openConfigModal(id) {
  const int = integrationsList.find(i => i._id === id);
  if (!int) return;

  document.getElementById('int-id').value = int._id;
  document.getElementById('int-modal-title').innerText = `Configure ${int.name}`;
  document.getElementById('int-api-key').value = int.credentials.apiKey || '';
  document.getElementById('int-client-id').value = int.credentials.clientId || '';
  document.getElementById('int-client-secret').value = int.credentials.clientSecret || '';
  document.getElementById('int-endpoint').value = int.credentials.endpointUrl || '';
  document.getElementById('int-sandbox-toggle').checked = Boolean(int.credentials.isSandbox);

  document.getElementById('integration-modal').classList.add('active');
}

function closeIntegrationModal() {
  document.getElementById('integration-modal').classList.remove('active');
}

document.getElementById('integration-config-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('int-id').value;
  const apiKey = document.getElementById('int-api-key').value.trim();
  const clientId = document.getElementById('int-client-id').value.trim();
  const clientSecret = document.getElementById('int-client-secret').value.trim();
  const endpointUrl = document.getElementById('int-endpoint').value.trim();
  const isSandbox = document.getElementById('int-sandbox-toggle').checked;

  try {
    await api.put(`/integrations/${id}`, {
      apiKey,
      clientId,
      clientSecret,
      endpointUrl,
      isSandbox,
      status: apiKey ? 'connected' : 'configured',
    });

    showToast('Integration credentials saved successfully.', 'success');
    closeIntegrationModal();
    loadIntegrations();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

async function testConnection(id) {
  try {
    showToast('Initiating SSL handshake and API verification...', 'info');
    const res = await api.post(`/integrations/${id}/test`);
    showToast(res.message, 'success');
    loadIntegrations();
  } catch (err) {
    showToast('Verification failed: ' + err.message, 'error');
  }
}

async function triggerSync(id) {
  try {
    showToast('Synchronizing accounting journal entries...', 'info');
    const res = await api.post(`/integrations/${id}/sync`);
    showToast(res.message, 'success');
    loadIntegrations();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
