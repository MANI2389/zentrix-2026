/**
 * ZENTRIX 2K26 — Live Dynamic Countdown Timer
 * Target 1 (Online Registration Deadline): Thursday, 24 September 2026, 12:00:00 PM IST (UTC+05:30)
 * Target 2 (Symposium Event Date): Friday, 25 September 2026, 09:00:00 AM IST (UTC+05:30)
 */

export function initCountdown() {
  const regDeadline = new Date('2026-09-24T12:00:00+05:30').getTime();
  const eventDate = new Date('2026-09-25T09:00:00+05:30').getTime();

  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');
  const labelEl = document.getElementById('cd-label');
  const deadlineDateEl = document.querySelector('.deadline-pill-date');
  if (deadlineDateEl) {
    deadlineDateEl.textContent = '24 September 2026';
  }
  const deadlineTimeEl = document.querySelector('.deadline-pill-time');
  if (deadlineTimeEl) {
    deadlineTimeEl.textContent = '(12:00 PM IST)';
  }

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function renderTime(distance) {
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  function update() {
    const now = new Date().getTime();

    // Online Registration is officially closed! Count down to Symposium Launch (25 Sep 2026, 09:00:00 AM IST)
    if (now < eventDate) {
      if (labelEl && labelEl.textContent !== '⚡ Symposium Starts In ⚡') {
        labelEl.textContent = '⚡ Symposium Starts In ⚡';
      }
      const distance = eventDate - now;
      renderTime(distance);
    }
    // Stage 3: Event is Live Now
    else {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      if (labelEl) labelEl.textContent = '🎉 ZENTRIX 2K26 IS LIVE NOW!';
    }
  }

  update();
  setInterval(update, 1000);
}

// Auto-run if elements exist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCountdown);
} else {
  initCountdown();
}
