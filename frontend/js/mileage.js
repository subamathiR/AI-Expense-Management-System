/* ===================================================================
   EXPENSEAI — MILEAGE TRACKING CONTROLLER SCRIPT
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('trip-date').value = new Date().toISOString().split('T')[0];
  loadMileageTrips();
});

function calculateReimbursement() {
  const miles = parseFloat(document.getElementById('distance-miles').value) || 0;
  const rate = parseFloat(document.getElementById('rate-per-mile').value) || 0.67;
  const total = Math.round(miles * rate * 100) / 100;

  document.getElementById('estimated-payout').innerText = `$${total.toFixed(2)}`;
}

async function loadMileageTrips() {
  const tbody = document.getElementById('mileage-tbody');
  if (!tbody) return;

  try {
    const res = await api.get('/mileage');
    const trips = res.data || [];

    if (trips.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">
            No mileage trips logged yet.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = trips.map(t => `
      <tr>
        <td style="color: var(--text-secondary); white-space: nowrap;">${formatDate(t.tripDate)}</td>
        <td>
          <div style="font-weight: 600; font-size: 13px;">${t.startLocation} → ${t.destination}</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">${t.businessPurpose}</div>
        </td>
        <td><strong>${t.distanceMiles} mi</strong></td>
        <td class="amount-cell">$${t.reimbursementAmount.toFixed(2)}</td>
        <td><span class="badge badge-${t.status === 'approved' ? 'approved' : 'pending'}">${t.status.toUpperCase()}</span></td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #DC2626; padding: 20px;">
          Failed to load mileage trips: ${err.message}
        </td>
      </tr>
    `;
  }
}

document.getElementById('mileage-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const tripDate = document.getElementById('trip-date').value;
  const startLocation = document.getElementById('start-location').value.trim();
  const destination = document.getElementById('destination').value.trim();
  const businessPurpose = document.getElementById('business-purpose').value.trim();
  const distanceMiles = parseFloat(document.getElementById('distance-miles').value);
  const ratePerMile = parseFloat(document.getElementById('rate-per-mile').value);
  const autoCreateExpense = document.getElementById('auto-expense-check').checked;

  const btn = document.getElementById('log-trip-btn');
  btn.disabled = true;

  try {
    await api.post('/mileage', {
      tripDate,
      startLocation,
      destination,
      businessPurpose,
      distanceMiles,
      ratePerMile,
      autoCreateExpense,
    });

    showToast('Mileage claim logged and synchronized!', 'success');
    document.getElementById('mileage-form').reset();
    document.getElementById('rate-per-mile').value = '0.67';
    document.getElementById('trip-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('estimated-payout').innerText = '$0.00';
    loadMileageTrips();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
});
