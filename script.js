/**
 * Countdown Landing Page JavaScript
 * Target: December 6 (06/12)
 * Features: High-precision countdown, SVG progress rings, particle canvas,
 * Web Audio sound effects, custom confetti engine, calendar export & share.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Calculate Target Date: Upcoming Sunday at 22:00 (Marina Herzliya)
  function getTargetDate() {
    const now = new Date();
    // Specific date for this upcoming Sunday: October 25, 2026 at 22:00
    const specificTarget = new Date(2026, 9, 25, 22, 0, 0, 0); // Month is 0-indexed (9 = Oct)

    // If currently before or within the evening of this date:
    if (now.getTime() <= specificTarget.getTime() + 6 * 60 * 60 * 1000) {
      return specificTarget;
    }

    // Dynamic fallback for any upcoming Sunday at 22:00:
    const day = now.getDay();
    const daysToAdd = (7 - day) % 7 || 7;
    const nextSun = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd, 22, 0, 0, 0);
    return nextSun;
  }

  const targetDate = getTargetDate();

  // Define reference start date (4 days prior for progress bar calculation)
  const totalDurationDays = 4;
  const startDate = new Date(targetDate.getTime() - totalDurationDays * 24 * 60 * 60 * 1000);

  // DOM Elements - Time display
  const daysEl = document.getElementById('days-val');
  const hoursEl = document.getElementById('hours-val');
  const minutesEl = document.getElementById('minutes-val');
  const secondsEl = document.getElementById('seconds-val');

  // SVG Progress Rings (Circumference: 2 * PI * 70 = 439.82)
  const RING_CIRCUMFERENCE = 2 * Math.PI * 70;
  const circleDays = document.getElementById('circle-days');
  const circleHours = document.getElementById('circle-hours');
  const circleMinutes = document.getElementById('circle-minutes');
  const circleSeconds = document.getElementById('circle-seconds');

  // Overall Timeline bar
  const overallProgressBar = document.getElementById('overall-progress-bar');
  const overallPercentage = document.getElementById('overall-percentage');

  // Celebration & Sound
  const celebrationBanner = document.getElementById('celebration-banner');
  const demoCelebrateBtn = document.getElementById('demo-celebrate-btn');
  const resetCelebrationBtn = document.getElementById('reset-celebration-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-icon');

  // Action Buttons
  const addToCalendarBtn = document.getElementById('add-to-calendar-btn');
  const calendarMenu = document.getElementById('calendar-menu');
  const calGoogle = document.getElementById('cal-google');
  const calIcs = document.getElementById('cal-ics');
  const shareBtn = document.getElementById('share-btn');
  const copyLinkBtn = document.getElementById('copy-link-btn');

  // Form & Footer
  const subscribeForm = document.getElementById('subscribe-form');
  const subscriberEmail = document.getElementById('subscriber-email');
  const subscribeStatus = document.getElementById('subscribe-status');
  const liveLocalTime = document.getElementById('live-local-time');

  // State Variables
  let soundEnabled = false;
  let audioCtx = null;
  let prevSeconds = null;
  let prevMinutes = null;
  let prevHours = null;
  let prevDays = null;
  let isCelebrationActive = false;

  // Initialize ring dash arrays
  [circleDays, circleHours, circleMinutes, circleSeconds].forEach(circle => {
    if (circle) {
      circle.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
      circle.style.strokeDashoffset = RING_CIRCUMFERENCE;
    }
  });

  // Helper: Pad numbers with leading zero
  const padZero = (n) => String(n).padStart(2, '0');

  // Helper: Trigger digit change animation
  function animateDigitChange(element, newVal) {
    if (element.textContent !== newVal) {
      element.textContent = newVal;
      element.style.transform = 'scale(1.15)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 150);
    }
  }

  // Web Audio Context for gentle ticking and celebration
  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTickSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function playCelebrationFanfare() {
    initAudio();
    if (!audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.5);
        } catch (err) {}
      }, idx * 160);
    });
  }

  // Sound Toggle Handler
  soundToggleBtn.addEventListener('click', () => {
    initAudio();
    soundEnabled = !soundEnabled;
    soundIcon.textContent = soundEnabled ? '🔊' : '🔇';
    showToast(soundEnabled ? 'צליל תקתוק הופעל 🔊' : 'צליל תקתוק הושתק 🔇');
  });

  // Toast Notification System
  function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  // Update Countdown Function
  function updateCountdown() {
    const currentNow = new Date();
    const diff = targetDate.getTime() - currentNow.getTime();

    // Live Local Time Display
    if (liveLocalTime) {
      liveLocalTime.textContent = currentNow.toLocaleTimeString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    if (diff <= 0) {
      // Reached Target!
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';

      [circleDays, circleHours, circleMinutes, circleSeconds].forEach(c => {
        if (c) c.style.strokeDashoffset = '0';
      });

      if (!isCelebrationActive) {
        triggerCelebration();
      }
      return;
    }

    // Time calculations
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Update Digits with animation
    if (days !== prevDays) {
      animateDigitChange(daysEl, padZero(days));
      prevDays = days;
    }
    if (hours !== prevHours) {
      animateDigitChange(hoursEl, padZero(hours));
      prevHours = hours;
    }
    if (minutes !== prevMinutes) {
      animateDigitChange(minutesEl, padZero(minutes));
      prevMinutes = minutes;
    }
    if (seconds !== prevSeconds) {
      animateDigitChange(secondsEl, padZero(seconds));
      playTickSound();
      prevSeconds = seconds;
    }

    // Update Circular SVG Rings
    if (circleSeconds) {
      const secOffset = RING_CIRCUMFERENCE * (1 - seconds / 60);
      circleSeconds.style.strokeDashoffset = secOffset;
    }
    if (circleMinutes) {
      const minOffset = RING_CIRCUMFERENCE * (1 - (minutes + seconds / 60) / 60);
      circleMinutes.style.strokeDashoffset = minOffset;
    }
    if (circleHours) {
      const hrOffset = RING_CIRCUMFERENCE * (1 - (hours + minutes / 60) / 24);
      circleHours.style.strokeDashoffset = hrOffset;
    }
    if (circleDays) {
      const dayOffset = RING_CIRCUMFERENCE * (1 - Math.min(days, totalDurationDays) / totalDurationDays);
      circleDays.style.strokeDashoffset = dayOffset;
    }

    // Overall Progress Bar Calculation
    const totalTimeSpan = targetDate.getTime() - startDate.getTime();
    const elapsedTime = currentNow.getTime() - startDate.getTime();
    const percentComplete = Math.min(100, Math.max(0, (elapsedTime / totalTimeSpan) * 100));
    
    if (overallProgressBar && overallPercentage) {
      overallProgressBar.style.width = `${percentComplete.toFixed(1)}%`;
      overallPercentage.textContent = `${percentComplete.toFixed(1)}% הושלם`;
    }
  }

  // Run immediately and every 100ms for responsiveness
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Confetti Particle System
  const confettiCanvas = document.createElement('canvas');
  confettiCanvas.id = 'confetti-canvas';
  confettiCanvas.style.position = 'fixed';
  confettiCanvas.style.top = '0';
  confettiCanvas.style.left = '0';
  confettiCanvas.style.width = '100%';
  confettiCanvas.style.height = '100%';
  confettiCanvas.style.zIndex = '999';
  confettiCanvas.style.pointerEvents = 'none';
  document.body.appendChild(confettiCanvas);
  const confettiCtx = confettiCanvas.getContext('2d');

  let confettiParticles = [];
  let confettiAnimFrame = null;

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfetti);
  resizeConfetti();

  const confettiColors = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];

  function spawnConfetti(count = 120) {
    for (let i = 0; i < count; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * -confettiCanvas.height * 0.5,
        w: Math.random() * 12 + 6,
        h: Math.random() * 8 + 4,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 5 + 3,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 8,
        opacity: 1
      });
    }

    if (!confettiAnimFrame) {
      renderConfetti();
    }
  }

  function renderConfetti() {
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (let i = 0; i < confettiParticles.length; i++) {
      const p = confettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vr;
      p.opacity -= 0.003;

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.rotation * Math.PI) / 180);
      confettiCtx.fillStyle = p.color;
      confettiCtx.globalAlpha = Math.max(0, p.opacity);
      confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      confettiCtx.restore();
    }

    confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height + 20 && p.opacity > 0);

    if (confettiParticles.length > 0) {
      confettiAnimFrame = requestAnimationFrame(renderConfetti);
    } else {
      confettiAnimFrame = null;
    }
  }

  // Trigger Celebration Function
  function triggerCelebration() {
    isCelebrationActive = true;
    celebrationBanner.classList.remove('hidden');
    celebrationBanner.setAttribute('aria-hidden', 'false');
    spawnConfetti(160);
    playCelebrationFanfare();
    showToast('הספירה הגיעה לסיומה! הדייט במרינה הרצליה מתחיל עכשיו! ⛵🥂💖');
  }

  demoCelebrateBtn.addEventListener('click', () => {
    triggerCelebration();
  });

  resetCelebrationBtn.addEventListener('click', () => {
    isCelebrationActive = false;
    celebrationBanner.classList.add('hidden');
    celebrationBanner.setAttribute('aria-hidden', 'true');
    showToast('חזרת למצב שעון רגיל');
  });

  // Ambient Starfield Canvas
  const particlesCanvas = document.getElementById('particles-canvas');
  if (particlesCanvas) {
    const ctx = particlesCanvas.getContext('2d');
    let stars = [];
    const starCount = 65;

    function resizeParticles() {
      particlesCanvas.width = window.innerWidth;
      particlesCanvas.height = window.innerHeight;
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * particlesCanvas.width,
          y: Math.random() * particlesCanvas.height,
          radius: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.7 + 0.2,
          speed: Math.random() * 0.3 + 0.1
        });
      }
    }
    window.addEventListener('resize', resizeParticles);
    resizeParticles();

    function renderParticles() {
      ctx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
      for (let star of stars) {
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = particlesCanvas.height;
          star.x = Math.random() * particlesCanvas.width;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(renderParticles);
    }
    renderParticles();
  }

  // Calendar Integration
  // Format Date for Calendar URL (YYYYMMDDTHHmmssZ)
  function formatCalDate(date) {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
  }

  // Google Calendar Link Setup
  const eventTitle = encodeURIComponent('דייט לילי במרינה הרצליה ⛵✨');
  const eventDetails = encodeURIComponent('דייט רומנטי מול היאכטות והבריזה של מרינה הרצליה! יום ראשון ב-22:00 בלילה 🌊🥂');
  const eventLocation = encodeURIComponent('מרינה הרצליה');
  const calStart = formatCalDate(targetDate);
  const calEnd = formatCalDate(new Date(targetDate.getTime() + 3 * 60 * 60 * 1000)); // +3 hours celebration

  calGoogle.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${calStart}/${calEnd}&details=${eventDetails}&location=${eventLocation}`;

  // Download iCal (.ics) File
  calIcs.addEventListener('click', (e) => {
    e.preventDefault();
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Marina Herzliya Date//HE',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:דייט לילי במרינה הרצליה ⛵✨`,
      `DESCRIPTION:דייט רומנטי במרינה הרצליה ביום ראשון ב-22:00 בלילה!`,
      `LOCATION:מרינה הרצליה`,
      `DTSTART:${calStart}`,
      `DTEND:${calEnd}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'marina-date.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    calendarMenu.classList.add('hidden');
    showToast('קובץ יומן (ICS) הורד בהצלחה 📅');
  });

  // Toggle Calendar Menu
  addToCalendarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    calendarMenu.classList.toggle('hidden');
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!calendarMenu.contains(e.target) && e.target !== addToCalendarBtn) {
      calendarMenu.classList.add('hidden');
    }
  });

  // Share & Copy Actions
  function copyPageLink() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('הקישור לדייט הועתק בהצלחה! 💖');
      }).catch(() => {
        showToast('לא ניתן להעתיק את הקישור אוטומטית.');
      });
    } else {
      showToast('הדפדפן אינו תומך בהעתקה אוטומטית.');
    }
  }

  copyLinkBtn.addEventListener('click', copyPageLink);

  shareBtn.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'הדייט שלנו במרינה הרצליה | יום ראשון ב-22:00 ⛵',
          text: 'סופרים לאחור לדייט שלנו ביום ראשון הקרוב ב-22:00 בלילה במרינה הרצליה! 🌊✨',
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      copyPageLink();
    }
  });

  // Wish / Note Form Handler
  subscribeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const noteText = subscriberEmail.value.trim();
    if (!noteText) return;

    // Save wishlist note to local storage
    let wishes = [];
    try {
      wishes = JSON.parse(localStorage.getItem('birthday_date_wishes') || '[]');
    } catch (err) {}

    wishes.push({ note: noteText, date: new Date().toISOString() });
    localStorage.setItem('birthday_date_wishes', JSON.stringify(wishes));

    subscribeStatus.className = 'subscribe-status success';
    subscribeStatus.textContent = '💖 איזה כיף! הבקשה שלך נשמרה בסוד, אדאג לזה לדייט שלנו במרינה!';
    subscriberEmail.value = '';
    showToast('הפתק שלך נשלח בהצלחה! 💌');

    setTimeout(() => {
      subscribeStatus.textContent = '';
      subscribeStatus.className = 'subscribe-status';
    }, 6000);
  });
});
