/**
 * Approval Module — Manager approval queue, policy violation review, and approve/reject actions
 */
document.addEventListener('DOMContentLoaded', async () => {
  const approvalTableBody = document.querySelector('#approval-table tbody');

  if (approvalTableBody) {
    await loadPendingApprovals();
  }

  async function loadPendingApprovals() {
    try {
      const res = await API.getApprovals('status=submitted');
      const claims = res.data || [];

      if (claims.length === 0) {
        approvalTableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;" class="text-muted">
              ✓ No pending approvals requiring action!
            </td>
          </tr>
        `;
        return;
      }

      approvalTableBody.innerHTML = claims.map(c => `
        <tr>
          <td><strong>${c.employee?.name || c.employee?.email || 'John Smith'}</strong></td>
          <td>${formatText(c.vendor)}</td>
          <td>${formatText(c.category)}</td>
          <td>${formatCurrency(c.amount, c.currency || 'INR')}</td>
          <td>
            ${c.policyStatus === 'violation' ? '<span class="badge badge-violation">⚠ Violation</span>' : '<span class="badge badge-approved">✓ Compliant</span>'}
            ${c.anomalyStatus === 'suspicious' ? '<span class="badge badge-rejected" style="margin-left: 0.25rem;">⚠ Anomaly</span>' : ''}
          </td>
          <td>
            <button onclick="approveClaim('${c._id}')" class="btn btn-success" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;">Approve</button>
            <button onclick="rejectClaim('${c._id}')" class="btn btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Reject</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      approvalTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--danger); padding: 1.5rem;">
            Failed to load pending approvals. ${err.message || ''}
          </td>
        </tr>
      `;
    }
  }

  window.approveClaim = async (id) => {
    try {
      await API.approveClaim(id, 'Approved via Manager Console');
      showToast('Claim approved successfully!', 'success');
      await loadPendingApprovals();
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  window.rejectClaim = async (id) => {
    const reason = prompt('Please provide a reason for rejecting this claim:') || 'Non-compliant expense';
    try {
      await API.rejectClaim(id, reason);
      showToast('Claim rejected.', 'warning');
      await loadPendingApprovals();
    } catch (err) {
      showToast(err.message || 'Rejection failed', 'error');
    }
  };
});
