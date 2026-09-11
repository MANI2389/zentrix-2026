/**
 * ZENTRIX 2K26 — Core Frontend JavaScript
 * Mobile menu, smooth scrolling, toast alerts
 */

/**
 * Automatically determine backend API base URL:
 * - If running on Live Server / static port (e.g. 5500, 5501, 8080) or file://, route to active FastAPI dev server on http://127.0.0.1:3000
 * - If running on dev_server (port 3000) or deployed to Vercel/production, use relative URL ('')
 */
export function getApiBaseUrl() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const port = window.location.port;

  if ((isLocalhost && port && port !== '3000') || window.location.protocol === 'file:') {
    return 'http://127.0.0.1:3000';
  }
  return '';
}

export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Mobile navigation toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('nav-toggle-btn');
  const navLinks = document.getElementById('nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }
});
