/**
 * ZENTRIX 2K26 — Admin Portal & Dashboard Logic
 * JWT authentication, session handling, analytics metric cards,
 * dynamic search/filtering, detail modal, and SheetJS multi-sheet Excel export.
 */

import { showToast, getApiBaseUrl } from './main.js';

const SESSION_TOKEN_KEY = 'zentrix_admin_jwt';
const SESSION_EMAIL_KEY = 'zentrix_admin_email';

// Global Data Store
let allRegistrations = [];
let filteredRegistrations = [];

document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = !!document.getElementById('admin-login-form');
  const isDashboardPage = !!document.getElementById('dashboard-content');

  if (isLoginPage) {
    initAdminLogin();
  }

  if (isDashboardPage) {
    initDashboard();
  }
});

// ==========================================================================
// 1. Admin Authentication Flow (admin-login.html)
// ==========================================================================
function initAdminLogin() {
  const loginForm = document.getElementById('admin-login-form');
  const submitBtn = document.getElementById('login-submit-btn');
  const errorBanner = document.getElementById('login-error-banner');
  const errorText = document.getElementById('login-error-text');

  if (!loginForm) return;

  // Auto-redirect if already authenticated
  const existingToken = localStorage.getItem(SESSION_TOKEN_KEY) || sessionStorage.getItem(SESSION_TOKEN_KEY);
  if (existingToken) {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('admin-email')?.value.trim();
    const password = document.getElementById('admin-password')?.value;

    if (!email || !password) {
      if (errorBanner && errorText) {
        errorText.textContent = 'Please enter both email and password.';
        errorBanner.style.display = 'flex';
      }
      return;
    }

    if (errorBanner) errorBanner.style.display = 'none';

    // Button loading state
    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Verifying Credentials... ⏳';

    const apiBase = getApiBaseUrl();
    let loginUrl = `${apiBase}/api/admin_login`;

    try {
      let res = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      // If static server (Live Server on port 5500) returns 405, auto-retry to port 3000
      if (res.status === 405 && !apiBase) {
        try {
          res = await fetch('http://127.0.0.1:3000/api/admin_login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          });
        } catch (retryErr) {
          console.warn('Retry to http://127.0.0.1:3000 failed:', retryErr);
        }
      }

      let data = {};
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.warn('Login response parse error:', parseErr);
        data = { success: false, detail: `Server returned non-JSON response (HTTP ${res.status})` };
      }

      if (res.ok && data.success && data.token) {
        sessionStorage.setItem(SESSION_TOKEN_KEY, data.token);
        sessionStorage.setItem(SESSION_EMAIL_KEY, data.email);
        localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        localStorage.setItem(SESSION_EMAIL_KEY, data.email);

        showToast('Login successful! Loading dashboard...', 'success');
        setTimeout(() => {
          window.location.href = 'admin-dashboard.html';
        }, 800);
      } else {
        throw new Error(data.detail || 'Invalid email or password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Fallback for offline/local dev before backend endpoint is active
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('404') || err.message.includes('501') || err.message.includes('405') || err.message.includes('non-JSON') || err.message.includes('Unexpected end of JSON'))) {
        if (email.toLowerCase() === 'admin@thekavery.org' && password === 'admin@zentrix2026') {
          const demoToken = 'demo-admin-jwt-token-zx26';
          sessionStorage.setItem(SESSION_TOKEN_KEY, demoToken);
          sessionStorage.setItem(SESSION_EMAIL_KEY, email);
          localStorage.setItem(SESSION_TOKEN_KEY, demoToken);
          localStorage.setItem(SESSION_EMAIL_KEY, email);
          showToast('Authenticated via local verification. Loading dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
          }, 800);
          return;
        }
      }

      if (errorBanner && errorText) {
        errorText.textContent = err.message || 'Invalid email or password.';
        errorBanner.style.display = 'flex';
      }
      showToast(err.message || 'Invalid email or password.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// ==========================================================================
// 2. Admin Dashboard Management (admin-dashboard.html)
// ==========================================================================
function initDashboard() {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY);
  const adminEmail = sessionStorage.getItem(SESSION_EMAIL_KEY) || localStorage.getItem(SESSION_EMAIL_KEY);

  // Auth Guard
  if (!token) {
    showToast('Admin session expired. Please sign in.', 'warning');
    window.location.href = 'admin-login.html';
    return;
  }

  // Display admin email in badge
  const userDisplay = document.getElementById('admin-user-display');
  if (userDisplay && adminEmail) {
    userDisplay.textContent = `Admin: ${adminEmail}`;
  }

  // Logout button
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_EMAIL_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
      localStorage.removeItem(SESSION_EMAIL_KEY);
      showToast('Logged out successfully.', 'info');
      setTimeout(() => {
        window.location.href = 'admin-login.html';
      }, 500);
    });
  }

  // Refresh data button
  const refreshBtn = document.getElementById('refresh-data-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      fetchDashboardData(true);
    });
  }

  // Filter Listeners
  initFilterListeners();

  // Modal Listeners
  initModalListeners();

  // Excel Export Listener
  initExcelExport();

  // Load initial data
  fetchDashboardData();
}

