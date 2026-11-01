/* ===================================================================
   EXPENSEAI — ADD EXPENSE CONTROLLER SCRIPT
   Handles OCR file upload, prefill, live policy audit, and splits
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Set default date to today
  document.getElementById('date').value = new Date().toISOString().split('T')[0];

  // Setup Drag and Drop
  setupDropzone();

  // Setup input listeners for live policy check
  document.getElementById('amount').addEventListener('input', runLivePolicyCheck);
  document.getElementById('category').addEventListener('change', runLivePolicyCheck);
  document.getElementById('currency').addEventListener('change', updateCurrencySymbol);
});

function setupDropzone() {
  const dropzone = document.getElementById('receipt-dropzone');
  const fileInput = document.getElementById('receipt-file-input');

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-active');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-active');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-active');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  });
}

async function handleFileUpload(file) {
  const loading = document.getElementById('ocr-loading');
  const previewBox = document.getElementById('receipt-preview-box');
  const previewImg = document.getElementById('receipt-preview-img');
  const dropzone = document.getElementById('receipt-dropzone');

  loading.style.display = 'block';
  dropzone.style.display = 'none';

  const formData = new FormData();
  formData.append('receipt', file);

  try {
    const res = await api.post('/receipts/upload', formData, true);
    loading.style.display = 'none';
    previewBox.style.display = 'block';

    // Show image preview
    if (file.type.startsWith('image/')) {
      previewImg.src = URL.createObjectURL(file);
    } else {
      previewImg.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80';
    }

    // Attach receipt ID
    document.getElementById('attached-receipt-id').value = res.receiptId;

    // Prefill fields
    if (res.extracted) {
      if (res.extracted.vendor) document.getElementById('merchant').value = res.extracted.vendor;
      if (res.extracted.totalAmount) document.getElementById('amount').value = res.extracted.totalAmount;
      if (res.extracted.suggestedCategory) document.getElementById('category').value = res.extracted.suggestedCategory;
      if (res.extracted.paymentMethod) document.getElementById('paymentMethod').value = res.extracted.paymentMethod;

      if (res.extracted.confidenceScore) {
        document.getElementById('ocr-confidence-badge').innerHTML = `
          <span class="confidence-meter high">
            <i data-lucide="check"></i> AI Confidence: ${res.extracted.confidenceScore}% (Auto-Extracted)
          </span>
        `;
      }
    }

    if (res.duplicateNotice) {
      showToast(res.duplicateNotice, 'warning');
    } else {
      showToast('Receipt parsed with AI OCR! Fields populated.', 'success');
    }

    runLivePolicyCheck();
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    loading.style.display = 'none';
    dropzone.style.display = 'flex';
    showToast('OCR extraction warning: ' + err.message, 'warning');
  }
}

function removeReceipt() {
  document.getElementById('attached-receipt-id').value = '';
  document.getElementById('receipt-preview-box').style.display = 'none';
  document.getElementById('receipt-dropzone').style.display = 'flex';
  document.getElementById('receipt-file-input').value = '';
  runLivePolicyCheck();
}

function updateCurrencySymbol() {
  const curr = document.getElementById('currency').value;
  const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', JPY: '¥', INR: '₹', CHF: 'CHF' };
  document.getElementById('currency-symbol').innerText = symbols[curr] || '$';
}

function runLivePolicyCheck() {
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const category = document.getElementById('category').value;
  const hasReceipt = Boolean(document.getElementById('attached-receipt-id').value);
  const feedbackEl = document.getElementById('live-policy-feedback');

  const limits = {
    'Travel': 500,
    'Meals & Entertainment': 100,
    'Office Supplies': 200,
    'Software & Subscriptions': 350,
  };

  const limit = limits[category] || 400;

  if (amount > limit) {
    const excess = (amount - limit).toFixed(2);
    feedbackEl.style.display = 'block';
    feedbackEl.className = 'alert alert-warning';
    feedbackEl.innerHTML = `
      <i data-lucide="shield-alert"></i>
      <div>
        <strong>Policy Notice:</strong> This ${category} expense ($${amount.toFixed(2)}) exceeds standard policy ceiling ($${limit.toFixed(2)}) by $${excess}. Manager justification will be required.
      </div>
    `;
  } else if (amount >= 25 && !hasReceipt) {
    feedbackEl.style.display = 'block';
    feedbackEl.className = 'alert alert-danger';
    feedbackEl.innerHTML = `
      <i data-lucide="shield-x"></i>
      <div>
        <strong>Receipt Missing:</strong> Company policy mandates an attached receipt for expenses of $25.00 or higher.
      </div>
    `;
  } else if (amount > 0) {
    feedbackEl.style.display = 'block';
    feedbackEl.className = 'alert alert-success';
    feedbackEl.innerHTML = `
      <i data-lucide="check-circle-2"></i>
      <div>
        <strong>Policy Compliant:</strong> Expense is within the approved ${category} limit ($${limit.toFixed(2)}).
      </div>
    `;
  } else {
    feedbackEl.style.display = 'none';
  }

  if (window.lucide) window.lucide.createIcons();
}

function toggleSplitSection() {
  const toggle = document.getElementById('split-toggle');
  const section = document.getElementById('split-section');
  section.style.display = toggle.checked ? 'block' : 'none';

  if (toggle.checked && document.getElementById('split-rows-container').children.length === 0) {
    addSplitRow('Product & Engineering', 50);
    addSplitRow('Sales & Marketing', 50);
  }
}

function addSplitRow(target = 'Product & Engineering', defaultPct = 50) {
  const container = document.getElementById('split-rows-container');
  const totalAmount = parseFloat(document.getElementById('amount').value) || 0;
  const splitAmount = Math.round((totalAmount * (defaultPct / 100)) * 100) / 100;

  const row = document.createElement('div');
  row.className = 'split-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '2fr 1fr 1fr 36px';
  row.style.gap = '8px';
  row.style.marginBottom = '8px';
  row.style.alignItems = 'center';

  row.innerHTML = `
    <select class="form-control split-target">
      <option value="Product & Engineering" ${target === 'Product & Engineering' ? 'selected' : ''}>Product & Engineering</option>
      <option value="Sales & Marketing" ${target === 'Sales & Marketing' ? 'selected' : ''}>Sales & Marketing</option>
      <option value="Finance & Treasury" ${target === 'Finance & Treasury' ? 'selected' : ''}>Finance & Treasury</option>
      <option value="Operations & HR" ${target === 'Operations & HR' ? 'selected' : ''}>Operations & HR</option>
      <option value="Executive" ${target === 'Executive' ? 'selected' : ''}>Executive</option>
    </select>
    <div class="input-group">
      <input type="number" class="form-control split-pct" value="${defaultPct}" placeholder="%" oninput="recalcSplitAmounts()">
      <span class="input-suffix">%</span>
    </div>
    <div class="input-group">
      <span class="input-prefix">$</span>
      <input type="number" step="0.01" class="form-control split-amt" value="${splitAmount}">
    </div>
    <button type="button" class="btn-icon" style="color: #DC2626;" onclick="this.parentElement.remove(); recalcSplitAmounts();">
      <i data-lucide="trash-2"></i>
    </button>
  `;

  container.appendChild(row);
  if (window.lucide) window.lucide.createIcons();
}

function recalcSplitAmounts() {
  const totalAmount = parseFloat(document.getElementById('amount').value) || 0;
  const rows = document.querySelectorAll('.split-row');
  rows.forEach(r => {
    const pct = parseFloat(r.querySelector('.split-pct').value) || 0;
    const amt = Math.round((totalAmount * (pct / 100)) * 100) / 100;
    r.querySelector('.split-amt').value = amt.toFixed(2);
  });
}

function applyPreset(preset) {
  if (preset === 'delta') {
    document.getElementById('merchant').value = 'Delta Air Lines';
    document.getElementById('amount').value = '680.00';
    document.getElementById('category').value = 'Travel';
    document.getElementById('description').value = 'Flight NYC to SFO for client security summit';
  } else if (preset === 'starbucks') {
    document.getElementById('merchant').value = 'Starbucks Coffee #1042';
    document.getElementById('amount').value = '14.50';
    document.getElementById('category').value = 'Meals & Entertainment';
    document.getElementById('description').value = 'Coffee with candidate';
  } else if (preset === 'aws') {
    document.getElementById('merchant').value = 'Amazon Web Services (AWS)';
    document.getElementById('amount').value = '340.00';
    document.getElementById('category').value = 'Software & Subscriptions';
    document.getElementById('description').value = 'Monthly S3 & EC2 compute workloads';
  }
  runLivePolicyCheck();
}

// Form Submission
document.getElementById('add-expense-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const merchant = document.getElementById('merchant').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const currency = document.getElementById('currency').value;
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const paymentMethod = document.getElementById('paymentMethod').value;
  const description = document.getElementById('description').value.trim();
  const receiptId = document.getElementById('attached-receipt-id').value;

  // Collect Splits if toggled
  let splitDetails = [];
  if (document.getElementById('split-toggle').checked) {
    const rows = document.querySelectorAll('.split-row');
    rows.forEach(r => {
      splitDetails.push({
        allocationType: 'department',
        targetName: r.querySelector('.split-target').value,
        percentage: parseFloat(r.querySelector('.split-pct').value) || 0,
        amount: parseFloat(r.querySelector('.split-amt').value) || 0,
      });
    });
  }

  const btn = document.getElementById('submit-expense-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> <span>Running Policy Engine & Saving...</span>`;

  try {
    const res = await api.post('/expenses', {
      merchant,
      amount,
      currency,
      category,
      date,
      paymentMethod,
      description,
      receiptId: receiptId || undefined,
      splitDetails,
    });

    showToast('Expense created and submitted for approval!', 'success');
    setTimeout(() => {
      window.location.href = 'expenses.html';
    }, 600);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="check-circle-2"></i> <span>Submit Expense for Approval</span>`;
    if (window.lucide) window.lucide.createIcons();
  }
});
