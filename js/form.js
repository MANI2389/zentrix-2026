/**
 * ZENTRIX 2K26 — Registration Form Logic
 * Dynamic team members, live fee calculation, payment screenshot preview, validation and submission
 */

import { showToast, getApiBaseUrl } from './main.js';

const FEE_PER_HEAD = 200;
const MAX_TEAM_MEMBERS = 3; // 1 Lead + up to 3 additional members = Max 4 heads

// Global Form State
let teamMembers = [];
let screenshotBase64 = null;
let screenshotName = '';

document.addEventListener('DOMContentLoaded', () => {
  initCopyUPI();
  initTeamMembers();
  initCalculation();
  initScreenshotUpload();
  initFormValidation();
});

// Copy UPI ID to clipboard
function initCopyUPI() {
  const copyBtn = document.getElementById('copy-upi-btn');
  const upiText = document.getElementById('upi-id-text');

  if (copyBtn && upiText) {
    copyBtn.addEventListener('click', async () => {
      const upiId = upiText.textContent.trim();
      try {
        await navigator.clipboard.writeText(upiId);
        copyBtn.textContent = 'Copied!';
        showToast(`UPI ID copied to clipboard: ${upiId}`, 'success');
        setTimeout(() => {
          copyBtn.textContent = 'Copy';
        }, 2000);
      } catch (e) {
        showToast(`Please manually copy UPI ID: ${upiId}`, 'info');
      }
    });
  }
}

// Initialize Dynamic Team Members Add/Remove
function initTeamMembers() {
  const addBtn = document.getElementById('add-member-btn');
  const container = document.getElementById('team-members-container');

  if (!addBtn || !container) return;

  addBtn.addEventListener('click', () => {
    if (teamMembers.length >= MAX_TEAM_MEMBERS) {
      showToast(`Maximum ${MAX_TEAM_MEMBERS} additional team members allowed (Total team size: 4).`, 'warning');
      return;
    }

    const memberId = 'member_' + Date.now();
    teamMembers.push({ id: memberId, name: '', department: '', year: '' });

    renderTeamRows();
    updateCalculation();
    checkFormValidity();
  });
}

// Render Team Member Rows into DOM
export function renderTeamRows() {
  const container = document.getElementById('team-members-container');
  const addBtn = document.getElementById('add-member-btn');
  if (!container) return;

  container.innerHTML = '';

  teamMembers.forEach((member, idx) => {
    const row = document.createElement('div');
    row.className = 'team-member-row';
    row.id = member.id;
    row.innerHTML = `
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.78rem;">Member #${idx + 1} Full Name <span class="req">*</span></label>
        <input type="text" class="form-control member-name-input" placeholder="Member Name" value="${escapeHtml(member.name || '')}" required data-id="${member.id}">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.78rem;">Department <span class="req">*</span></label>
        <input type="text" class="form-control member-dept-input" placeholder="e.g. CSE / IT / AI&DS" value="${escapeHtml(member.department || '')}" required data-id="${member.id}">
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label class="form-label" style="font-size: 0.78rem;">Year <span class="req">*</span></label>
        <select class="form-control member-year-input" required data-id="${member.id}">
          <option value="" disabled ${!member.year ? 'selected' : ''}>Year</option>
          <option value="1st Year" ${member.year === '1st Year' ? 'selected' : ''}>1st</option>
          <option value="2nd Year" ${member.year === '2nd Year' ? 'selected' : ''}>2nd</option>
          <option value="3rd Year" ${member.year === '3rd Year' ? 'selected' : ''}>3rd</option>
          <option value="4th Year" ${member.year === '4th Year' ? 'selected' : ''}>4th</option>
        </select>
      </div>
      <div style="display: flex; align-items: flex-end; padding-top: 18px;">
        <button type="button" class="btn btn-danger remove-member-btn" data-id="${member.id}" title="Remove Team Member">
          ✕ Remove
        </button>
      </div>
    `;

    container.appendChild(row);
  });

  // Attach input listeners for state sync and validation
  container.querySelectorAll('.member-name-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const item = teamMembers.find(m => m.id === e.target.dataset.id);
      if (item) item.name = e.target.value.trim();
      checkFormValidity();
    });
  });

  container.querySelectorAll('.member-dept-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const item = teamMembers.find(m => m.id === e.target.dataset.id);
      if (item) item.department = e.target.value.trim();
      checkFormValidity();
    });
  });

  container.querySelectorAll('.member-year-input').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const item = teamMembers.find(m => m.id === e.target.dataset.id);
      if (item) item.year = e.target.value;
      checkFormValidity();
    });
  });

  // Remove handlers
  container.querySelectorAll('.remove-member-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      teamMembers = teamMembers.filter(m => m.id !== id);
      renderTeamRows();
      updateCalculation();
      checkFormValidity();
    });
  });

  // Update button state
  if (addBtn) {
    if (teamMembers.length >= MAX_TEAM_MEMBERS) {
      addBtn.disabled = true;
      addBtn.textContent = 'Max Members Added (4 Total)';
    } else {
      addBtn.disabled = false;
      addBtn.textContent = `+ Add Team Member (${teamMembers.length}/${MAX_TEAM_MEMBERS})`;
    }
  }
}

