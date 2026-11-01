/* ===================================================================
   EXPENSEAI — APPROVALS & REIMBURSEMENT WORKFLOW SCRIPT
   =================================================================== */

let currentFilter = 'submitted';

document.addEventListener('DOMContentLoaded', () => {
  loadApprovalsQueue();
});

function switchApprovalTab(status, btn) {
  currentFilter = status;
  document.querySelectorAll('.approval-tab').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
  });
  btn.classList.remove('btn-secondary');
  btn.classList.add('btn-primary');
  loadApprovalsQueue();
}

async function loadApprovalsQueue() {
  const container = document.getElementById('approvals-queue-container');
  if (!container) return;

  const user = api.getUser();
  const params = new URLSearchParams();
  if (currentFilter && currentFilter !== 'All') {
    params.append('filterStatus', currentFilter);
  }

  try {
    const res = await api.get(`/approvals/pending?${params.toString()}`);
    const claims = res.data || [];

    if (claims.length === 0) {
      container.innerHTML = `
        <div class="card empty-state">
          <div class="empty-state-icon"><i data-lucide="check-check"></i></div>
          <div class="empty-state-title">Approval Queue Cleared</div>
          <div class="empty-state-desc">There are no pending expense claims matching the current filter state.</div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = claims.map(c => {
      const isOverPolicy = c.policyStatus !== 'within_policy';
      const hasFraudRisk = c.fraudRisk && c.fraudRisk.level !== 'low';
      const submitterName = c.userId ? c.userId.name : 'Employee';
      const dept = c.userId ? c.userId.department : 'General';

      // Check if current user is the submitter (Self-approval restriction)
      const isSelfClaim = user && c.userId && user.id === c.userId._id && user.role !== 'admin';

      return `
        <div class="card card-interactive" style="border-left: 4px solid ${isOverPolicy ? '#F59E0B' : '#10B981'};">
          <div class="card-body">
            <div class="flex justify-between items-center" style="margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
              <div>
                <span class="category-tag">${c.category}</span>
                <span class="badge ${c.policyStatus === 'within_policy' ? 'badge-within-policy' : 'badge-requires-review'}" style="margin-left: 6px;">
                  ${c.policyStatus.replace('_', ' ')}
                </span>
                ${hasFraudRisk ? `<span class="badge badge-warning" style="margin-left: 6px;"><i data-lucide="alert-triangle"></i> Anomaly Detected</span>` : ''}
              </div>
              <div style="font-family: var(--font-heading); font-size: 22px; font-weight: 800; color: var(--brand-primary);">
                ${formatMoney(c.convertedAmount || c.amount, c.reportingCurrency || 'USD')}
              </div>
            </div>

            <div class="grid-2" style="margin-bottom: 12px;">
              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Merchant / Transaction</div>
                <div style="font-weight: 700; font-size: 16px; color: var(--text-primary); margin-top: 2px;">
                  ${c.merchant}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  ${formatDate(c.date)} • Payment: ${c.paymentMethod}
                </div>
              </div>

              <div>
                <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Submitted By</div>
                <div style="font-weight: 600; font-size: 14px; color: var(--text-primary); margin-top: 2px;">
                  ${submitterName}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  Department: ${dept}
                </div>
              </div>
            </div>

            ${c.description ? `<p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 10px; background: var(--surface-card-subtle); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">${c.description}</p>` : ''}

            <!-- Policy Warning Notes -->
            ${c.policyViolations && c.policyViolations.length > 0 ? `
              <div class="alert alert-warning" style="padding: 8px 12px; font-size: 12px; margin-bottom: 12px;">
                <i data-lucide="shield-alert"></i>
                <div>${c.policyViolations[0].message}</div>
              </div>
            ` : ''}

            <!-- Fraud / Duplicate Flag Notes -->
            ${c.fraudRisk && c.fraudRisk.flags && c.fraudRisk.flags.length > 0 ? `
              <div class="alert alert-warning" style="padding: 8px 12px; font-size: 12px; margin-bottom: 12px;">
                <i data-lucide="copy"></i>
                <div>${c.fraudRisk.flags[0]}</div>
              </div>
            ` : ''}

            <div class="flex justify-between items-center" style="border-top: 1px solid var(--border-subtle); padding-top: 12px; margin-top: 8px; flex-wrap: wrap; gap: 8px;">
              <div>
                ${c.receiptUrl ? `
                  <a href="${c.receiptUrl}" target="_blank" class="btn btn-secondary btn-sm">
                    <i data-lucide="file-text"></i> Inspect Receipt Document
                  </a>
                ` : '<span style="font-size: 12px; color: var(--text-muted);"><i data-lucide="file-x"></i> No Receipt Attached</span>'}
              </div>

              <div class="flex gap-xs">
                ${isSelfClaim ? `
                  <span style="font-size: 12px; color: var(--text-muted); font-style: italic; align-self: center;">
                    Self-claim: Awaiting peer manager review
                  </span>
                ` : `
                  ${c.status === 'submitted' || c.status === 'under_review' ? `
                    <button class="btn btn-danger btn-sm" onclick="openRejectModal('${c._id}')">
                      <i data-lucide="x"></i> Reject
                    </button>
                    <button class="btn btn-success btn-sm" onclick="approveClaim('${c._id}')">
                      <i data-lucide="check"></i> Approve Claim
                    </button>
                  ` : ''}

                  ${c.status === 'approved' ? `
                    <button class="btn btn-primary btn-sm" onclick="openReimburseModal('${c._id}')">
                      <i data-lucide="landmark"></i> Disburse ACH Reimbursement
                    </button>
                  ` : ''}

                  ${c.status === 'reimbursed' ? `
                    <span class="badge badge-reimbursed" style="font-size: 12px;">
                      <i data-lucide="check-check"></i> Reimbursed (${c.reimbursementRef || 'Settled'})
                    </span>
                  ` : ''}
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; color: #DC2626; padding: 25px;">
        Failed to load approval queue: ${err.message}
      </div>
    `;
  }
}

async function approveClaim(id) {
  try {
    await api.post(`/approvals/${id}/approve`);
    showToast('Claim approved and forwarded for reimbursement!', 'success');
    loadApprovalsQueue();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openRejectModal(id) {
  document.getElementById('reject-expense-id').value = id;
  document.getElementById('rejection-reason').value = '';
  document.getElementById('reject-modal').classList.add('active');
}

function closeRejectModal() {
  document.getElementById('reject-modal').classList.remove('active');
}

async function confirmRejection() {
  const id = document.getElementById('reject-expense-id').value;
  const reason = document.getElementById('rejection-reason').value.trim();

  if (!reason) {
    showToast('Please provide a mandatory rejection reason.', 'warning');
    return;
  }

  try {
    await api.post(`/approvals/${id}/reject`, { reason });
    showToast('Claim rejected with documented explanation.', 'info');
    closeRejectModal();
    loadApprovalsQueue();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openReimburseModal(id) {
  document.getElementById('reimburse-expense-id').value = id;
  document.getElementById('reimburse-ref').value = `TXN-ACH-${Date.now().toString().slice(-6)}`;
  document.getElementById('reimburse-modal').classList.add('active');
}

function closeReimburseModal() {
  document.getElementById('reimburse-modal').classList.remove('active');
}

async function confirmReimbursement() {
  const id = document.getElementById('reimburse-expense-id').value;
  const ref = document.getElementById('reimburse-ref').value.trim();

  try {
    await api.post(`/approvals/${id}/reimburse`, { referenceNumber: ref });
    showToast('Reimbursement payment disbursed successfully!', 'success');
    closeReimburseModal();
    loadApprovalsQueue();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
