/**
 * ZENTRIX 2K26 — Registration Receipt & PDF Generator
 * Powered by jsPDF for client-side official PDF generation
 */

import { showToast } from './main.js';

let registrationData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadRegistrationData();
  initCopyButton();
  initPDFDownload();
});

// Load registration from sessionStorage or URL
function loadRegistrationData() {
  const params = new URLSearchParams(window.location.search);
  const regIdFromUrl = params.get('reg_id');

  const stored = sessionStorage.getItem('zentrix_registration');
  if (stored) {
    try {
      registrationData = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse registration session:', e);
    }
  }

  // Fallback demo data if visited directly
  if (!registrationData) {
    registrationData = {
      id: regIdFromUrl || 'ZX26-DEMO01',
      full_name: 'Candidate Name',
      college_name: 'The Kavery Engineering College',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      section: 'A',
      register_number: '611223104001',
      email: 'candidate@thekavery.org',
      phone: '9876543210',
      event_name: 'Startup Spark',
      non_technical_events: ['Cinespark', 'Meme Creation'],
      team_members: [
        { name: 'Team Member 1', department: 'CSE', year: '3rd Year' },
        { name: 'Team Member 2', department: 'IT', year: '3rd Year' }
      ],
      total_amount: 600,
      payment_ref: '425689123456',
      created_at: new Date().toISOString()
    };
  } else if (regIdFromUrl && !registrationData.id) {
    registrationData.id = regIdFromUrl;
  }

  populateUI(registrationData);
}

// Populate UI Elements with Registration Data
function populateUI(data) {
  const regIdEl = document.getElementById('display-reg-id');
  const eventNameEl = document.getElementById('display-event-name');
  const nonTechEventsEl = document.getElementById('display-nontech-events');
  const leadNameEl = document.getElementById('display-lead-name');
  const leadCollegeEl = document.getElementById('display-lead-college');
  const leadDeptEl = document.getElementById('display-lead-dept');
  const leadYearSecEl = document.getElementById('display-lead-year-sec');
  const leadRegnoEl = document.getElementById('display-lead-regno');
  const leadPhoneEl = document.getElementById('display-lead-phone');
  const teamCountEl = document.getElementById('display-team-count');
  const teamListEl = document.getElementById('display-team-list');
  const amountPaidEl = document.getElementById('display-amount-paid');
  const headsCalcEl = document.getElementById('display-heads-calc');
  const utrEl = document.getElementById('display-utr');

  if (regIdEl) regIdEl.textContent = data.id || 'ZX26-PENDING';
  if (eventNameEl) {
    if (data.event_name && data.event_name !== 'None') {
      eventNameEl.textContent = `🚀 ${data.event_name}`;
    } else {
      eventNameEl.textContent = '🚫 None (Non-Technical Track Only)';
    }
  }

  if (nonTechEventsEl) {
    if (data.non_technical_events && data.non_technical_events.length > 0) {
      nonTechEventsEl.innerHTML = data.non_technical_events.map(ev => 
        `<span class="badge badge-nontech" style="margin-right: 6px; margin-top: 4px;">${escapeHtml(ev)}</span>`
      ).join('');
    } else {
      nonTechEventsEl.textContent = 'None selected (Can join on-spot)';
    }
  }

  if (leadNameEl) leadNameEl.textContent = data.full_name || '—';
  if (leadCollegeEl) leadCollegeEl.textContent = data.college_name || '—';
  if (leadDeptEl) leadDeptEl.textContent = data.department || '—';
  if (leadYearSecEl) leadYearSecEl.textContent = data.year || '—';
  if (leadRegnoEl) leadRegnoEl.textContent = data.register_number || '—';
  if (leadPhoneEl) leadPhoneEl.textContent = data.phone || '—';

  // Team Members
  const members = data.team_members || [];
  if (teamCountEl) teamCountEl.textContent = members.length;

  if (teamListEl) {
    if (members.length === 0) {
      teamListEl.innerHTML = '<p class="text-muted" style="font-size: 0.88rem;">Solo participant (No additional team members).</p>';
    } else {
      teamListEl.innerHTML = members.map((m, idx) => `
        <div style="background: var(--bg-surface); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-sm); padding: 8px 14px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong style="color: #FFF; font-size: 0.9rem;">Member #${idx + 1}: ${escapeHtml(m.name)}</strong>
            <div class="text-muted" style="font-size: 0.78rem;">${escapeHtml(m.department)} • ${escapeHtml(m.year)}</div>
          </div>
          <span class="badge badge-tech" style="font-size: 0.75rem;">Verified Member</span>
        </div>
      `).join('');
    }
  }

  // Fees & UTR
  const heads = 1 + members.length;
  const amount = data.total_amount || (heads * 200);

  if (amountPaidEl) amountPaidEl.textContent = `₹${amount}`;
  if (headsCalcEl) headsCalcEl.textContent = `₹200 × ${heads} ${heads === 1 ? 'head' : 'heads'}`;
  if (utrEl) utrEl.textContent = data.payment_ref || 'Pending';
}