// Live calculation initialization
function initCalculation() {
  updateCalculation();
}

// Update live payment amount & labels
export function updateCalculation() {
  const totalHeads = 1 + teamMembers.length;
  const totalAmount = totalHeads * FEE_PER_HEAD;

  const totalDisplay = document.getElementById('total-amount-display');
  const qrPayableAmount = document.getElementById('qr-payable-amount');
  const hiddenAmount = document.getElementById('total_amount_hidden');
  const breakdownDisplay = document.getElementById('amount-calc-breakdown');
  const headcountBadge = document.getElementById('team-headcount-badge');
  const termsAmountText = document.getElementById('terms-amount-text');
  const paymentBadge = document.getElementById('payment-status-badge');

  if (totalDisplay) totalDisplay.textContent = `₹${totalAmount}`;
  if (qrPayableAmount) qrPayableAmount.textContent = `₹${totalAmount}`;
  if (hiddenAmount) hiddenAmount.value = totalAmount;

  if (breakdownDisplay) {
    if (teamMembers.length === 0) {
      breakdownDisplay.textContent = `Calculation: ₹${FEE_PER_HEAD} × 1 head = ₹${totalAmount} (Solo)`;
    } else {
      breakdownDisplay.textContent = `Calculation: ₹${FEE_PER_HEAD} × ${totalHeads} heads (1 Lead + ${teamMembers.length} ${teamMembers.length === 1 ? 'Member' : 'Members'}) = ₹${totalAmount}`;
    }
  }

  if (headcountBadge) {
    if (teamMembers.length === 0) {
      headcountBadge.textContent = '1 (Solo)';
    } else {
      headcountBadge.textContent = `${totalHeads} (Lead + ${teamMembers.length} ${teamMembers.length === 1 ? 'Member' : 'Members'})`;
    }
  }

  if (termsAmountText) {
    termsAmountText.textContent = `₹${totalAmount}`;
  }

  if (paymentBadge) {
    paymentBadge.textContent = `₹${totalAmount} Total (${totalHeads} ${totalHeads === 1 ? 'Head' : 'Heads'})`;
  }
}

// ==========================================================================
// Payment Screenshot Upload & Preview Handler
// ==========================================================================
function initScreenshotUpload() {
  const fileInput = document.getElementById('payment_screenshot');
  const dropzoneBox = document.getElementById('upload-dropzone-box');
  const previewWrap = document.getElementById('upload-preview-wrap');
  const previewImg = document.getElementById('upload-preview-img');
  const previewFilename = document.getElementById('preview-filename');
  const previewFilesize = document.getElementById('preview-filesize');
  const removeBtn = document.getElementById('remove-screenshot-btn');

  if (!fileInput || !dropzoneBox) return;

  fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
  });

  // Drag & drop styling
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzoneBox.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzoneBox.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzoneBox.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzoneBox.classList.remove('dragover');
    });
  });

  dropzoneBox.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  function handleFile(file) {
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG, JPEG).', 'error');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file size exceeds 5MB limit. Please compress or select a smaller screenshot.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      screenshotBase64 = event.target.result;
      screenshotName = file.name;

      if (previewImg) previewImg.src = screenshotBase64;
      if (previewFilename) previewFilename.textContent = file.name;
      if (previewFilesize) previewFilesize.textContent = `${(file.size / 1024).toFixed(1)} KB`;

      dropzoneBox.style.display = 'none';
      if (previewWrap) previewWrap.style.display = 'flex';

      showToast('Payment screenshot attached successfully!', 'success');
      checkFormValidity();
    };

    reader.readAsDataURL(file);
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      screenshotBase64 = null;
      screenshotName = '';
      fileInput.value = '';
      if (previewImg) previewImg.src = '';
      if (previewWrap) previewWrap.style.display = 'none';
      dropzoneBox.style.display = 'block';
      checkFormValidity();
    });
  }
}

