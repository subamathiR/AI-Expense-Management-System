/**
 * Mileage Calculator Event Handler
 */
document.addEventListener('DOMContentLoaded', () => {
  const mileageForm = document.getElementById('mileage-form');
  const distanceInput = document.getElementById('distance');
  const rateInput = document.getElementById('rate');
  const startInput = document.getElementById('start');
  const destInput = document.getElementById('dest');
  const submitBtn = mileageForm ? mileageForm.querySelector('button[type="submit"]') : null;

  if (distanceInput && rateInput && submitBtn) {
    function updateCalculatedTotal() {
      const distance = parseFloat(distanceInput.value || 0);
      const rate = parseFloat(rateInput.value || 10);
      const total = (distance * rate).toFixed(2);
      if (typeof formatCurrency === 'function') {
        submitBtn.innerText = `Submit Mileage Claim (${formatCurrency(total, 'INR')})`;
      } else {
        submitBtn.innerText = `Submit Mileage Claim (₹${total})`;
      }
    }

    distanceInput.addEventListener('input', updateCalculatedTotal);
    rateInput.addEventListener('input', updateCalculatedTotal);
  }

  if (mileageForm) {
    mileageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const startLocation = startInput?.value || 'Origin';
      const destination = destInput?.value || 'Destination';
      const distance = parseFloat(distanceInput?.value || 0);
      const rate = parseFloat(rateInput?.value || 10);
      const amount = distance * rate;

      if (distance <= 0) {
        if (typeof showToast === 'function') showToast('Please enter a valid distance', 'error');
        return;
      }

      try {
        if (submitBtn) submitBtn.disabled = true;
        
        await API.createExpense({
          title: `Mileage Claim: ${startLocation} to ${destination}`,
          vendor: 'Business Travel',
          amount: amount,
          category: 'Travel',
          date: new Date().toISOString().split('T')[0],
          description: `Trip from ${startLocation} to ${destination} (${distance} km @ ₹${rate}/km)`,
          currency: 'INR',
          type: 'mileage',
          status: 'submitted',
          mileageDetails: {
            startLocation,
            destination,
            distance,
            ratePerUnit: rate
          }
        });

        if (typeof showToast === 'function') {
          showToast('Mileage claim submitted successfully!', 'success');
        }

        setTimeout(() => {
          window.location.href = './expenses.html';
        }, 800);
      } catch (err) {
        if (typeof showToast === 'function') {
          showToast(err.message || 'Failed to submit mileage claim', 'error');
        } else {
          alert('Error: ' + (err.message || 'Failed to submit mileage claim'));
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
