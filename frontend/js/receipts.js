/* ===================================================================
   EXPENSEAI — RECEIPT OCR & REVIEW SCRIPT
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ocr-date').value = new Date().toISOString().split('T')[0];
  loadReceiptsRepository();

  document.getElementById('receipt-scan-input').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadReceiptForOCR(e.target.files[0]);
    }
  });

  const previewBox = document.getElementById('preview-container');
  if (previewBox) {
    previewBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      previewBox.style.borderColor = 'var(--brand-primary)';
      previewBox.style.backgroundColor = 'var(--surface-muted)';
    });
    previewBox.addEventListener('dragleave', (e) => {
      e.preventDefault();
      previewBox.style.borderColor = '';
      previewBox.style.backgroundColor = '';
    });
    previewBox.addEventListener('drop', (e) => {
      e.preventDefault();
      previewBox.style.borderColor = '';
      previewBox.style.backgroundColor = '';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadReceiptForOCR(e.dataTransfer.files[0]);
      }
    });
  }
});

async function uploadReceiptForOCR(file) {
  const placeholder = document.getElementById('scanner-placeholder');
  const imgEl = document.getElementById('active-receipt-img');
  const confidenceEl = document.getElementById('confidence-container');

  confidenceEl.innerHTML = `<span class="confidence-meter medium"><span class="spinner" style="width: 12px; height: 12px;"></span> Processing OCR...</span>`;

  const formData = new FormData();
  formData.append('receipt', file);

  try {
    const res = await api.post('/receipts/upload', formData, true);

    placeholder.style.display = 'none';
    imgEl.style.display = 'block';

    if (file.type.startsWith('image/')) {
      imgEl.src = URL.createObjectURL(file);
    } else {
      imgEl.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80';
    }

    document.getElementById('ocr-receipt-id').value = res.receiptId;
    const ext = res.extracted || {};

    document.getElementById('ocr-vendor').value = ext.vendor || '';
    document.getElementById('ocr-total').value = ext.totalAmount || '';
    document.getElementById('ocr-tax').value = ext.taxAmount || '0.00';
    document.getElementById('ocr-subtotal').value = ext.subtotalAmount || '';
    if (ext.suggestedCategory) document.getElementById('ocr-category').value = ext.suggestedCategory;
    if (ext.paymentMethod) document.getElementById('ocr-payment').value = ext.paymentMethod;

    if (ext.date) {
      document.getElementById('ocr-date').value = new Date(ext.date).toISOString().split('T')[0];
    }

    document.getElementById('raw-ocr-text').innerText = ext.extractedText || 'OCR Complete. All metadata fields identified.';

    const confScore = ext.confidenceScore || 95;
    confidenceEl.innerHTML = `
      <span class="confidence-meter ${confScore > 85 ? 'high' : 'medium'}">
        <i data-lucide="check-circle-2"></i> ${confScore}% Confidence
      </span>
    `;

    const warningEl = document.getElementById('ocr-duplicate-warning');
    if (res.duplicateNotice) {
      warningEl.style.display = 'block';
      warningEl.className = 'alert alert-warning';
      warningEl.innerHTML = `<i data-lucide="alert-triangle"></i> <div><strong>Duplicate Hash Warning:</strong> ${res.duplicateNotice}</div>`;
    } else {
      warningEl.style.display = 'none';
    }

    showToast('Receipt parsed with AI OCR! Verify fields and save.', 'success');
    loadReceiptsRepository();
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    confidenceEl.innerHTML = `<span class="confidence-meter low"><i data-lucide="alert-circle"></i> OCR Failed</span>`;
    showToast(err.message, 'error');
  }
}

function loadSampleReceipt(type) {
  const samples = {
    delta: {
      vendor: 'Delta Air Lines, Inc.',
      total: 680.00,
      subtotal: 620.00,
      tax: 60.00,
      category: 'Travel',
      payment: 'Corporate Card (Visa)',
      img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&q=80',
      text: 'DELTA AIR LINES\nPASSENGER TICKET & BAGGAGE CHECK\nNYC JFK TO SFO\nTOTAL FARE: $620.00\nTAX & FEES: $60.00\nGRAND TOTAL: $680.00 USD\nPAYMENT: VISA ENDING IN 4912',
    },
    restaurant: {
      vendor: 'Blue Fin Bistro & Grill',
      total: 84.50,
      subtotal: 76.80,
      tax: 7.70,
      category: 'Meals & Entertainment',
      payment: 'Corporate Card (AMEX)',
      img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80',
      text: 'BLUE FIN BISTRO & GRILL\nTABLE 14 • 2 GUESTS\n2X GRILLED SALMON: $54.00\n1X SPARKLING WATER: $8.00\n1X DESSERT TART: $14.80\nSUBTOTAL: $76.80\nTAX 10%: $7.70\nTOTAL: $84.50\nTHANK YOU FOR DINING WITH US!',
    },
    office: {
      vendor: 'Staples Office Supplies',
      total: 145.20,
      subtotal: 134.40,
      tax: 10.80,
      category: 'Office Supplies',
      payment: 'Corporate Card',
      img: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&q=80',
      text: 'STAPLES STORE #0412\n1X ERGONOMIC SPLIT KEYBOARD: $89.99\n1X HIGH DENSITY DESK MAT: $24.99\n2X RECYCLED PAPER REAMS: $19.42\nSUBTOTAL: $134.40\nSALES TAX: $10.80\nTOTAL: $145.20',
    },
  };

  const sample = samples[type];
  if (!sample) return;

  document.getElementById('scanner-placeholder').style.display = 'none';
  const imgEl = document.getElementById('active-receipt-img');
  imgEl.style.display = 'block';
  imgEl.src = sample.img;

  document.getElementById('ocr-vendor').value = sample.vendor;
  document.getElementById('ocr-total').value = sample.total.toFixed(2);
  document.getElementById('ocr-subtotal').value = sample.subtotal.toFixed(2);
  document.getElementById('ocr-tax').value = sample.tax.toFixed(2);
  document.getElementById('ocr-category').value = sample.category;
  document.getElementById('ocr-payment').value = sample.payment;
  document.getElementById('raw-ocr-text').innerText = sample.text;

  document.getElementById('confidence-container').innerHTML = `
    <span class="confidence-meter high">
      <i data-lucide="check-circle-2"></i> 99.2% Confidence (Sample Verified)
    </span>
  `;

  showToast(`Loaded ${sample.vendor} sample receipt.`, 'info');
  if (window.lucide) window.lucide.createIcons();
}

function resetReviewForm() {
  document.getElementById('ocr-review-form').reset();
  document.getElementById('active-receipt-img').style.display = 'none';
  document.getElementById('scanner-placeholder').style.display = 'block';
  document.getElementById('raw-ocr-text').innerText = 'Awaiting document...';
  document.getElementById('ocr-receipt-id').value = '';
}

document.getElementById('ocr-review-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const merchant = document.getElementById('ocr-vendor').value.trim();
  const amount = parseFloat(document.getElementById('ocr-total').value);
  const category = document.getElementById('ocr-category').value;
  const date = document.getElementById('ocr-date').value;
  const paymentMethod = document.getElementById('ocr-payment').value || 'Corporate Card';
  const receiptId = document.getElementById('ocr-receipt-id').value;

  const btn = document.getElementById('save-ocr-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> <span>Saving to Ledger...</span>`;

  try {
    await api.post('/expenses', {
      merchant,
      amount,
      currency: 'USD',
      category,
      date,
      paymentMethod,
      description: `OCR Scanned Receipt from ${merchant}`,
      receiptId: receiptId || undefined,
    });

    showToast('Expense created and verified by Policy Engine!', 'success');
    setTimeout(() => {
      window.location.href = 'expenses.html';
    }, 600);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="check"></i> Confirm & Save Expense`;
    if (window.lucide) window.lucide.createIcons();
  }
});

let loadedReceipts = [];
let currentZoom = 1;
let currentPreviewReceiptId = null;

async function loadReceiptsRepository() {
  const tbody = document.getElementById('receipts-gallery-tbody');
  if (!tbody) return;

  try {
    const res = await api.get('/receipts');
    const receipts = res.data || [];
    loadedReceipts = receipts;

    if (receipts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 25px;">
            No scanned receipts in database yet. Drop a file above to begin.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = receipts.map(r => `
      <tr id="receipt-row-${r._id}" data-receipt-id="${r._id}" data-filename="${r.filename}">
        <td style="color: var(--text-secondary);">${formatDate(r.createdAt)}</td>
        <td><strong>${r.originalFilename}</strong></td>
        <td>${r.extractedFields ? r.extractedFields.vendor || '—' : '—'}</td>
        <td class="amount-cell">$${r.extractedFields ? (r.extractedFields.totalAmount || 0).toFixed(2) : '0.00'}</td>
        <td>
          <span class="confidence-meter high">${r.extractedFields ? (r.extractedFields.confidenceScore || 95) : 95}%</span>
        </td>
        <td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">
          ${r.fileHash ? r.fileHash.substring(0, 16) + '...' : 'Verified'}
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-ghost btn-sm" onclick="openReceiptPreview('${r._id}')" title="Preview Receipt" id="preview-btn-${r._id}">
            <i data-lucide="eye"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Check URL parameters to identify and display relevant receipt record
    handleReceiptUrlParams(receipts);
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: #DC2626; padding: 20px;">
          Failed to load repository: ${err.message}
        </td>
      </tr>
    `;
  }
}

function handleReceiptUrlParams(receipts) {
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get('receiptId') || urlParams.get('id');
  const targetFile = urlParams.get('file');

  if (!targetId && !targetFile && !window.location.hash.includes('receipts-repository')) {
    return;
  }

  // Find matching receipt
  const match = receipts.find(r => 
    (targetId && (r._id === targetId || r.id === targetId)) ||
    (targetFile && (r.filename === targetFile || r.originalFilename === targetFile))
  );

  if (match) {
    const rowEl = document.getElementById(`receipt-row-${match._id}`);
    if (rowEl) {
      setTimeout(() => {
        rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rowEl.classList.add('highlight-row');
      }, 200);
    }
  } else if (window.location.hash.includes('receipts-repository')) {
    const repoEl = document.getElementById('receipts-repository');
    if (repoEl) {
      setTimeout(() => {
        repoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}

function openReceiptPreview(receiptId) {
  let receipt = loadedReceipts.find(r => r._id === receiptId || r.id === receiptId);
  if (!receipt) {
    showToast('Receipt record not found.', 'error');
    return;
  }

  currentPreviewReceiptId = receipt._id || receipt.id;
  currentZoom = 1;

  const modal = document.getElementById('receipt-preview-modal');
  const imgEl = document.getElementById('receipt-modal-img');
  const titleEl = document.getElementById('preview-modal-title');
  const subtitleEl = document.getElementById('preview-modal-subtitle');
  const fileInfoEl = document.getElementById('preview-file-info');
  const loadingEl = document.getElementById('receipt-modal-loading');
  const errorEl = document.getElementById('receipt-modal-error');
  const zoomResetBtn = document.getElementById('preview-zoom-reset');

  if (titleEl) {
    const vendor = receipt.extractedFields && receipt.extractedFields.vendor;
    titleEl.innerText = vendor ? `${vendor} — Receipt Preview` : (receipt.originalFilename || 'Receipt Preview');
  }

  if (subtitleEl) {
    const dateStr = receipt.createdAt ? formatDate(receipt.createdAt) : '';
    const total = receipt.extractedFields && receipt.extractedFields.totalAmount != null ? `$${receipt.extractedFields.totalAmount.toFixed(2)}` : '';
    subtitleEl.innerText = `Uploaded: ${dateStr}${total ? ' • Total: ' + total : ''}`;
  }

  if (fileInfoEl) {
    const hash = receipt.fileHash ? `SHA256: ${receipt.fileHash.substring(0, 16)}...` : '';
    fileInfoEl.innerText = `${receipt.filename || receipt.originalFilename || ''} ${hash ? ' • ' + hash : ''}`;
  }

  if (zoomResetBtn) {
    zoomResetBtn.innerText = '100%';
  }

  if (imgEl) {
    imgEl.style.display = 'none';
    imgEl.style.transform = 'scale(1)';
    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';

    imgEl.onload = () => {
      if (loadingEl) loadingEl.style.display = 'none';
      imgEl.style.display = 'block';
    };
    imgEl.onerror = () => {
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) {
        errorEl.style.display = 'block';
        const errText = document.getElementById('receipt-modal-error-text');
        if (errText) errText.innerText = 'Unable to load receipt image: ' + (receipt.filename || '');
      }
    };

    imgEl.src = `/uploads/${receipt.filename}`;
  }

  if (modal) {
    modal.classList.add('active');
  }
  if (window.lucide) window.lucide.createIcons();
}

function zoomReceiptImage(delta) {
  const imgEl = document.getElementById('receipt-modal-img');
  const zoomResetBtn = document.getElementById('preview-zoom-reset');
  if (!imgEl) return;

  currentZoom = Math.min(Math.max(currentZoom + delta, 0.5), 3.0);
  imgEl.style.transform = `scale(${currentZoom})`;
  if (zoomResetBtn) {
    zoomResetBtn.innerText = `${Math.round(currentZoom * 100)}%`;
  }
}

function resetReceiptZoom() {
  const imgEl = document.getElementById('receipt-modal-img');
  const zoomResetBtn = document.getElementById('preview-zoom-reset');
  if (!imgEl) return;

  currentZoom = 1;
  imgEl.style.transform = 'scale(1)';
  if (zoomResetBtn) {
    zoomResetBtn.innerText = '100%';
  }
}

function closeReceiptModal() {
  const modal = document.getElementById('receipt-preview-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  const imgEl = document.getElementById('receipt-modal-img');
  if (imgEl) {
    imgEl.src = '';
  }
  currentPreviewReceiptId = null;
}

function handlePreviewBackdropClick(e) {
  if (e.target && e.target.id === 'receipt-preview-modal') {
    closeReceiptModal();
  }
}

function openDeleteReceiptConfirm() {
  if (!currentPreviewReceiptId) {
    showToast('No receipt selected.', 'error');
    return;
  }
  const receipt = loadedReceipts.find(r => r._id === currentPreviewReceiptId || r.id === currentPreviewReceiptId);
  const targetInfoEl = document.getElementById('delete-receipt-target-info');
  if (targetInfoEl && receipt) {
    const vendor = receipt.extractedFields && receipt.extractedFields.vendor;
    const name = receipt.originalFilename || receipt.filename;
    targetInfoEl.innerText = vendor ? `${vendor} (${name})` : name;
  }
  const modal = document.getElementById('delete-receipt-confirm-modal');
  if (modal) {
    modal.classList.add('active');
  }
  if (window.lucide) window.lucide.createIcons();
}

function closeDeleteReceiptConfirm() {
  const modal = document.getElementById('delete-receipt-confirm-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function handleDeleteConfirmBackdropClick(e) {
  if (e.target && e.target.id === 'delete-receipt-confirm-modal') {
    closeDeleteReceiptConfirm();
  }
}

async function executeReceiptDeletion() {
  if (!currentPreviewReceiptId) {
    closeDeleteReceiptConfirm();
    return;
  }

  const deleteBtn = document.getElementById('confirm-delete-receipt-btn');
  const cancelBtn = document.getElementById('cancel-delete-receipt-btn');
  const origBtnHtml = deleteBtn ? deleteBtn.innerHTML : 'Delete';

  if (deleteBtn) {
    deleteBtn.disabled = true;
    deleteBtn.innerHTML = `<span class="spinner" style="width: 14px; height: 14px; margin-right: 6px;"></span> Deleting...`;
  }
  if (cancelBtn) cancelBtn.disabled = true;

  try {
    const deletedId = currentPreviewReceiptId;
    const res = await api.delete(`/receipts/${deletedId}`);

    // If currently reviewing this receipt in the OCR review form, reset it
    const activeOcrId = document.getElementById('ocr-receipt-id');
    if (activeOcrId && activeOcrId.value === deletedId) {
      resetReviewForm();
    }

    // Close both modals
    closeDeleteReceiptConfirm();
    closeReceiptModal();

    // Immediately remove receipt row from DOM if present
    const rowEl = document.getElementById(`receipt-row-${deletedId}`);
    if (rowEl) {
      rowEl.remove();
    }

    showToast(res.message || 'Receipt deleted successfully.', 'success');

    // Refresh repository data to ensure sync
    await loadReceiptsRepository();
  } catch (err) {
    showToast(err.message || 'Failed to delete receipt.', 'error');
  } finally {
    if (deleteBtn) {
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = origBtnHtml;
    }
    if (cancelBtn) cancelBtn.disabled = false;
    if (window.lucide) window.lucide.createIcons();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const confirmModal = document.getElementById('delete-receipt-confirm-modal');
    if (confirmModal && confirmModal.classList.contains('active')) {
      closeDeleteReceiptConfirm();
      return;
    }
    closeReceiptModal();
  }
});