// Fetch Registrations Data from Backend
async function fetchDashboardData(isManualRefresh = false) {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(SESSION_TOKEN_KEY);
  const tbody = document.getElementById('registrations-table-body');
  const lastUpdated = document.getElementById('last-updated-text');

  if (tbody && !isManualRefresh) {
    tbody.innerHTML = `
      <tr>
        <td colspan="11" style="text-align: center; padding: 40px; color: var(--silver-muted);">
          Connecting to Supabase and fetching attendee data... ⏳
        </td>
      </tr>
    `;
  }

  const apiBase = getApiBaseUrl();
  let registrationsUrl = `${apiBase}/api/admin_registrations`;

  try {
    let res = await fetch(registrationsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // If static server returns 405 or 404, retry via FastAPI port 3000
    if ((res.status === 405 || res.status === 404) && !apiBase) {
      try {
        res = await fetch('http://127.0.0.1:3000/api/admin_registrations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (retryErr) {
        console.warn('Retry to http://127.0.0.1:3000 failed:', retryErr);
      }
    }

    let result = {};
    try {
      const text = await res.text();
      result = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.warn('Dashboard response parse error:', parseErr);
      result = { success: false, detail: `Server returned non-JSON response (HTTP ${res.status})` };
    }

    if (res.ok && result.success) {
      allRegistrations = result.data || [];

      applyFilters();
      updateMetricCards(allRegistrations);

      if (lastUpdated) {
        lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
      }

      if (isManualRefresh) {
        showToast('Dashboard data refreshed successfully.', 'success');
      }
    } else {
      throw new Error(result.detail || 'Failed to fetch registrations.');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    let errorMsg = err.message || 'Failed to connect to registrations database.';
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
      errorMsg = '⚠️ Backend Server Offline: Cannot reach http://localhost:3000. Please ensure "python dev_server.py" is running in your terminal.';
    }

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="11" style="text-align: center; padding: 40px; color: var(--color-error);">
            ${errorMsg}<br>
            <span class="text-muted" style="font-size: 0.8rem; margin-top: 8px; display: block;">
              Local development requires running: <code>python dev_server.py</code>
            </span>
          </td>
        </tr>
      `;
    }
    showToast(errorMsg, 'error', 6000);
  }
}

// ==========================================================================
// 3. Metric Calculations (Headcount, Solo/Team, Revenue, Tracks)
// ==========================================================================
function updateMetricCards(data) {
  const totalRegsEl = document.getElementById('metric-total-regs');
  const totalParticipantsEl = document.getElementById('metric-total-participants');
  const soloRegsEl = document.getElementById('metric-solo-regs');
  const teamRegsEl = document.getElementById('metric-team-regs');
  const totalRevenueEl = document.getElementById('metric-total-revenue');

  // Track counters
  const cStartup = document.getElementById('count-startup-spark');
  const cExpo = document.getElementById('count-project-expo');
  const cBug = document.getElementById('count-bug-hunters');
  const cPrompt = document.getElementById('count-prompt-master');

  // Non-Technical track counters
  const cCinespark = document.getElementById('count-cinespark');
  const cMeme = document.getElementById('count-meme-creation');
  const cLogo = document.getElementById('count-logo-hunting');
  const cVideo = document.getElementById('count-video-quiz');

  let totalParticipants = 0;
  let soloCount = 0;
  let teamCount = 0;
  let totalRevenue = 0;

  const trackCounts = {
    'Startup Spark': 0,
    'Project Expo': 0,
    'Bug Hunters': 0,
    'Prompt Master': 0
  };

  const nonTechCounts = {
    'Cinespark': 0,
    'Meme Creation': 0,
    'Logo Hunting': 0,
    'Video Quiz': 0
  };

  data.forEach(reg => {
    const members = reg.team_members || [];
    const headcount = 1 + (Array.isArray(members) ? members.length : 0);
    totalParticipants += headcount;

    if (headcount > 1) {
      teamCount++;
    } else {
      soloCount++;
    }

    totalRevenue += (reg.total_amount || (headcount * 200));

    // Technical event tally
    if (reg.event_name && trackCounts.hasOwnProperty(reg.event_name)) {
      trackCounts[reg.event_name]++;
    }

    // Non-Technical events tally
    if (Array.isArray(reg.non_technical_events)) {
      reg.non_technical_events.forEach(ev => {
        if (nonTechCounts.hasOwnProperty(ev)) {
          nonTechCounts[ev]++;
        }
      });
    }
  });

  if (totalRegsEl) totalRegsEl.textContent = data.length;
  if (totalParticipantsEl) totalParticipantsEl.textContent = totalParticipants;
  if (soloRegsEl) soloRegsEl.textContent = soloCount;
  if (teamRegsEl) teamRegsEl.textContent = teamCount;
  if (totalRevenueEl) totalRevenueEl.textContent = `₹${totalRevenue.toLocaleString()}`;

  // Update Technical badges
  if (cStartup) cStartup.textContent = trackCounts['Startup Spark'];
  if (cExpo) cExpo.textContent = trackCounts['Project Expo'];
  if (cBug) cBug.textContent = trackCounts['Bug Hunters'];
  if (cPrompt) cPrompt.textContent = trackCounts['Prompt Master'];

  // Update Non-Technical badges
  if (cCinespark) cCinespark.textContent = nonTechCounts['Cinespark'];
  if (cMeme) cMeme.textContent = nonTechCounts['Meme Creation'];
  if (cLogo) cLogo.textContent = nonTechCounts['Logo Hunting'];
  if (cVideo) cVideo.textContent = nonTechCounts['Video Quiz'];
}

// ==========================================================================
// 4. Filtering & Search Logic
// ==========================================================================
function initFilterListeners() {
  const searchInput = document.getElementById('filter-search');
  const eventSelect = document.getElementById('filter-event');
  const nonTechSelect = document.getElementById('filter-nontech');
  const deptSelect = document.getElementById('filter-dept');
  const yearSelect = document.getElementById('filter-year');
  const resetBtn = document.getElementById('reset-filters-btn');

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (eventSelect) eventSelect.addEventListener('change', applyFilters);
  if (nonTechSelect) nonTechSelect.addEventListener('change', applyFilters);
  if (deptSelect) deptSelect.addEventListener('change', applyFilters);
  if (yearSelect) yearSelect.addEventListener('change', applyFilters);

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (eventSelect) eventSelect.value = '';
      if (nonTechSelect) nonTechSelect.value = '';
      if (deptSelect) deptSelect.value = '';
      if (yearSelect) yearSelect.value = '';
      applyFilters();
      showToast('Filters reset.', 'info');
    });
  }
}

function applyFilters() {
  const searchTerm = document.getElementById('filter-search')?.value.toLowerCase().trim() || '';
  const eventVal = document.getElementById('filter-event')?.value || '';
  const nonTechVal = document.getElementById('filter-nontech')?.value || '';
  const deptVal = document.getElementById('filter-dept')?.value || '';
  const yearVal = document.getElementById('filter-year')?.value || '';

  const activeIndicator = document.getElementById('filter-active-indicator');
  const isAnyFilterActive = !!(searchTerm || eventVal || nonTechVal || deptVal || yearVal);
  if (activeIndicator) {
    activeIndicator.style.display = isAnyFilterActive ? 'inline' : 'none';
  }

  filteredRegistrations = allRegistrations.filter(reg => {
    // 1. Search text filter (Name, RegNo, Email, Phone, ID)
    if (searchTerm) {
      const name = (reg.full_name || '').toLowerCase();
      const regNo = (reg.register_number || '').toLowerCase();
      const email = (reg.email || '').toLowerCase();
      const phone = (reg.phone || '').toLowerCase();
      const id = (reg.id || '').toLowerCase();

      const matchesSearch = name.includes(searchTerm) ||
                            regNo.includes(searchTerm) ||
                            email.includes(searchTerm) ||
                            phone.includes(searchTerm) ||
                            id.includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // 2. Technical Event filter
    if (eventVal && reg.event_name !== eventVal) {
      return false;
    }

    // 3. Non-Technical Event filter
    if (nonTechVal) {
      const nonTechList = Array.isArray(reg.non_technical_events) ? reg.non_technical_events : [];
      if (!nonTechList.includes(nonTechVal)) {
        return false;
      }
    }

    // 4. Department filter
    if (deptVal) {
      const regDept = (reg.department || '').toUpperCase();
      if (!regDept.includes(deptVal.toUpperCase())) {
        return false;
      }
    }

    // 5. Year filter
    if (yearVal && reg.year !== yearVal) {
      return false;
    }

    return true;
  });

  // Update showing counters
  const showingEl = document.getElementById('showing-count');
  const totalEl = document.getElementById('total-count');
  if (showingEl) showingEl.textContent = filteredRegistrations.length;
  if (totalEl) totalEl.textContent = allRegistrations.length;

  renderTable(filteredRegistrations);
}

// ==========================================================================
// 5. Render Registrations Data Table
// ==========================================================================
function renderTable(data) {
  const tbody = document.getElementById('registrations-table-body');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" style="text-align: center; padding: 40px; color: var(--silver-muted);">
          No registrations match the selected filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(reg => {
    const members = reg.team_members || [];
    const teamSize = 1 + (Array.isArray(members) ? members.length : 0);
    const dateStr = reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-GB') : '—';
    const amountStr = `₹${reg.total_amount || (teamSize * 200)}`;

    const nonTechBadges = (Array.isArray(reg.non_technical_events) && reg.non_technical_events.length > 0)
      ? reg.non_technical_events.map(ev => `<span class="badge badge-nontech" style="font-size: 0.7rem; margin: 1px 2px; display: inline-block;">${escapeHtml(ev)}</span>`).join('')
      : '<span class="text-muted" style="font-size: 0.75rem;">None</span>';

    return `
      <tr data-id="${escapeHtml(reg.id)}" class="clickable-row">
        <td><strong class="text-gold" style="font-family: monospace;">${escapeHtml(reg.id)}</strong></td>
        <td><strong style="color: #FFF;">${escapeHtml(reg.full_name)}</strong></td>
        <td>${escapeHtml(reg.register_number || '—')}</td>
        <td><span class="badge badge-tech" style="font-size: 0.72rem;">${escapeHtml(reg.department)}</span></td>
        <td>${escapeHtml(reg.year || '—')}</td>
        <td><span class="badge badge-tech" style="font-size: 0.76rem; font-weight: 600;">${escapeHtml(reg.event_name)}</span></td>
        <td>${nonTechBadges}</td>
        <td>
          <span class="badge ${teamSize > 1 ? 'badge-naac' : 'badge-secondary'}" style="font-size: 0.75rem;">
            ${teamSize} ${teamSize === 1 ? 'Head (Solo)' : 'Heads'}
          </span>
        </td>
        <td class="text-gold font-display">${amountStr}</td>
        <td><span style="font-family: monospace; font-size: 0.8rem;">${escapeHtml(reg.payment_ref || '—')}</span></td>
        <td style="font-size: 0.8rem; color: var(--silver-muted);">${dateStr}</td>
        <td>
          <button type="button" class="btn btn-admin view-details-btn" data-id="${escapeHtml(reg.id)}" style="padding: 4px 10px; font-size: 0.75rem;">
            View Details
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Row Click Handlers
  tbody.querySelectorAll('tr.clickable-row').forEach(row => {
    row.addEventListener('click', (e) => {
      // Don't trigger twice if clicked directly on button
      if (e.target.tagName === 'BUTTON') return;
      const regId = row.dataset.id;
      openDetailModal(regId);
    });
  });

  tbody.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const regId = btn.dataset.id;
      openDetailModal(regId);
    });
  });
}