// ==========================================================================
// Form Validation & Submit Button State Management
// ==========================================================================
function initFormValidation() {
  const form = document.getElementById('registration-form');
  if (!form) return;

  // Listen to inputs
  form.querySelectorAll('input, select').forEach(field => {
    field.addEventListener('input', checkFormValidity);
    field.addEventListener('change', checkFormValidity);
  });

  // Submit handler
  form.addEventListener('submit', handleFormSubmit);

  // Initial validity check
  checkFormValidity();
}

export function checkFormValidity() {
  const form = document.getElementById('registration-form');
  const submitBtn = document.getElementById('submit-btn');
  const submitHelp = document.getElementById('submit-help-text');
  if (!form || !submitBtn) return;

  let isValid = true;

  // 1. Primary details
  const fullName = document.getElementById('full_name')?.value.trim();
  const collegeName = document.getElementById('college_name')?.value.trim();
  const department = document.getElementById('department')?.value.trim();
  const year = document.getElementById('year')?.value;
  const regNumber = document.getElementById('register_number')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const phone = document.getElementById('phone')?.value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  if (!fullName || !collegeName || !department || !year || !regNumber) {
    isValid = false;
  }
  if (!email || !emailRegex.test(email)) {
    isValid = false;
  }
  if (!phone || !phoneRegex.test(phone)) {
    isValid = false;
  }

  // 2. Technical & Non-Technical event selection validation
  const selectedEvent = form.querySelector('input[name="event_name"]:checked')?.value || '';
  const selectedNonTech = form.querySelector('input[name="non_technical_event"]:checked')?.value || '';
  const eventError = document.getElementById('event-error');

  if (!selectedEvent) {
    isValid = false;
  }

  // If technical is "None" AND non-technical is either unselected or "None", participant has 0 events!
  const isTechNone = !selectedEvent || selectedEvent === 'None';
  const isNonTechNone = !selectedNonTech || selectedNonTech === 'None';

  if (isTechNone && isNonTechNone) {
    isValid = false;
    if (eventError && selectedEvent === 'None') {
      eventError.textContent = '⚠️ Since "None" is selected for Technical Event, you must select at least ONE Non-Technical Event below.';
      eventError.style.display = 'block';
    }
  } else {
    if (eventError) {
      eventError.style.display = 'none';
    }
  }

  // 3. Team members validation
  for (let m of teamMembers) {
    if (!m.name.trim() || !m.department.trim() || !m.year) {
      isValid = false;
      break;
    }
  }

  // 4. Payment UTR (min 6 chars, alphanumeric)
  const paymentRef = document.getElementById('payment_ref')?.value.trim();
  if (!paymentRef || paymentRef.length < 6) {
    isValid = false;
  }

  // 5. Terms checkbox
  const termsChecked = document.getElementById('terms')?.checked;
  if (!termsChecked) {
    isValid = false;
  }

  // Update button state
  submitBtn.disabled = !isValid;
  if (submitHelp) {
    if (isValid) {
      submitHelp.textContent = '✓ All fields verified! Ready to register.';
      submitHelp.style.color = 'var(--color-success)';
    } else {
      submitHelp.textContent = 'Submit activates once primary fields, at least 1 event (Technical or Non-Technical), team details, payment UTR, and terms are filled.';
      submitHelp.style.color = 'var(--silver-muted)';
    }
  }

  return isValid;
}