// Copy Registration ID Button
function initCopyButton() {
  const copyBtn = document.getElementById('copy-reg-id-btn');
  const regIdEl = document.getElementById('display-reg-id');

  if (copyBtn && regIdEl) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(regIdEl.textContent.trim());
        copyBtn.textContent = 'Copied!';
        showToast(`Registration ID copied: ${regIdEl.textContent.trim()}`, 'success');
        setTimeout(() => copyBtn.textContent = 'Copy ID', 2000);
      } catch (err) {
        showToast('Unable to copy automatically.', 'info');
      }
    });
  }
}

// ==========================================================================
// jsPDF Official Receipt Generator
// ==========================================================================
function initPDFDownload() {
  const downloadBtn = document.getElementById('download-receipt-btn');
  if (!downloadBtn) return;

  downloadBtn.addEventListener('click', generatePDFReceipt);
}

export function generatePDFReceipt() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast('PDF generator library is still loading. Please try again in a moment.', 'warning');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const data = registrationData || {};
  const regId = data.id || 'ZX26-PENDING';
  const members = data.team_members || [];
  const headsCount = 1 + members.length;

  // Page Dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // 1. Decorative Gold & Dark Header Banner
  doc.setFillColor(11, 14, 20); // Dark space
  doc.rect(margin, margin, pageWidth - (margin * 2), 34, 'F');

  // Gold accent top bar
  doc.setFillColor(212, 175, 55); // Cyber Gold
  doc.rect(margin, margin, pageWidth - (margin * 2), 3, 'F');

  // Header Titles
  doc.setTextColor(245, 197, 66); // Bright Gold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('THE KAVERY ENGINEERING COLLEGE (AUTONOMOUS)', pageWidth / 2, margin + 10, { align: 'center' });

  doc.setTextColor(203, 213, 225); // Silver
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Approved by AICTE, Affiliated to Anna University Chennai, Accredited with NAAC A+ Grade', pageWidth / 2, margin + 15, { align: 'center' });
  doc.text('Departments of Computer Science & Engineering, Information Technology & AI & DS', pageWidth / 2, margin + 19, { align: 'center' });
  doc.text('M.Kalipatti(PO), Mecheri, Mettur(Tk), Salem District, Tamil Nadu — PIN 636454', pageWidth / 2, margin + 23, { align: 'center' });

  // 2. Receipt Subheader Bar
  doc.setFillColor(245, 197, 66);
  doc.rect(margin, margin + 34, pageWidth - (margin * 2), 9, 'F');
  doc.setTextColor(11, 14, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ZENTRIX 2K26 — OFFICIAL REGISTRATION RECEIPT & E-PASS', pageWidth / 2, margin + 40, { align: 'center' });

  // 3. ID & Date Strip
  let curY = margin + 48;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.rect(margin, curY, pageWidth - (margin * 2), 12);

  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Registration ID:', margin + 4, curY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 130, 20);
  doc.text(regId, margin + 28, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(50, 50, 50);
  doc.text('Date of Reg:', margin + 85, curY + 7);
  doc.setFont('helvetica', 'bold');
  const regDate = data.created_at ? new Date(data.created_at).toLocaleDateString('en-GB') : '25 Sep 2026';
  doc.text(regDate, margin + 104, curY + 7);

  doc.setFont('helvetica', 'normal');
  doc.text('Status:', margin + 135, curY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 150, 90);
  doc.text('CONFIRMED / PAID', margin + 148, curY + 7);

  // 4. Primary Registrant Section
  curY += 16;
  drawSectionHeader(doc, '1. PRIMARY REGISTRANT (TEAM LEAD) DETAILS', margin, curY, pageWidth);

  curY += 7;
  doc.setDrawColor(220, 220, 225);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, curY, pageWidth - (margin * 2), 26, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);

  doc.text('Full Name:', margin + 4, curY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text(data.full_name || '—', margin + 30, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('College Name:', margin + 95, curY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text(truncateText(data.college_name || '—', 35), margin + 120, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Department:', margin + 4, curY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text(data.department || '—', margin + 30, curY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Year of Study:', margin + 95, curY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text(data.year || '—', margin + 120, curY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Register No:', margin + 4, curY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text(data.register_number || '—', margin + 30, curY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Phone / Mobile:', margin + 95, curY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text(data.phone || '—', margin + 120, curY + 20);

  // 5. Events Registered Section
  curY += 30;
  drawSectionHeader(doc, '2. SYMPOSIUM EVENTS REGISTERED', margin, curY, pageWidth);

  curY += 7;
  doc.setDrawColor(220, 220, 225);
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, curY, pageWidth - (margin * 2), 16, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Technical Event:', margin + 4, curY + 6);
  doc.setFont('helvetica', 'bold');
  if (data.event_name && data.event_name !== 'None') {
    doc.setTextColor(190, 130, 20);
    doc.text(data.event_name, margin + 50, curY + 6);
  } else {
    doc.setTextColor(100, 100, 100);
    doc.text('None (Non-Technical Track Only)', margin + 50, curY + 6);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.text('Non-Technical Event:', margin + 4, curY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 50, 150);
  const nonTechList = (data.non_technical_events && data.non_technical_events.length > 0)
    ? data.non_technical_events.join(', ')
    : 'Open for on-spot participation';
  doc.text(truncateText(nonTechList, 65), margin + 50, curY + 12);

  // 6. Team Members Section
  curY += 20;
  drawSectionHeader(doc, `3. TEAM MEMBERS ROSTER (${members.length} Additional Members)`, margin, curY, pageWidth);

  curY += 7;
  if (members.length === 0) {
    doc.setDrawColor(220, 220, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, curY, pageWidth - (margin * 2), 8, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Solo Participation — No additional team members registered.', margin + 4, curY + 5.5);
    curY += 12;
  } else {
    // Table Header
    doc.setFillColor(235, 240, 245);
    doc.rect(margin, curY, pageWidth - (margin * 2), 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);
    doc.text('#', margin + 3, curY + 4.5);
    doc.text('Member Full Name', margin + 12, curY + 4.5);
    doc.text('Department', margin + 90, curY + 4.5);
    doc.text('Year of Study', margin + 145, curY + 4.5);

    curY += 6;
    members.forEach((mem, i) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 30);
      doc.text(String(i + 1), margin + 3, curY + 4.5);
      doc.text(mem.name || '—', margin + 12, curY + 4.5);
      doc.text(mem.department || '—', margin + 90, curY + 4.5);
      doc.text(mem.year || '—', margin + 145, curY + 4.5);
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, curY + 6, pageWidth - margin, curY + 6);
      curY += 6;
    });
    curY += 4;
  }

  // 7. Payment Summary Section
  drawSectionHeader(doc, '4. PAYMENT & TRANSACTION SUMMARY', margin, curY, pageWidth);

  curY += 7;
  doc.setDrawColor(212, 175, 55);
  doc.setFillColor(254, 252, 240);
  doc.rect(margin, curY, pageWidth - (margin * 2), 18, 'FD');

  const totalFee = data.total_amount || (headsCount * 200);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Headcount:', margin + 4, curY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text(`${headsCount} Participant(s)`, margin + 25, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Registration Fee:', margin + 65, curY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text('Rs. 200 per head', margin + 92, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Total Amount Paid:', margin + 130, curY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 120, 10);
  doc.text(`Rs. ${totalFee}`, margin + 160, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('UPI Ref / UTR Number:', margin + 4, curY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text(data.payment_ref || '425689123456', margin + 40, curY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Payee Account:', margin + 95, curY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text('vasukixlnc@okaxis (Vasuki Rajkumar)', margin + 120, curY + 13);

  // 8. Event Schedule & Instructions
  curY += 22;
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, curY, pageWidth - (margin * 2), 22, 'F');
  doc.setDrawColor(200, 210, 220);
  doc.rect(margin, curY, pageWidth - (margin * 2), 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(10, 10, 10);
  doc.text('MANDATORY EVENT DAY INSTRUCTIONS:', margin + 4, curY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  doc.text('1. Date & Time: Friday, 25 September 2026. Reporting at Campus Auditorium by 8:45 AM sharp.', margin + 4, curY + 9);
  doc.text('2. Verification: Please carry this printed receipt or digital PDF alongside your official College ID Card.', margin + 4, curY + 13);
  doc.text('3. Kit & Food Issuance: Food tokens and registration kits will be issued at the desk upon scanning this receipt.', margin + 4, curY + 17);

  // 9. Signature Block
  curY += 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('Student Convenor', margin + 20, curY, { align: 'center' });
  doc.text('Staff Coordinator (CSE/IT/AI&DS)', margin + 90, curY, { align: 'center' });
  doc.text('Principal / HoD', pageWidth - margin - 20, curY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('ZENTRIX 2K26 Committee', margin + 20, curY + 4, { align: 'center' });
  doc.text('The Kavery Engineering College', margin + 90, curY + 4, { align: 'center' });
  doc.text('Authorized Signatory', pageWidth - margin - 20, curY + 4, { align: 'center' });

  // Save the PDF
  const filename = `ZENTRIX2K26_Receipt_${regId}.pdf`;
  doc.save(filename);
  showToast(`Receipt downloaded: ${filename}`, 'success');
}

function drawSectionHeader(doc, title, x, y, pageWidth) {
  doc.setFillColor(30, 35, 45);
  doc.rect(x, y, pageWidth - (x * 2), 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(245, 197, 66);
  doc.text(title, x + 3, y + 4.2);
}

function truncateText(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