// ==========================================================================
// 6. Detail Modal View
// ==========================================================================
function initModalListeners() {
  const backdrop = document.getElementById('detail-modal-backdrop');
  const closeBtn = document.getElementById('modal-close-btn');
  const closeActionBtn = document.getElementById('modal-close-action-btn');

  function closeModal() {
    if (backdrop) backdrop.classList.remove('open');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeActionBtn) closeActionBtn.addEventListener('click', closeModal);

  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop && backdrop.classList.contains('open')) {
      closeModal();
    }
  });
}

function openDetailModal(regId) {
  const reg = allRegistrations.find(r => r.id === regId);
  if (!reg) return;

  const backdrop = document.getElementById('detail-modal-backdrop');
  if (!backdrop) return;

  // Populate Modal Fields
  document.getElementById('modal-reg-id').textContent = reg.id;
  document.getElementById('modal-created-at').textContent = reg.created_at ? new Date(reg.created_at).toLocaleString('en-GB') : '';
  document.getElementById('modal-event-title').textContent = `Track: ${reg.event_name}`;

  document.getElementById('modal-name').textContent = reg.full_name || '—';
  document.getElementById('modal-college').textContent = reg.college_name || '—';
  document.getElementById('modal-dept').textContent = reg.department || '—';
  document.getElementById('modal-year-sec').textContent = reg.year || '—';
  document.getElementById('modal-regno').textContent = reg.register_number || '—';
  document.getElementById('modal-phone').textContent = reg.phone || '—';
  document.getElementById('modal-email').textContent = reg.email || '—';

  // Non-Technical Events
  const nonTechContainer = document.getElementById('modal-nontech-container');
  if (nonTechContainer) {
    if (reg.non_technical_events && reg.non_technical_events.length > 0) {
      nonTechContainer.innerHTML = reg.non_technical_events.map(ev => 
        `<span class="badge badge-nontech">${escapeHtml(ev)}</span>`
      ).join('');
    } else {
      nonTechContainer.innerHTML = '<span class="text-muted" style="font-size: 0.82rem;">None selected</span>';
    }
  }

  // Team Members
  const members = reg.team_members || [];
  const teamCountEl = document.getElementById('modal-team-count');
  const teamListEl = document.getElementById('modal-team-list');

  if (teamCountEl) teamCountEl.textContent = members.length;
  if (teamListEl) {
    if (members.length === 0) {
      teamListEl.innerHTML = '<p class="text-muted" style="font-size: 0.82rem; margin: 0;">Solo registration (No additional team members).</p>';
    } else {
      teamListEl.innerHTML = members.map((m, idx) => `
        <div style="background: var(--bg-surface); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; font-size: 0.85rem;">
          <div>
            <strong style="color: #FFF;">#${idx + 1}: ${escapeHtml(m.name)}</strong>
            <span class="text-muted"> (${escapeHtml(m.department)} • ${escapeHtml(m.year)})</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Payment info
  const heads = 1 + members.length;
  document.getElementById('modal-amount').textContent = `₹${reg.total_amount || (heads * 200)} (${heads} ${heads === 1 ? 'Head' : 'Heads'})`;
  document.getElementById('modal-utr').textContent = reg.payment_ref || '—';

  // Payment Screenshot Section
  const screenshotSection = document.getElementById('modal-screenshot-section');
  const screenshotImg = document.getElementById('modal-screenshot-img');
  const screenshotLink = document.getElementById('modal-screenshot-link');

  if (screenshotSection && screenshotImg) {
    if (reg.payment_screenshot) {
      screenshotImg.src = reg.payment_screenshot;
      if (screenshotLink) screenshotLink.href = reg.payment_screenshot;
      screenshotSection.style.display = 'block';
    } else {
      screenshotSection.style.display = 'none';
      screenshotImg.src = '';
    }
  }

  // Open Modal
  backdrop.classList.add('open');
}

// ==========================================================================
// 7. Client-Side Excel Export (SheetJS)
// ==========================================================================
function initExcelExport() {
  const exportBtn = document.getElementById('export-excel-btn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', exportToExcel);
}

export function exportToExcel() {
  if (!window.XLSX) {
    showToast('SheetJS library is still loading. Please try again.', 'warning');
    return;
  }

  if (filteredRegistrations.length === 0) {
    showToast('No registrations to export with current filters.', 'warning');
    return;
  }

  const wb = XLSX.utils.book_new();

  // SHEET 1: Registrations (Active filtered rows only)
  const regRows = filteredRegistrations.map((r, idx) => {
    const members = r.team_members || [];
    const teamNames = members.map(m => m.name).join(', ');
    const teamSize = 1 + members.length;

    return {
      "S.No": idx + 1,
      "Registration ID": r.id,
      "Full Name": r.full_name,
      "Register Number": r.register_number,
      "College Name": r.college_name,
      "Department": r.department,
      "Year": r.year,
      "Email": r.email,
      "Phone": r.phone,
      "Technical Event": r.event_name,
      "Non-Technical Events": (r.non_technical_events || []).join(', '),
      "Team Size": teamSize,
      "Team Member Names": teamNames || 'None (Solo)',
      "Amount Paid (INR)": r.total_amount || (teamSize * 200),
      "Payment UTR / Reference": r.payment_ref,
      "Status": r.status || 'confirmed',
      "Registration Date": r.created_at ? new Date(r.created_at).toLocaleString('en-GB') : ''
    };
  });

  const wsRegistrations = XLSX.utils.json_to_sheet(regRows);

  // Auto-fit column widths
  const colWidths = [
    { wch: 6 },  // S.No
    { wch: 14 }, // Reg ID
    { wch: 22 }, // Full Name
    { wch: 16 }, // Reg No
    { wch: 30 }, // College
    { wch: 12 }, // Dept
    { wch: 10 }, // Year
    { wch: 26 }, // Email
    { wch: 14 }, // Phone
    { wch: 18 }, // Tech Event
    { wch: 24 }, // Non-Tech
    { wch: 10 }, // Team Size
    { wch: 32 }, // Team Names
    { wch: 14 }, // Amount
    { wch: 20 }, // UTR
    { wch: 12 }, // Status
    { wch: 20 }  // Date
  ];
  wsRegistrations['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, wsRegistrations, "Registrations");

  // SHEET 2: Summary Analytics
  let totalParticipants = 0;
  let soloCount = 0;
  let teamCount = 0;
  let totalRevenue = 0;

  const trackBreakdown = {
    "Startup Spark": 0,
    "Project Expo": 0,
    "Bug Hunters": 0,
    "Prompt Master": 0
  };

  const nonTechBreakdown = {
    "Cinespark": 0,
    "Meme Creation": 0,
    "Logo Hunting": 0,
    "Video Quiz": 0
  };

  filteredRegistrations.forEach(r => {
    const mems = r.team_members || [];
    const size = 1 + mems.length;
    totalParticipants += size;
    if (size > 1) teamCount++; else soloCount++;
    totalRevenue += (r.total_amount || (size * 200));
    if (trackBreakdown.hasOwnProperty(r.event_name)) {
      trackBreakdown[r.event_name]++;
    }
    if (Array.isArray(r.non_technical_events)) {
      r.non_technical_events.forEach(ev => {
        if (nonTechBreakdown.hasOwnProperty(ev)) {
          nonTechBreakdown[ev]++;
        }
      });
    }
  });

  const summaryData = [
    { "Metric": "Total Registrations (Rows)", "Count / Value": filteredRegistrations.length },
    { "Metric": "Total Attendees (True Headcount)", "Count / Value": totalParticipants },
    { "Metric": "Solo Registrations", "Count / Value": soloCount },
    { "Metric": "Team Registrations", "Count / Value": teamCount },
    { "Metric": "Total Revenue Collected (INR)", "Count / Value": `Rs. ${totalRevenue.toLocaleString()}` },
    { "Metric": "--------------------------", "Count / Value": "------------------" },
    { "Metric": "Tech: Startup Spark", "Count / Value": trackBreakdown["Startup Spark"] },
    { "Metric": "Tech: Project Expo", "Count / Value": trackBreakdown["Project Expo"] },
    { "Metric": "Tech: Bug Hunters", "Count / Value": trackBreakdown["Bug Hunters"] },
    { "Metric": "Tech: Prompt Master", "Count / Value": trackBreakdown["Prompt Master"] },
    { "Metric": "--------------------------", "Count / Value": "------------------" },
    { "Metric": "Non-Tech: Cinespark", "Count / Value": nonTechBreakdown["Cinespark"] },
    { "Metric": "Non-Tech: Meme Creation", "Count / Value": nonTechBreakdown["Meme Creation"] },
    { "Metric": "Non-Tech: Logo Hunting", "Count / Value": nonTechBreakdown["Logo Hunting"] },
    { "Metric": "Non-Tech: Video Quiz", "Count / Value": nonTechBreakdown["Video Quiz"] },
    { "Metric": "--------------------------", "Count / Value": "------------------" },
    { "Metric": "Generated On", "Count / Value": new Date().toLocaleString('en-GB') },
    { "Metric": "Event Name", "Count / Value": "ZENTRIX 2K26 — The Kavery Engineering College" }
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

  // Generate Filename: ZENTRIX2026_Registrations_<YYYY-MM-DD_HHMM>.xlsx
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `ZENTRIX2026_Registrations_${dateStr}_${timeStr}.xlsx`;

  XLSX.writeFile(wb, filename);
  showToast(`Excel exported: ${filename}`, 'success');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