// ==========================================================================
// Form Submission & API Dispatch
// ==========================================================================
async function handleFormSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('registration-form');
  const submitBtn = document.getElementById('submit-btn');
  const errorBanner = document.getElementById('form-error-banner');
  const errorText = document.getElementById('form-error-text');

  if (!checkFormValidity()) {
    showToast('Please fill all required fields correctly.', 'error');
    if (errorBanner) errorBanner.style.display = 'flex';
    return;
  }

  if (errorBanner) errorBanner.style.display = 'none';

  // Gather payload
  const formData = new FormData(form);

  // Selected non-technical event (single choice)
  const selectedNonTech = form.querySelector('input[name="non_technical_event"]:checked')?.value || '';
  const nonTechEvents = (selectedNonTech && selectedNonTech !== 'None') ? [selectedNonTech] : [];

  const eventName = formData.get('event_name')?.toString().trim();
  if ((!eventName || eventName === 'None') && nonTechEvents.length === 0) {
    showToast('Please select at least one event (Technical or Non-Technical) to participate in.', 'error');
    if (errorBanner) {
      errorText.textContent = 'Please select at least one event: choose a Technical event or a Non-Technical event.';
      errorBanner.style.display = 'flex';
    }
    return;
  }

  const totalAmount = (1 + teamMembers.length) * FEE_PER_HEAD;

  const payload = {
    full_name: formData.get('full_name')?.toString().trim(),
    college_name: formData.get('college_name')?.toString().trim(),
    department: formData.get('department')?.toString().trim(),
    year: formData.get('year')?.toString().trim(),
    section: 'NA',
    register_number: formData.get('register_number')?.toString().trim(),
    email: formData.get('email')?.toString().trim(),
    phone: formData.get('phone')?.toString().trim(),
    event_name: formData.get('event_name')?.toString().trim(),
    non_technical_events: nonTechEvents,
    team_members: teamMembers.map(m => ({
      name: m.name.trim(),
      department: m.department.trim(),
      year: m.year
    })),
    total_amount: totalAmount,
    payment_ref: formData.get('payment_ref')?.toString().trim(),
    payment_screenshot: screenshotBase64 || null,
    screenshot_filename: screenshotName || null
  };

  // Loading state
  submitBtn.disabled = true;
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = 'Submitting Registration... <span style="display:inline-block; animation: spin 1s linear infinite;">⏳</span>';

  const apiBase = getApiBaseUrl();
  let registerUrl = `${apiBase}/api/register`;

  try {
    let response = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    // If static server (e.g. VS Code Live Server on port 5500) returns 405 Method Not Allowed,
    // automatically retry via FastAPI dev server on port 3000!
    if (response.status === 405 && !apiBase) {
      console.warn('Current origin returned HTTP 405. Retrying via http://127.0.0.1:3000/api/register ...');
      try {
        response = await fetch('http://127.0.0.1:3000/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } catch (retryErr) {
        console.warn('Retry to http://127.0.0.1:3000 failed:', retryErr);
      }
    }

    let result = {};
    try {
      const text = await response.text();
      result = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.warn('Response parsing error:', parseErr);
      result = { success: false, detail: `Server returned non-JSON response (HTTP ${response.status})` };
    }

    if (response.ok && result.success) {
      // Store in sessionStorage for success page & receipt generator
      sessionStorage.setItem('zentrix_registration', JSON.stringify({
        ...payload,
        id: result.registration_id || `ZX26-${Math.floor(10000 + Math.random() * 90000)}`,
        created_at: new Date().toISOString()
      }));

      showToast('Registration successful! Redirecting to confirmation...', 'success');
      setTimeout(() => {
        window.location.href = `register-success.html?reg_id=${encodeURIComponent(result.registration_id || '')}`;
      }, 1000);
    } else {
      let errMsg = result.detail || result.message;
      if (response.status === 405) {
        errMsg = 'HTTP 405: Static server cannot process POST. Please open the website at http://localhost:3000 or ensure "python dev_server.py" is running.';
      } else if (!errMsg) {
        errMsg = `Registration submission failed (HTTP ${response.status}).`;
      }
      throw new Error(errMsg);
    }
  } catch (err) {
    console.error('Submission error:', err);
    let userMsg = err.message || 'Registration submission failed.';
    if (userMsg.includes('Failed to fetch') || userMsg.includes('NetworkError')) {
      userMsg = '⚠️ Backend Server Offline: Cannot connect to http://localhost:3000. Please ensure "python dev_server.py" is running in your terminal!';
    }

    if (errorBanner && errorText) {
      errorText.textContent = userMsg;
      errorBanner.style.display = 'flex';
    }
    showToast(userMsg, 'error', 6000);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

export function getTeamMembers() {
  return teamMembers;
}
